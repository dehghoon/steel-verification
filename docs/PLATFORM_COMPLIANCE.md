# W-Section Platform Compliance

Canonical source of truth: `dehghoon/linkoteq-structural-core`.

Target Core schema: **v0.3**.

## Integration status

- [x] Standalone W-section calculator remains available.
- [x] Integrated Core endpoint uses stable `project_id`, `run_id`, `member_id`, `analysis_run_id` and `load_combination_id` references.
- [x] New integration requests default to Core v0.3.
- [x] Core v0.2 request envelopes remain accepted during migration.
- [x] Writeback is normalized to Core v0.3.
- [x] Canonical `DesignRun` is returned.
- [x] Canonical `MemberDesignResult` is returned.
- [x] Individual utilization checks are mapped to canonical `DesignCheck` records.
- [x] Assigned section ID, governing check, utilization, warnings and traceability are preserved.
- [x] Calculator-private `VerificationResponse` remains available as a compatibility/detail payload.
- [x] Report preview includes additive Core v0.3-compatible report metadata while preserving the existing standalone response fields.
- [x] Regression tests cover Core v0.3 writeback, legacy v0.2 request migration and report source references.

## Canonical boundary

Integrated calculation endpoint:

`POST /api/v1/calculations/w-section/core`

Required engineering identity:

- `model_schema_version`
- `project_id`
- `run_id`
- `calculator`
- `calculator_version`
- `target_ids` / `member_id`
- optional `analysis_run_id`
- optional `load_combination_id`
- calculator-specific `verification` input

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

## Units

The existing W-section engineering API remains responsible for explicit engineering units at its input/output boundary. Platform consumers must not infer units from field names. Reported engineering values retain their explicit `unit` field.

## Reports

Reports are consumers of engineering results, not a second calculation source. The report preview now exposes `canonical_report` with Core v0.3 identifiers and source references while retaining the existing UI-oriented `sections` payload for backward compatibility.

## Release gate

Before production release, verify:

- [ ] Backend tests pass in CI.
- [ ] Web build passes.
- [ ] Standalone calculator smoke test passes.
- [ ] 3D Model integration smoke test passes with a real member ID and analysis run ID.
- [ ] Core v0.3 response is consumed without an application-specific adapter.
- [ ] Report source references match the originating design/member IDs.
- [ ] Production entitlement/authentication is restored for official reports.
- [ ] Deployment smoke test passes on the production domain.

## Compatibility rule

Do not duplicate or fork the platform-wide structural contract in this repository. Calculator-private models may remain local, but cross-product integration types must follow `linkoteq-structural-core`.
