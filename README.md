# Steel Verification

Production-oriented web application for CSA S16:2019 W-section verification.

## Architecture

- `packages/engineering/steel_w_section_csa_s16`: validated Agent #2 Python engine, copied unchanged.
- `backend`: FastAPI adapter, CISC dataset service, calculation API, report-preview contract, authorization boundary.
- `web`: Next.js frontend consuming only the FastAPI API.
- `packages/contracts`: reusable TypeScript API contracts for future web/mobile reuse.
- `data/cisc`: runtime location for an approved normalized CISC dataset. No section properties are hard-coded.
- `docs`: architecture, deployment, limitations, and test evidence.

## Current data requirement

The application intentionally does not ship fabricated CISC data. Set `CISC_DATASET_PATH` to an approved normalized dataset before using section search or calculations.

## Development

See `docs/DEPLOYMENT.md` and `docs/TEST_RESULTS.md`.
