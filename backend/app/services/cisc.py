from __future__ import annotations

import gzip
import json
from pathlib import Path

from fastapi import HTTPException, status

from app.models.api import SectionRecord


_REQUIRED_PROPERTY_ALIASES = {
    "depth": ("depth",),
    "flange_width": ("flange_width",),
    "flange_thickness": ("flange_thickness",),
    "web_thickness": ("web_thickness",),
    "gross_area": ("gross_area", "area"),
    "moment_of_inertia_major": ("moment_of_inertia_major", "ix"),
    "moment_of_inertia_minor": ("moment_of_inertia_minor", "iy"),
    "elastic_modulus_major": ("elastic_modulus_major", "sx"),
    "elastic_modulus_minor": ("elastic_modulus_minor", "sy"),
    "plastic_modulus_major": ("plastic_modulus_major", "zx"),
    "plastic_modulus_minor": ("plastic_modulus_minor", "zy"),
    "radius_of_gyration_major": ("radius_of_gyration_major", "rx"),
    "radius_of_gyration_minor": ("radius_of_gyration_minor", "ry"),
    "warping_constant": ("warping_constant", "cw"),
    "torsional_constant": ("torsional_constant", "j"),
}


class CiscDatasetService:
    def __init__(self, path: str):
        self.path = Path(path)

    @staticmethod
    def _read_payload(path: Path) -> dict:
        try:
            if path.suffix == ".gz":
                with gzip.open(path, "rt", encoding="utf-8") as stream:
                    payload = json.load(stream)
            else:
                payload = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={
                    "code": "CISC_DATASET_INVALID",
                    "message": "Configured CISC dataset could not be read.",
                },
            ) from exc

        if not isinstance(payload, dict) or not isinstance(payload.get("sections"), list):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={
                    "code": "CISC_DATASET_INVALID",
                    "message": "Dataset must contain a top-level sections array.",
                },
            )

        default_source = payload.get("source")
        default_version = payload.get("dataset_version")
        default_units = payload.get("units")
        for item in payload["sections"]:
            if not isinstance(item, dict):
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail={
                        "code": "CISC_DATASET_INVALID",
                        "message": "Every CISC section record must be an object.",
                    },
                )
            if "source" not in item and isinstance(default_source, str):
                item["source"] = default_source
            if "dataset_version" not in item and isinstance(default_version, str):
                item["dataset_version"] = default_version
            if "units" not in item and isinstance(default_units, dict):
                item["units"] = default_units
        return payload

    def _load_raw(self) -> dict:
        if not self.path.exists():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail={
                    "code": "CISC_DATASET_UNAVAILABLE",
                    "message": "Approved CISC dataset is not configured.",
                },
            )

        if self.path.is_file():
            return self._read_payload(self.path)

        shard_paths = sorted(
            [
                *self.path.glob("*.json"),
                *self.path.glob("*.json.gz"),
            ]
        )
        if not shard_paths:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail={
                    "code": "CISC_DATASET_UNAVAILABLE",
                    "message": "Approved CISC dataset directory contains no dataset shards.",
                },
            )

        version: str | None = None
        sections: list[dict] = []
        for shard_path in shard_paths:
            payload = self._read_payload(shard_path)
            shard_version = payload.get("dataset_version")
            if not isinstance(shard_version, str) or not shard_version.strip():
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail={
                        "code": "CISC_DATASET_INVALID",
                        "message": f"Dataset version is missing in shard {shard_path.name}.",
                    },
                )
            if version is None:
                version = shard_version
            elif version != shard_version:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail={
                        "code": "CISC_DATASET_VERSION_MISMATCH",
                        "message": "CISC dataset shards do not share one approved dataset version.",
                    },
                )
            sections.extend(payload["sections"])

        return {"dataset_version": version, "sections": sections}

    def dataset_version(self) -> str:
        payload = self._load_raw()
        version = payload.get("dataset_version")
        if not isinstance(version, str) or not version.strip():
            raise HTTPException(
                status_code=500,
                detail={"code": "CISC_DATASET_INVALID", "message": "Dataset version is missing."},
            )
        return version

    def list_sections(
        self,
        query: str | None,
        family: str | None,
        limit: int,
        offset: int,
    ) -> tuple[list[SectionRecord], int, str]:
        payload = self._load_raw()
        version = self.dataset_version()
        records = [SectionRecord.model_validate(item) for item in payload["sections"]]
        if query:
            q = query.casefold()
            records = [r for r in records if q in r.designation.casefold()]
        if family:
            f = family.casefold()
            records = [r for r in records if r.family.casefold() == f]
        total = len(records)
        return records[offset : offset + limit], total, version

    def get_section(self, section_id: str, designation: str, dataset_version: str) -> SectionRecord:
        payload = self._load_raw()
        current_version = self.dataset_version()
        if current_version != dataset_version:
            raise HTTPException(
                status_code=409,
                detail={
                    "code": "CISC_DATASET_VERSION_MISMATCH",
                    "message": "Requested section dataset version does not match the configured approved dataset.",
                    "details": {"requested": dataset_version, "current": current_version},
                },
            )
        for raw in payload["sections"]:
            record = SectionRecord.model_validate(raw)
            if record.id == section_id:
                if record.designation.casefold() != designation.casefold():
                    raise HTTPException(
                        status_code=409,
                        detail={
                            "code": "CISC_SECTION_MISMATCH",
                            "message": "Section ID and designation do not identify the same approved record.",
                        },
                    )
                self._validate_engine_properties(record)
                return record
        raise HTTPException(
            status_code=404,
            detail={"code": "CISC_SECTION_NOT_FOUND", "message": "Approved CISC section record was not found."},
        )

    def _validate_engine_properties(self, record: SectionRecord) -> None:
        missing: list[str] = []
        for canonical, aliases in _REQUIRED_PROPERTY_ALIASES.items():
            if not any(alias in record.properties and record.properties[alias] is not None for alias in aliases):
                missing.append(canonical)
        if missing:
            raise HTTPException(
                status_code=422,
                detail={
                    "code": "CISC_SECTION_INCOMPLETE",
                    "message": "Approved section record is missing properties required by the engineering engine.",
                    "details": {"missing": missing},
                },
            )

    @staticmethod
    def property_value(record: SectionRecord, canonical: str) -> float:
        for alias in _REQUIRED_PROPERTY_ALIASES[canonical]:
            value = record.properties.get(alias)
            if value is not None:
                return float(value)
        raise KeyError(canonical)
