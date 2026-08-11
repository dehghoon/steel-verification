from __future__ import annotations

from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app


client = TestClient(app)


def configure_dataset(path) -> None:
    object.__setattr__(settings, "cisc_dataset_path", str(path))


def benchmark_request() -> dict:
    return {
        "section_id": "test-w100x19",
        "designation": "W100X19",
        "dataset_version": "test-approved-2022-04-04",
        "material": {
            "yield_strength": 248.0,
            "ultimate_strength": 414.0,
            "elastic_modulus": 200000.0,
            "shear_modulus": 77000.0,
            "mass_density": 7850.0
        },
        "geometry": {
            "length_major": 500.0,
            "length_minor": 500.0,
            "length_torsional": 500.0,
            "effective_length_factor_major": 0.8,
            "effective_length_factor_minor": 0.8,
            "effective_length_factor_torsional": 0.8
        },
        "actions": {
            "compression_force": 1137.0,
            "tension_force": 8510.0,
            "shear_major": 3820.0,
            "shear_minor": 5930.0,
            "moment_major": 2380000.0,
            "moment_minor": 3630000.0,
            "live_load_deflection": 0.082
        },
        "deflection_limit_ratio": 300.0,
        "continuous_lateral_restraint_confirmed": False,
        "coincident_force_set": False,
        "net_area_equals_gross_confirmed": True
    }


def test_health_and_version() -> None:
    assert client.get("/health").json()["status"] == "ok"
    version = client.get("/version")
    assert version.status_code == 200
    assert version.json()["engineering_specification_version"] == "0.2"


def test_openapi_generation() -> None:
    response = client.get("/openapi.json")
    assert response.status_code == 200
    assert "/api/v1/calculations/w-section" in response.json()["paths"]


def test_sections_are_loaded_from_configured_dataset(approved_dataset) -> None:
    configure_dataset(approved_dataset)
    response = client.get("/api/v1/sections?query=W100&family=W")
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    assert body["items"][0]["id"] == "test-w100x19"


def test_missing_dataset_is_structured_service_error(tmp_path) -> None:
    configure_dataset(tmp_path / "missing.json")
    response = client.get("/api/v1/sections")
    assert response.status_code == 503
    assert response.json()["detail"]["code"] == "CISC_DATASET_UNAVAILABLE"


def test_adapter_preserves_agent2_benchmark(approved_dataset) -> None:
    configure_dataset(approved_dataset)
    response = client.post("/api/v1/calculations/w-section", json=benchmark_request())
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["overall_status"] == "PASS"
    assert body["governing_check"] == "biaxial_bending"
    assert abs(body["values"]["max_uls_utilization"]["raw_value"] * 100 - 44.27) < 0.05
    assert abs(body["values"]["minor_shear_resistance"]["raw_value"] / 1000 - 267.1) < 1.0
    assert "WARN_NONCOINCIDENT_ENVELOPE" in body["warnings"]
    assert body["engine"]["id"] == "ECS-WSECTION-CSA-S16-2019-001"


def test_dataset_version_mismatch_rejected(approved_dataset) -> None:
    configure_dataset(approved_dataset)
    payload = benchmark_request()
    payload["dataset_version"] = "wrong"
    response = client.post("/api/v1/calculations/w-section", json=payload)
    assert response.status_code == 409
    assert response.json()["detail"]["code"] == "CISC_DATASET_VERSION_MISMATCH"


def test_engineering_validation_translated_to_422(approved_dataset) -> None:
    configure_dataset(approved_dataset)
    payload = benchmark_request()
    payload["material"]["ultimate_strength"] = 200.0
    response = client.post("/api/v1/calculations/w-section", json=payload)
    assert response.status_code == 422
    assert response.json()["detail"]["code"] == "ENGINEERING_INPUT_INVALID"


def test_report_preview_is_free_but_official_download_is_denied(approved_dataset) -> None:
    configure_dataset(approved_dataset)
    calc = client.post("/api/v1/calculations/w-section", json=benchmark_request()).json()
    preview = client.post("/api/v1/reports/preview", json={"calculation": calc, "project": {"name": "Test"}})
    assert preview.status_code == 200
    assert preview.json()["status"] == "preview"
    assert preview.json()["official_download_available"] is False

    official = client.post("/api/v1/reports/official")
    assert official.status_code == 403
    assert official.json()["detail"]["code"] == "REPORT_ENTITLEMENT_REQUIRED"
