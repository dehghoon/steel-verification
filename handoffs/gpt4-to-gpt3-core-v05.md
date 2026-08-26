# GPT-4 to GPT-3 — W-Section Core v0.5 Migration Work Order

Repository: `dehghoon/steel-verification`
Core source of truth: `dehghoon/linkoteq-structural-core`
Target Core schema: `0.5`

## Preserve
- Do not modify `packages/engineering/steel_w_section_csa_s16`.
- Do not rewrite GPT-2 engineering calculation logic.
- Preserve standalone endpoint behavior.
- Preserve existing legacy Core endpoint for backward compatibility until deprecation is explicitly approved.

## Completed by GPT-4
- Added `backend/app/models/core_contract_v05.py`.
- Added `project-status.json`.
- Core v0.5 boundary preserves canonical IDs, member-local internal force semantics, station `x` / optional `xRatio`, design run/result writeback, warnings/errors and traceability.
- Commit containing the new boundary: `aefb84f68c07484a3cd104bce0cf6c7999f7978c`.

## Required GPT-3 changes
1. Update `backend/app/api/routes/calculations.py`.
2. Import:
   - `CoreWSectionV05Request`
   - `CoreWSectionV05Response`
   - `build_core_v05_response`
3. Add canonical endpoint:
   - `POST /api/v1/calculations/w-section/core/v0.5`
4. Validate that `inputs.memberId` is present in `targetIds`.
5. Run the existing verified engine only through `request.inputs.verification`.
6. Return `build_core_v05_response(request, calculation)`.
7. Keep the current `/w-section/core` route as a compatibility endpoint.
8. Add contract tests covering:
   - `modelSchemaVersion == "0.5"`
   - stable project/run/member IDs
   - member-local force coordinate system only
   - arbitrary station count
   - `x` and optional `xRatio`
   - designRun/memberDesignResults/checks writeback
   - target-ID mismatch rejection
   - unchanged standalone calculation result for a representative benchmark
9. Update `docs/PLATFORM_COMPLIANCE.md` from stale v0.3/v0.4 language to Core v0.5.
10. Update `docs/TEST_RESULTS.md` only after tests actually run.

## PyNite rule
- W-Section must not call PyNite directly.
- Analysis results must arrive through canonical Core analysis records / the Core Analysis Adapter boundary.
- No solver-native PyNite classes may cross into W-Section integration contracts.

## Verification gates
Do not mark complete until:
- backend tests pass;
- frontend build passes;
- standalone smoke test passes;
- Core v0.5 integration smoke test passes;
- production deployment exists and is healthy;
- representative production calculation succeeds;
- report/auth/entitlement flow is verified where applicable.

## Current blocker
The available GPT-4 GitHub connector can create files but cannot update an existing file because its update action cannot supply the required current SHA. GPT-3 must perform the SHA-aware update to `backend/app/api/routes/calculations.py` and existing documentation files.
