# Test Results

Date: 2026-08-11

## Environment

- Python: 3.13 local execution environment
- Node.js: 22.16.0
- npm: 10.9.2

## Passed

- Agent #2 inherited engineering tests: 12 passed, unchanged.
- FastAPI adapter/API/report-authorization boundary tests: 8 passed.
- Python compile check: passed.
- OpenAPI generation: passed through API test suite.
- Agent #2 benchmark through FastAPI adapter: passed, including governing biaxial bending utilization and corrected FR-009 minor shear behavior.

## Not executed

- Frontend dependency installation, type-check, and production build could not run in this execution environment because registry access is unavailable. The same commands are configured in GitHub Actions.
- Production CISC workbook ingestion tests are blocked because the approved workbook/normalized dataset was not supplied.
- Official PDF rendering tests are blocked because the approved tool-specific Report Specification and entitlement integration were not supplied.
- Browser E2E and visual regression tests are not configured in this initial implementation.

## Known risks

- The frontend build must be verified by CI after dependencies can be downloaded.
- Production calculation requests intentionally fail with `CISC_DATASET_UNAVAILABLE` until an approved CISC dataset is configured.
- Official PDF download intentionally returns a server-side denial until approved authentication, entitlement, and report specification integrations are available.
