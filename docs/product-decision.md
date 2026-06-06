# Product Decision: YolDost Consumer Routing

## User and Problem

YolDost (formerly OmniSight) is for people choosing a walking route,
particularly at night or in an unfamiliar neighborhood. Standard maps compare
routes mainly by travel time and distance. They do not explain whether a route
has stronger active/crowded street potential from main-street proximity,
POI/open-business activity, lighting/open-city-data signals, physical openness,
sidewalk quality, cleanliness, or green-area comfort signals.

## Product Promise

YolDost requests real walking alternatives from Google Routes API and
re-ranks them only when matching physical street-analysis coverage exists.
The single product idea is **"en kalabalik/aktif, daha guvenli rota
potansiyeli"**. In the MVP, "kalabalik/aktif" means activity potential from
POI/open-business context, main-street proximity, public/open data, and
authorized aggregated city data. It does not mean current unauthorized CV
person counting or live pedestrian density. Supporting safety/comfort signals
include:

- green areas / greenery
- cleanliness
- sidewalk quality and walkability
- lighting
- physical openness
- main-street proximity
- POI and open-business activity
- authorized city data

The product does not guarantee safety, predict crime, count pedestrians, or
infer demographics. Required wording is:

> Fiziksel cevre gostergelerine gore daha guvenli rota potansiyeli.

When physical-analysis coverage is insufficient, the API returns the Google
alternatives without inventing a YolDost ranking.

## Data Boundaries

- Google Routes supplies live walking alternatives. Route results are not
  persistently cached and Google attribution is mandatory.
- Hugging Face / Mapillary open-license images support the current model demo.
- Municipal or MOBESE imagery requires written processing authorization and an
  official stream/API. Public viewing access alone is insufficient.
- Faces and plates are irreversibly masked locally before model inference,
  upload, training, or display.
- Person/rider/vehicle segmentation classes are discarded before persistence.

## Revenue Hypotheses

Revenue is not validated yet. Candidate models:

1. Contextual local sponsorships or promoted venues near a route.
2. Premium route preferences and saved personal mobility settings.
3. Institutional mobility partnerships with campuses, hotels, events, or
   employers.
4. Aggregated municipal planning analytics as a separate future B2B product.

Ads or sponsorships must never alter physical route scores or be presented as
safety evidence.

Crowd or activity language is allowed only as a product concept with a clear
source boundary. For the MVP, "crowded/active" must mean a POI/open-business
activity signal, main-street proximity, public/open data, or authorized
aggregated municipal density context. It must not mean current MVP CV person
counting, user profiling, live pedestrian density, crime prediction, or a
safety guarantee. Camera-based person counting can only be discussed as a
future legal/authorized aggregate-data gate.

## Cursor SDK Assistant

Cursor SDK will power an optional server-side Route Assistant that explains
why one route was recommended from structured metrics. End users do not log in
to Cursor. The application uses a server-held `CURSOR_API_KEY`.

The assistant:

- receives route metrics, not raw imagery or location history
- cannot change route scores
- cannot claim guaranteed safety
- returns an explicit unavailable response when SDK auth/service is missing
- has no mock AI response

The Go API on Render remains the mandatory core backend. The TypeScript Cursor
SDK endpoint is a Vercel server-side bonus integration.
