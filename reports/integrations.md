# Live Integration Report

## Google Routes

- Owner: Render-hosted Go API
- Endpoint: `POST /api/v1/routes`
- Mode: `WALK`
- Alternatives: requested live from Google Routes API
- Persistence: disabled for Google route payloads
- Attribution: returned as `Google Maps`
- Verified behavior: three live alternatives were returned for the test route
- Physical-analysis coverage behavior: no OmniSight score is invented when
  route coverage is unavailable

## Cursor SDK

- Owner: Vercel-hosted Next.js server route
- Endpoint: `POST /api/route-assistant`
- Package: `@cursor/sdk` `1.0.16`
- User authentication: none
- Credential: server-only `CURSOR_API_KEY`
- Input: short question plus structured route metrics
- Excluded input: coordinates, raw imagery, location history, faces, plates
- Isolation: temporary working directory, sandbox enabled, plan mode
- Fallback: none; missing/unavailable Cursor SDK returns HTTP `503`
- Product function: explains route metrics without changing route scores

## Deployment Boundary

The Go service on Render is the mandatory backend and live routing authority.
The Cursor SDK route is an additive AI Adaptation integration on Vercel because
the official SDK is TypeScript. It does not replace the Go API.
