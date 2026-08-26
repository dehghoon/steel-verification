# W-Section Platform Compliance

Canonical source of truth: `dehghoon/linkoteq-structural-core`.

Target Core schema: **v0.5**.

## Integration status

- [x] Standalone W-section calculator remains available.
- [x] Existing verified GPT-2 engineering engine remains unchanged.
- [x] Canonical Core v0.5 request/writeback model is implemented in `backend/app/models/core_contract_v05.py`.
- [x] Canonical endpoint is available at `POST /api/v1/calculations/w-section/core/v0.5`.
- [x] `inputs.memberId` is validated against `targetIds`.
- [x] Integrated execution calls the verified engine only through `request.inputs.verification`.
- [x] Legacy `POST /api/v1/calculations/w-section/core` endpoint remains available for backward compatibility.
- [x] Core v0.5 writeback preserves project, run and member identity.
- [x] Internal member-force integration accepts only `member-local` coordinates.
- [x] Station records support arbitrary station counts.
- [x] Station `x` is preserved and `xRatio` remains optional.
- [x] Canonical `DesignRun`, `MemberDesignResult` and `DesignCheck` records are returned.
- [x] Warnings, errors and traceability records are preserved.
- [x] Contract tests cover Core v0.5 identity, coordinate semantics, station handling, writeback, target mismatch and standalone regression.
- [ ] Backend test suite execution is verified after this migration.
- [ ] Frontend production build is verified after this migration.
- [ ] Standalone smoke test is verified in the target deployment environment.
- [ ] Core v0.5 integration smoke test is verified in the target deployment environment.
- [ ] Production deployment health is verified.
- [ ] Representative production calculation is verified.

## Canonical boundary

Integrated calculation endpoint:

`POST /api/v1/calculations/w-section/core/v0.5`

Required envelope fields:

- `modelSchemaVersion`
- `projectId`
- `runId`
- `calculator`
- `calculatorVersion`
- `targetIds`
- `inputs.memberId`
- `inputs.verification`

Optional analysis references include:

- `inputs.analysisRunId`
- `inputs.loadCombinationId`
- `inputs.forceCoordinateSystem`
- `inputs.forceStations`

Internal member-force data must use `member-local` coordinates. Solver-native PyNite objects must not cross this boundary.

Canonical writeback includes:

- `modelSchemaVersion`
- `projectId`
- `runId`
- `calculator`
- `calculatorVersion`
- `targetIds`
- `designRun`
- `memberDesignResults`
- `warnings`
- `errors`
- `trace`

## PyNite boundary

W-Section does not call PyNite directly. Analysis results must arrive through canonical Core analysis records or the Core Analysis Adapter boundary. Solver-native classes are not part of the W-Section integration contract.

## Standalone compatibility

`POST /api/v1/calculations/w-section` remains the standalone engineering endpoint.

`POST /api/v1/calculations/w-section/core` remains the legacy Core compatibility endpoint until deprecation is explicitly approved.

The Core v0.5 integration delegates engineering execution to the same verified engine used by standalone mode. No engineering formulas, checks, warnings, units or applicability logic are duplicated in the integration layer.

## Reports

Reports remain consumers of canonical engineering facts. Report rendering must not recalculate or reinterpret engineering results. Official PDF authorization remains a server-side entitlement concern and is outside the Core v0.5 calculation migration itself.

## Release gate

Do not mark the Core v0.5 migration complete until all applicable verification gates in the GPT-4 work order pass:

- backend tests;
- frontend production build;
- standalone smoke test;
- Core v0.5 integration smoke test;
- healthy production deployment;
- representative production calculation;
- report/auth/entitlement verification where applicable.

`docs/TEST_RESULTS.md` must only be updated after tests are actually executed.

## Compatibility rule

Do not duplicate or fork the platform-wide structural contract in this repository. Calculator-private models may remain local, but cross-product integration must follow `linkoteq-structural-core`.
