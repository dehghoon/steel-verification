# GPT-4 Stage 5 Production Verification

Date: 2026-08-26
Repository: `dehghoon/steel-verification`
Core source of truth: `dehghoon/linkoteq-structural-core`
Verified Core schema: `0.5`

## Verified
- Core remains v0.5.
- Core v0.5 migration and backend CI were previously verified by GPT-4.
- Production frontend is reachable at https://wsection.linkoteq.com/.
- The frontend renders W-Section Verification, CSA S16:2019, an approved-section selector state, engineering inputs, and results area.
- The deploymed frontend links to the custom product domain `wsection.linkoteq.com`.
- The backend implements `GET /health` returning `{"status":"ok"}` and `GET /version` for app/engine identity.
- Frontend consumes an environment-defined `NEXT_PUBLIC_API_BASE_URL`; no production API URL is hard-coded in the repository.

## Not yet independently verified
- The actual production FastAPI base URL is not recorded in the repository or public documentation.
- Because the production API base URL cannot be identified from public/repository evidence, GET /health and GET /version cannot yet be probed against the deployed backend.
- A representative production calculation cannot be independently probed until the production API base URL is known.
- The approved production CISC dataset/version is not recorded in public repository evidence.
- Authentication/entitlement for official reports is not yet verified as a production flow.

## Release gate result
Stage 5 status: `blocked`
Production-ready: `NO`

Reason: the frontend is reachable, but a production release requires separate evidence for the deployed API health, a representative calculation, and the production CISC dataset. Official report auth/entitlement must also be verified if the feature is enabled.

## Required next evidence
1. Record the deployed FastAPI base URL in deployment/status evidence (not in secrets).
2. Probe `GET /health`.
3. Probe `GET /version` and record app/engine version.
4. Probe `GET /api/v1/sections?family=W&limit=1` to verify the deployed CISC dataset is available.
5. Run one representative `Post /api/v1/calculations/w-section` request using a section returned by the production section endpoint.
6. If 3D/integrated design is being released, run a representative `Post /api/v1/calculations/w-section/core/v0.5` request with canonical IDs and member-local analysis result references.
7. Verify report auth/entitlement only if official PDF reports are enabled.
