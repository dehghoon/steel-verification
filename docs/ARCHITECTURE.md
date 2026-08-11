# Architecture

## Boundaries

1. The validated Python engine under `packages/engineering` owns engineering calculations, warnings, ratios, units, validation, and applicability.
2. FastAPI only maps approved CISC records and request data into the engine, translates errors, and exposes typed REST contracts.
3. React/Next.js owns user interaction and rendering. It never re-implements engineering formulas.
4. React Three Fiber owns geometry visualization only.
5. Report preview consumes API outputs. Official PDF rendering remains disabled until the approved tool-specific Report Specification and server-side entitlement integration are available.

## CISC data

No production section designations or properties are embedded in source code. The API loads a configured approved normalized dataset through `CISC_DATASET_PATH`.

The expected top-level shape is:

```json
{
  "dataset_version": "<approved-version>",
  "sections": [
    {
      "id": "<stable-id>",
      "designation": "<source-designation>",
      "family": "W",
      "source": "CISC",
      "dataset_version": "<approved-version>",
      "units": {},
      "properties": {}
    }
  ]
}
```

Field aliases supported by the adapter are intentionally limited to canonical engineering names and common normalized names. The ingestion script for the real workbook must be added only after inspecting the approved workbook schema.

## Mobile reuse

Reusable TypeScript API contracts live under `packages/contracts`. A future React Native client should consume the same API and contracts. Browser, Next.js routing, and R3F scene code remain web-only.

## Visualization

The W-section scene is a reusable geometry descriptor rendered by React Three Fiber. It uses only approved section dimensions supplied by the section API and performs no engineering calculation.
