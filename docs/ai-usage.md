# AI Usage

How AI is used to build and power this project. The scoring core is computer
vision via Hugging Face. Cursor SDK is used server-side to explain structured
route metrics as a real product feature. There is no Gemini/OpenAI/Anthropic
fallback.

## Cursor IDE & agentic ruleset

- Development happens in **Cursor**; the always-on agent ruleset lives at
  `.cursor/rules/hackathon.mdc` (stack, KVKK, commit and verification rules).
- `AGENTS.md` is the canonical agent contract every agent reads first.
- Workflow: agents implement vertical slices, run `scripts/verify.sh`
  (lint/typecheck/build, `go vet`/`go test`, CV determinism check), and commit
  meaningful checkpoints that are pushed for jury review.
- This combination is what made the scaffold fast: rules encode the
  constraints once, so every agent run starts aligned (stack, privacy, env
  hygiene) instead of rediscovering them.

## Hugging Face models & datasets

Verified against the HF API on 2026-06-06 (details in `research/02-huggingface-kaynaklar.md`):

| Purpose | Model | License | Note |
| --- | --- | --- | --- |
| Face anonymization | [`arnabdhar/YOLOv8-Face-Detection`](https://huggingface.co/arnabdhar/YOLOv8-Face-Detection) | AGPL-3.0 | local cache `models/yolov8_face.pt` is SHA256-identical to the HF file |
| Plate anonymization | [`Koushim/yolov8-license-plate-detection`](https://huggingface.co/Koushim/yolov8-license-plate-detection) | MIT (card; AGPL-derivative caveat noted) | local cache `models/yolov8_plate.pt` SHA256-identical |
| Urban objects (default) | [`shirabendor/YOLOV8-oiv7`](https://huggingface.co/shirabendor/YOLOV8-oiv7) | AGPL-3.0 | 601 Open Images V7 classes: waste container, street light, bench, billboard, traffic sign/light |
| Road damage | [`rezzzq/yolo12s-road-damage-rdd2022`](https://huggingface.co/rezzzq/yolo12s-road-damage-rdd2022) | MIT (card) | RDD2022: D00–D40 crack/pothole classes, municipal vocabulary |
| Serverless fallback | [`facebook/detr-resnet-50`](https://huggingface.co/facebook/detr-resnet-50) | Apache-2.0 | hf-inference "live" — fallback if local inference fails |

**Anonymization-only constraint:** the face/plate models are detectors used
exclusively to locate regions for irreversible masking (`docs/kvkk.md`).
Recognition/OCR models are blacklisted for this project.

## Local model cache

`models/` (gitignored) holds YOLO weights as a development/demo cache only;
Hugging Face is the source of truth. Note from research: the local
`yolov8n.pt` is the GitHub-release build — for a file-level "from Hugging
Face" claim, re-fetch via
`hf_hub_download(repo_id="Ultralytics/YOLOv8", filename="yolov8n.pt")`.
Weights are never committed (`*.pt` ignored).

## Modal (training compute)

Modal may be used for GPU training/fine-tuning **only with data that passed
the local anonymization gate**; checkpoints are promoted to a private Hugging
Face model repo. Modal is never the product backend (Render is). Tokens come
from `.env` (`MODAL_TOKEN_ID`, `MODAL_TOKEN_SECRET`) and are never printed.

Preflight and evidence language for the live demo:

```bash
modal --version
modal token info
```

These commands are used only to confirm CLI availability and token status; no
secret values should be copied into logs or slides. Training evidence should
point at `reports/training-summary.md` plus the selected run report under
`reports/runs/`, including dataset/model revisions, fixed seed, GPU,
hyperparameters, metrics, and checkpoint hash.
Before any Modal image upload, run:

```bash
python3 workers/cv/preflight_manifest.py
```

The Modal training entrypoint runs the same preflight before `add_local_dir`.
It verifies `reports/data-manifest.json` against `data/interim/anonymized`,
requires `solid_mask`, checks recorded SHA-256 hashes, rejects raw/non-anonymized
paths, and verifies the documented dataset/face/plate revisions where present.
The Modal classifier is now framed as
`street_activity_environment_context_auxiliary`: auxiliary evidence for safe
route activity/environment context, not a final safety model. The current
training signal is weak `urban/suburban` context only, so generated metrics are
named `weak_label_context_agreement` and `macro_f1_weak_label_context`.

Presentation-safe product signal families:

- Crowd/activity proxies: POI/open-business density, main-street proximity,
  transit/touristic activity, and authorized aggregate city data when available.
- Environmental quality/comfort: lighting cues, sidewalk/walkability,
  cleanliness/maintenance when available, physical openness, greenery, and
  ordered public space.

The classifier reports weak-label agreement only. It is not live person
counting, identity/profiling, crime prediction, or a safety guarantee. The demo
set has no pixel-level labels, so SegFormer mIoU is not claimed.

## Cursor SDK product integration

`POST /api/route-assistant` is a Vercel server route using
`@cursor/sdk@1.0.16`. It explains up to three route alternatives from
structured metrics. Users do not authenticate with Cursor; the API key remains
server-side.

- The assistant receives no raw imagery, coordinates, or location history.
- It cannot calculate or change route scores.
- It runs in a fresh temporary directory, with sandbox enabled, no ambient
  Cursor settings, and plan mode.
- Missing SDK credentials or service failure returns an explicit `503`.
- There is no mock or Gemini fallback.

The Go service on Render remains the core backend. Full details:
`docs/cursor-route-assistant.md`.

Dependency note: npm audit currently reports unresolved high-severity transit
advisories through the SDK's local runtime dependencies. The integration is
isolated and server-only for the hackathon, but should not be treated as
production-approved until upstream fixes are available.
