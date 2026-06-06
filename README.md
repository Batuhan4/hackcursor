# OmniSight - Cursor x ALT+TAB Hackathon

OmniSight compares live Google walking alternatives using explainable physical
street indicators. It helps a person choose a route based on preferences such
as openness, sidewalk potential, greenery, and active-frontage potential.

OmniSight does not predict crime or guarantee safety. It never counts people,
profiles individuals, reads plates, or tracks people/vehicles. The product
promise is limited to:

> Fiziksel cevre gostergelerine gore daha guvenli rota potansiyeli.

## Mandatory Stack

| Layer | Technology | Deploy target |
| --- | --- | --- |
| Web application | Next.js App Router, TypeScript | Vercel |
| Mobile application | Expo, TypeScript | Expo Go / EAS |
| Core backend | Go using [masterfabric-go](https://github.com/gurkanfikretgunak/masterfabric-go) architecture | Render.com |
| Database | Postgres through `DATABASE_URL` | Render Postgres |
| Live walking routes | Google Routes API, `WALK` | Render Go API |
| CV models and datasets | Hugging Face | local / Modal |
| Training compute | Modal, anonymized data only | Modal |
| Product AI assistant | Cursor SDK, server-side | Vercel |

Render.com, not Railway, is the required backend target in the hackathon
brief.

## Live Product Flow

1. Next.js sends origin, destination, and preference to the Render Go API.
2. Go requests live walking alternatives from Google Routes API.
3. Go returns distance, duration, polyline, attribution, and analysis coverage.
4. OmniSight re-ranks only routes with sufficient physical-analysis coverage.
5. When coverage is missing, scores remain `null`; the system never invents a
   recommendation.
6. The optional Cursor SDK Route Assistant explains the returned metrics. It
   cannot calculate or change route scores.

## Repository

```text
apps/web/            Next.js consumer route experience and Cursor SDK endpoint
apps/mobile/         Expo mobile experience
services/api/        Go API following the required masterfabric-go layering
workers/cv/          anonymization, segmentation, evaluation, Modal training
packages/contracts/  shared JSON Schemas and TypeScript contracts
reports/             dataset, training, benchmark, and integration evidence
presentation/        jury presentation assets
docs/                architecture, KVKK, AI usage, and demo plan
```

## Local Setup

```bash
cp .env.example .env
bash scripts/check-env.sh
```

Run each service in a separate terminal:

```bash
cd services/api && make run
cd apps/web && npm install && npm run dev
cd apps/mobile && npm install && npm run start
```

## Environment Variables

Real values stay in ignored `.env` / `.env.local` files.

| Name | Used by | Purpose |
| --- | --- | --- |
| `GOOGLE_MAPS_API_KEY` | Go API | live Google Routes requests |
| `GOOGLE_STREET_VIEW_API_KEY` | CV/data tooling | approved Street View access if used |
| `HF_TOKEN` | CV/training | Hugging Face datasets and models |
| `MODAL_TOKEN_ID`, `MODAL_TOKEN_SECRET` | training | private Modal jobs |
| `DATABASE_URL` | Go API | Render Postgres |
| `NEXT_PUBLIC_API_BASE_URL` | web | Render Go API URL |
| `EXPO_PUBLIC_API_BASE_URL` | mobile | Render Go API URL |
| `CURSOR_API_KEY` | Next.js server only | Cursor SDK Route Assistant |
| `CURSOR_MODEL` | Next.js server only | defaults to `composer-2` |
| `VERCEL_TOKEN`, `RENDER_API_KEY` | deployment | provider CLI/API access |

`CURSOR_API_KEY` must never use a `NEXT_PUBLIC_` prefix. End users do not log
in to Cursor.

## AI and Data

- Dataset: `Reubencf/streetview-global`, sourced from Mapillary under
  `CC-BY-SA-4.0`.
- Local privacy gate: face and plate regions are irreversibly masked before
  inference, training, upload, or display.
- Segmentation baseline:
  `nvidia/segformer-b0-finetuned-cityscapes-1024-1024`.
- Persisted classes are restricted to inanimate physical environment classes.
- Modal auxiliary training uses only anonymized derivatives and records fixed
  revisions, seed, hyperparameters, metrics, and checkpoint hash.
- Cursor SDK explains structured route metrics only. There is no Gemini
  fallback and no mock AI response.

See [`docs/ai-usage.md`](docs/ai-usage.md),
[`docs/cursor-route-assistant.md`](docs/cursor-route-assistant.md), and
[`reports/training-summary.md`](reports/training-summary.md).

## KVKK Boundary

- No face recognition, plate OCR, person counting, demographic inference, or
  tracking.
- Raw imagery is never committed or uploaded to Vercel/Render/Modal.
- Public municipal/MOBESE viewer access is not processing authorization.
- Municipal camera imagery requires written permission and an official
  stream/API.
- Raw imagery is deleted at hackathon end and documented in
  [`docs/kvkk.md`](docs/kvkk.md).

## Verification

```bash
bash scripts/verify.sh
```

Relevant direct checks:

```bash
cd services/api && go test ./... && go vet ./...
cd apps/web && npm run lint && npm run typecheck && npm run build
cd apps/mobile && npx tsc --noEmit
```

The integration evidence is recorded in
[`reports/integrations.md`](reports/integrations.md). The jury flow is in
[`docs/demo-plan.md`](docs/demo-plan.md).

## Known Limits

- Current physical-analysis coverage is dataset/demo coverage, not city-wide
  coverage. Routes without matching coverage are explicitly unranked.
- Google route payloads are not persistently cached and require Google
  attribution.
- Revenue remains a hypothesis: premium preferences, route-neutral local
  sponsorships, and institutional mobility partnerships.
- `@cursor/sdk@1.0.16` currently brings unresolved high-severity transit
  dependency advisories. The endpoint is isolated and server-only, but this
  must be reassessed before production use.
