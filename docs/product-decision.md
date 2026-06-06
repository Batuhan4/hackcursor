# Product Decision: OmniSight Street Intelligence

## Customer and Problem

The paying customer is an Istanbul district municipality. Smart City,
Transport Planning, Public Works, Urban Design, and GIS teams need a repeatable
way to inspect thousands of street segments and prioritize field review.

Citizens, tourists, older adults, disabled pedestrians, and families benefit
from the resulting interventions, but they are not the first paying customer.

## MVP Output

For each street image or segment, the CV pipeline reports explainable physical
indicators:

- built density: building + wall pixel share
- openness: sky pixel share
- sidewalk availability proxy: sidewalk pixel share
- greenery: vegetation + terrain pixel share
- road allocation: road pixel share
- pedestrian comfort potential: a documented weighted combination of the
  physical indicators

These are image-derived proxies, not measurements of people, crime, mental
health, nighttime safety, revenue, or actual pedestrian traffic.

## Business Model

1. Paid neighborhood pilot with a fixed number of street kilometers.
2. Annual municipal SaaS license for dashboard, reports, history, and users.
3. Usage-based fee for additional imagery or road kilometers.
4. One-time integration fee for municipal camera, vehicle, GIS, and work-order
   systems.
5. Optional recurring before/after intervention reports.

Future B2B location suitability may use the same physical indicators, but
revenue prediction is not part of the MVP without sales, rent, and footfall
ground truth.

## Demo Data Decision

- Public municipal camera viewers may be linked as live operational context.
  Their imagery is not downloaded or processed without written authorization.
- The model demo uses `Reubencf/streetview-global` from Hugging Face, sourced
  from Mapillary and licensed `CC-BY-SA-4.0`.
- Every selected image passes the local face/license-plate anonymization gate
  before inference, upload, training, or display.
- The UI labels fixture and live sources explicitly and never presents an open
  dataset sample as municipal-owned imagery.
