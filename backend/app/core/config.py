from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    app_name: str = "Steel Verification API"
    app_version: str = "0.1.0"
    api_prefix: str = "/api/v1"
    cisc_dataset_path: str = os.getenv(
        "CISC_DATASET_PATH",
        "./data/cisc/sst13-2026-08-25",
    )
    allowed_origins_raw: str = os.getenv("API_ALLOWED_ORIGINS", "http://localhost:3000")
    report_download_enabled: bool = os.getenv("REPORT_DOWNLOAD_ENABLED", "false").lower() == "true"

    @property
    def allowed_origins(self) -> list[str]:
        return [item.strip() for item in self.allowed_origins_raw.split(",") if item.strip()]


settings = Settings()
