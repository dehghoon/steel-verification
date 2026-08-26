from __future__ import annotations

from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app


client = TestClient(app)


def configure_dataset(path) -> None:
    object.__setattr__(settings, "cisc_dataset_path", str(path))


def benchmark_verification() -> dict:
    return {
        "section_id": "test-w100x19",
        "designation": "W100X19",
        "dataset_version": "test-approved-2022-04-04",
        "material": {
            "yield_strength": 248.0,
            "ultimate_strength": 414.0,
            "elastic_modulus": 200000.0,
            "shear_modulus": 77000.0,
            "mass_density": 7850.0,
        },
        "geometry": {
            "length_major": 500.0,
            "length_minor": 500.0,
            "length_torsional": 500.0,
            "effective_length_factor_major": 0.8,
            "effective_length_factor_minor": 0.8,
            "effective_length_factor_torsional": 0.8,
        },
        "actions": {
            "compression_force": 1137.0,
            "tension_force": 8510.0,
            "shear_major": 3820.0,
            "shear_minor": 5930.0,
            "moment_major": 2380000.0,
            "moment_minor": 3630000.0,
            "live_load_deflection": 0.082,
        },
        "deflection_limit_ratio": 300.0,
        "continuous_lateral_restraint_confirmed": False,
        "coincident_force_set": False,
        "net_area_equals_gross_confirmed": True,
    }


def core_v05_payload() -> dict:
    return {
        "modelSchemaVersion": "0.5",
        "projectId": "P-001",
        "runId": "DES-W-001",
        "calculator": "w-section",
        "calculatorVersion": "1.0",
        "targetIds": ["M-001"],
        "inputs": {
            "memberId": "M-001",
            "verification": benchmark_verification(),
            "analysisRunId": "AN-004",
            "loadCombinationId": "ULS-1",
            "forceCoordinateSystem": "member-local",
            "forceStations": [
                {"x": 0.0, "xRatio": 0.0, "axial": -1137.0, "momentZ": 0.0},
                {"x": 125.0, "axial": -1137.0, "momentZ": 1190000.0},
                {"x": 250.0, "xRatio": 0.5, "axial": -1137.0, "momentZ": 2380000.0},
                {"x": 500.0, "xRatio": 1.0, "axial": -1137.0, "momentZ": 0.0},
            ],
        },
    }


def test_core_v05_endpoint_is_in_openapi() -> None:
    response = client.get("/openapi.json")
    assert response.status_code == 200
    assert "/api/v1/calculations/w-section/core/v0.5" in response.json()["paths"]


def test_core_v05_writeback_preserves_ids_and_contract(approved_dataset) -> None:
    configure_dataset(approved_dataset)
    payload = core_v05_payload()

    response = client.post(
        "/api/v1/calculations/w-section/core/v0.5",
        json=payload,
    )

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["modelSchemaVersion"] == "0.5"
    assert body["runId"] == "DES-W-001"
    assert body["designRun"]["id"] == "DES-W-001"
    assert body["designRun"]["targetIds"] == ["M-001"]
    assert body["designRun"]["analysisRunId"] == "AN-004"

    result = body["memberDesignResults"][0]
    assert result["runId"] == "DES-W-001"
    assert result["memberId"] == "M-001"
    assert result["assignedSectionId"] == "test-w100x19"
    assert result["checks"]

    analysis_trace = next(
        item for item in body["trace"] if item["stage"] == "analysis_reference"
    )
    assert analysis_trace["forceCoordinateSystem"] == "member-local"
    assert analysis_trace["stationCount"] == 4


def test_core_v05_accepts_arbitrary_station_count_and_optional_x_ratio(approved_dataset) -> None:
    configure_dataset(approved_dataset)
    payload = core_v05_payload()
    payload["inputs"]["forceStations"] = [
        {"x": 0.0, "axial": -100.0},
        {"x": 100.0, "xRatio": 0.2, "axial": -200.0},
        {"x": 200.0, "axial": -300.0},
        {"x": 300.0, "xRatio": 0.6, "axial": -400.0},
        {"x": 400.0, "axial": -500.0},
        {"x": 500.0, "xRatio": 1.0, "axial": -600.0},
    ]

    response = client.post(
        "/api/v1/calculations/w-section/core/v0.5",
        json=payload,
    )

    assert response.status_code == 200, response.text
    analysis_trace = next(
        item
        for item in response.json()["trace"]
        if item["stage"] == "analysis_reference"
    )
    assert analysis_trace["stationCount"] == 6
    assert analysis_trace["forceCoordinateSystem"] == "member-local"


def test_core_v05_rejects_non_member_local_force_coordinates(approved_dataset) -> None:
    configure_dataset(approved_dataset)
    payload = core_v05_payload()
    payload["inputs"]["forceCoordinateSystem"] = "global"

    response = client.post(
        "/api/v1/calculations/w-section/core/v0.5",
        json=payload,
    )

    assert response.status_code == 422


def test_core_v05_rejects_member_target_mismatch(approved_dataset) -> None:
    configure_dataset(approved_dataset)
    payload = core_v05_payload()
    payload["targetIds"] = ["M-OTHER"]

    response = client.post(
        "/api/v1/calculations/w-section/core/v0.5",
        json=payload,
    )

    assert response.status_code == 422
    assert response.json()["detail"]["code"] == "CORE_TARGET_ID_MISMATCH"


def test_core_v05_preserves_standalone_engine_benchmark(approved_dataset) -> None:
    configure_dataset(approved_dataset)
    verification = benchmark_verification()

    standalone = client.post(
        "/api/v1/calculations/w-section",
        json=verification,
    )
    integrated = client.post(
        "/api/v1/calculations/w-section/core/v0.5",
        json=core_v05_payload(),
    )

    assert standalone.status_code == 200, standalone.text
    assert integrated.status_code == 200, integrated.text

    standalone_body = standalone.json()
    integrated_result = integrated.json()["memberDesignResults"][0]

    assert standalone_body["overall_status"] == "PASS"
    assert standalone_body["governing_check"] == "biaxial_bending"
    assert abs(
        standalone_body["values"]["max_uls_utilization"]["raw_value"] * 100 - 44.27
    ) < 0.05
    assert standalone_body["engine"]["id"] == "ECS-WSECTION-CSA-S16-2019-001"

    expected_status = "pass" if standalone_body["overall_status"] == "PASS" else "fail"
    assert integrated_result["status"] == expected_status
    assert integrated_result["governingCheckId"] == (
        f"DES-W-001:{standalone_body['governing_check']}"
    )
    assert abs(
        integrated_result["utilization"]
        - standalone_body["utilization_ratios"][standalone_body["governing_check"]]
    ) < 1e-12


def test_legacy_core_compatibility_endpoint_remains_available(approved_dataset) -> None:
    configure_dataset(approved_dataset)
    payload = {
        "model_schema_version": "0.3",
        "project_id": "P-LEGACY",
        "run_id": "DES-LEGACY",
        "calculator": "w-section",
        "calculator_version": "1.0",
        "target_ids": ["M-LEGACY"],
        "member_id": "M-LEGACY",
        "analysis_run_id": "AN-LEGACY",
        "load_combination_id": "ULS-LEGACY",
        "verification": benchmark_verification(),
    }

    response = client.post(
        "/api/v1/calculations/w-section/core",
        json=payload,
    )

    assert response.status_code == 200, response.text
    assert response.json()["modelSchemaVersion"] == "0.3"
