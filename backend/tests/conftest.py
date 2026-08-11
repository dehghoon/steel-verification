from __future__ import annotations

import json
from pathlib import Path

import pytest


@pytest.fixture
def approved_dataset(tmp_path: Path) -> Path:
    payload = {
        "dataset_version": "test-approved-2022-04-04",
        "source": "CISC test fixture derived from the Agent #2 benchmark only",
        "sections": [
            {
                "id": "test-w100x19",
                "designation": "W100X19",
                "designation_imperial": "W4x13",
                "designation_metric": "W100x19",
                "family": "W",
                "source": "CISC",
                "dataset_version": "test-approved-2022-04-04",
                "units": {
                    "length": "mm",
                    "area": "mm2",
                    "inertia": "mm4",
                    "warping": "mm6",
                    "mass": "kg/m"
                },
                "properties": {
                    "depth": 106.0,
                    "flange_width": 103.0,
                    "flange_thickness": 8.8,
                    "web_thickness": 7.1,
                    "gross_area": 2470.0,
                    "moment_of_inertia_major": 4760000.0,
                    "moment_of_inertia_minor": 1610000.0,
                    "elastic_modulus_major": 89800.0,
                    "elastic_modulus_minor": 31200.0,
                    "plastic_modulus_major": 103000.0,
                    "plastic_modulus_minor": 47900.0,
                    "radius_of_gyration_major": 43.9,
                    "radius_of_gyration_minor": 25.5,
                    "warping_constant": 3800000000.0,
                    "torsional_constant": 62900.0,
                    "mass_per_length": 19.0
                }
            }
        ]
    }
    path = tmp_path / "cisc_test.json"
    path.write_text(json.dumps(payload), encoding="utf-8")
    return path
