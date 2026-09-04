from __future__ import annotations

from pathlib import Path

from app.services.cisc import CiscDatasetService


def test_versioned_sst13_dataset_loads_all_unique_sections() -> None:
    dataset_path = Path(__file__).resolve().parents[2] / "data" / "cisc" / "sst13-2026-08-25"
    service = CiscDatasetService(str(dataset_path))

    records, total, version = service.list_sections(
        query=None,
        family=None,
        limit=2000,
        offset=0,
    )

    assert version == "cisc-sst13-2026-08-25"
    assert total == 1705
    assert len(records) == 1705
    assert len({record.designation for record in records}) == 1705
    assert len({record.family for record in records}) == 17
