# Cursor SDK Route Assistant

## Product Role

The Route Assistant explains the structured metrics already returned for up to
three walking alternatives. It does not calculate or change route scores.
This is a real product integration for the hackathon Cursor SDK bonus, not a
mock chatbot.

## Runtime

- Client request: `POST /api/route-assistant` on the Next.js application.
- Hosting: Vercel Node.js server route.
- SDK: pinned `@cursor/sdk`.
- Authentication: server-held `CURSOR_API_KEY`; end users do not sign in to
  Cursor and never receive the key.
- Core route source: the Render-hosted Go API remains responsible for live
  Google walking alternatives.

## Privacy and Safety Boundary

The endpoint accepts only a short question, route preference, and structured
route metrics, including bounded activity/comfort proxies already returned by
the product API. It does not accept raw imagery, origin/destination coordinates,
location history, faces, plates, or person-level observations.

Each request runs in a newly created temporary directory with Cursor sandbox
enabled, no ambient Cursor setting sources, and plan mode. The temporary
directory is deleted after the response.

The prompt prohibits:

- guaranteed-safety or crime claims
- camera-based person counting, unsupported crowd claims, demographic
  inference, and behavior inference
- fabricated analysis when coverage is insufficient
- changing or generating route scores

If `CURSOR_API_KEY` is missing, the endpoint returns HTTP `503`. There is no
mock or Gemini fallback.

## Request

```json
{
  "message": "Bu rota neden onerildi?",
  "preference": "open",
  "routes": [
    {
      "id": "google-walk-1",
      "distance_meters": 826,
      "duration_seconds": 741,
      "analysis_coverage": 0,
      "omnisight_score": null,
      "recommendation_status": "insufficient_analysis_coverage",
      "explanation": null
    }
  ]
}
```

## Environment

```bash
CURSOR_API_KEY=...
CURSOR_MODEL=composer-2
```

Both values are server-only. Never prefix them with `NEXT_PUBLIC_`.
