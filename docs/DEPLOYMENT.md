# Deployment

## Local API

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
export PYTHONPATH=backend
export CISC_DATASET_PATH=/absolute/path/to/approved/cisc_sections.json
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## Local web

```bash
cd web
npm ci
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000 npm run dev
```

## Environment

- `NEXT_PUBLIC_API_BASE_URL`: public FastAPI base URL.
- `API_ALLOWED_ORIGINS`: comma-separated allowed web origins.
- `CISC_DATASET_PATH`: absolute or deployment-relative path to the approved normalized CISC dataset.
- `AUTH_PROVIDER`: authentication adapter selection; currently not implemented.
- `BILLING_PROVIDER`: entitlement adapter selection; currently not implemented.
- `REPORT_DOWNLOAD_ENABLED`: remains false until authorization and approved report specification are integrated.
- `LOG_LEVEL`: service logging level.

## Portability

Frontend and API are independently deployable. No production domain or provider URL is hard-coded. Vercel can host the frontend; FastAPI may run on a VPS, Docker host, or managed container platform.

## Rollback

Redeploy the previous web build and API revision independently. Preserve previous versioned CISC datasets and point `CISC_DATASET_PATH` back to the prior approved version if data rollback is required.

## Production blockers

Production deployment must not be enabled until:
- the approved CISC workbook has been ingested and validated;
- authentication/entitlement integration is approved;
- the tool-specific Report Specification is supplied if official PDF reports are enabled.
