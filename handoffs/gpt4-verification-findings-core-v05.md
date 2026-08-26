# GPT-4 Verifification Findings — Core v0.5

Date: 2026-08-26
Repository: `dehghoon/steel-verification`
Current branch: `main`

## Verified completed
- Core v0.5 endpoint is wired at `POST /api/v1/calculations/w-section/core/v0.5`.
- `backend/tests/test_core_v05.py` exists and covers identity, member-local forces, arbitrary station count, optional `xRatio`, target mismatch and standalone regression.
- `docs/PLATFORM_COMPLIANCE.md` now targets Core v0.5.
- GPT-2 engine remains unchanged.


## CI verification result
Latest CI run `#91` (commit `f65682e`) failed.
Backend job failed at: `PYTHONPATH=backend pytest backend/tests`.
Web job completed but the overall workflow remains failed because of the backend job.

## Probable root cause from repository inspection
`backend/tests/test_core_v05.py` contains a backward-compatibility test that posts a legacy `0.3` request to `/w-section/core` and then asserts that the response `modelSchemaVersion` is `0.3`.

The existing legacy compatibility model in `backend/app/models/core_contract.py` normalizes writeback to `0.4`. Therefore the new test is not consistent with the current legacy endpoint behavior.

## Required fix
Do not change the GPT-2 engine.

Pick one explicit compatibility policy and test it:

- Preferred: keep the legacy endpoint normalized to `0.4` and change the new test to assert `0.4` for the legacy response; or 
- if true v0.3 echo semantics are required, explicitly implement a v0.3 compatibility response path without affecting the v0.5 canonical endpoint.

The preferred fix is the first option because it matches the current legacy endpoint implementation and avoids re-introducing v0.3 writeback behavior.

## Release gate
Do not mark Stage 4 complete until:
- CI passes on `main`;
- standalone smoke test passes;
- Core v0.5 integration smoke test passes;
- production health and representative calculation are verified.
