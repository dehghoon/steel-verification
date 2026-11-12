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

## Structural Core v0.6 coordination

- Canonical source: [`dehghoon/linkoteq-structural-core`](https://github.com/dehghoon/linkoteq-structural-core/blob/main/CORE_CONTRACT.md).
- Target package: `v0.6.0`; target structural model schema: `0.6`.
- Core retains backward compatibility with schema `0.5`.
- This is a coordination target only; it does not certify runtime migration, dependency updates, solver support, or deployment.
- Core `v0.6.0` GitHub Release publication is tracked separately.
- Existing engineering calculations, detection evidence, and application behavior are unchanged by this documentation-only update.

## Linkoteq Platform Design System (mandatory)

This app MUST comply with [Platform Design System Contract v1](https://github.com/dehghoon/Main-website/blob/design/skyciv-inspired-platform-refresh-20261111/contracts/platform-design-system-v1.md). The official logo is served from `https://linkoteq.com/linko-logo-final.svg`; the shared stylesheet is `https://linkoteq.com/design-system/linkoteq-shell-v1.css` (must be deployed first). All three product links and a mobile toggle are required. This branch still uses a temporary local React header adapter; a reusable centrally versioned component remains a mandatory migration task. Build, mobile and access tests must pass before production.
