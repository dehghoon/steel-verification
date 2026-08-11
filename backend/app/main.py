from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import calculations, reports, sections, system
from app.core.config import settings

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="FastAPI adapter for the validated CSA S16:2019 W-section engineering engine.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

app.include_router(system.router)
app.include_router(sections.router, prefix=settings.api_prefix)
app.include_router(calculations.router, prefix=settings.api_prefix)
app.include_router(reports.router, prefix=settings.api_prefix)
