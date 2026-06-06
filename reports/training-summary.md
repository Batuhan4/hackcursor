# Training Summary

## Training Target

The current Modal training target is
`street_activity_environment_context_auxiliary_v2`: an auxiliary evidence model for
YolDost's "active route + safer-potential environment" story (formerly
OmniOS/OmniSight). It is not the final route safety model.

Product scoring should combine two safe signal families:

- Crowd/activity proxies: POI/open-business density, main-street proximity,
  transit/touristic activity, and authorized aggregate city data when available.
- Environmental quality/comfort: lighting cues, sidewalk/walkability,
  cleanliness/maintenance when available, physical openness, greenery, and
  ordered public space.

Current Modal training uses only anonymized images and weak labels from the demo
dataset (`setting`, `infrastructure`, `weather`, `time_of_day`). The exact
primary metric labels are:

- `weak_label_context_agreement`
- `macro_f1_weak_label_context`

Optional secondary metric (heuristic only, not ground truth):

- `weak_label_infrastructure_comfort_agreement`
- `macro_f1_weak_label_infrastructure_comfort`

These metrics do not measure live crowd size, unauthorized camera person
counting, identity/profiling, crime risk, guaranteed safety, or SegFormer mIoU.

## Dataset Evaluation (June 2026)

| Candidate | License | Inline images | Labels | Hackathon fit | Decision |
|---|---|---|---|---|---|
| `Reubencf/streetview-global` | CC-BY-SA-4.0 | Yes (10,209) | VLM weak: setting, weather, time, infrastructure, VQA | Best practical: stream + anonymize locally | **Selected** |
| `NUS-UAL/global-streetscapes` | CC-BY-SA-4.0 | No (manual image tarballs, 23 GB+) | Manual: lighting, weather, glare, quality | Richer labels but heavy image download pipeline | Deferred |
| `candylion/mapillary-vistas-v2` | CC-BY-NC-SA-4.0 | Yes (25k) | Pixel segmentation (124 classes) | Non-commercial license blocks demo/product story | Rejected |
| `ReinWired/Global_streetscapes_max_50_per_city` | CC-BY-SA-4.0 | Yes (~34k) | Opaque numeric labels only | Too small/unclear for activity/environment story | Rejected |

### Why `Reubencf/streetview-global` remains the demo source

- Open CC-BY-SA-4.0 license matches Mapillary attribution requirements.
- Images stream directly through the local anonymization gate without multi-GB
  tarball extraction.
- Labels already encode activity/environment proxies (`urban/suburban`,
  `infrastructure`, `weather`, `time_of_day`) that align with YolDost wording.
- The upgrade path is sample scale (60 → 300) and training quality, not a risky
  license or download bottleneck.

`NUS-UAL/global-streetscapes` is the strongest alternative for manually labeled
lighting/weather/quality metadata, but its imagery lives in separate archives and
was not practical to gate and ship inside the hackathon window.

## Selected Evidence Run

**Selected:** `20260606T125349Z-modal-scene` (300 samples, 88.33% weak-label
agreement, macro F1 0.8833 on NVIDIA B200).

Prior baseline run: `20260606T121159Z-modal-scene` (60 samples, 80% weak-label
agreement).

### Planned v2 training corpus

- Data: 300 locally anonymized Hugging Face / Mapillary derivatives
- Source: `Reubencf/streetview-global` @ `a206537534dc0e8165e0e7d36f08df14795127db`
- Source license: `CC-BY-SA-4.0`
- Selection: balanced 150 urban + 150 suburban, daytime, seed 42
- Weak-label fields: `setting`, `infrastructure`, `weather`, `time_of_day`,
  `infrastructure_comfort_proxy`
- Preflight gate: required before Modal upload
- Privacy gate: solid mask with 20% bounding-box padding
- Base model: `google/vit-base-patch16-224` (ImageNet fine-tuned)
- Base revision: `3f49326eb077187dfe1c2a2bb15fbd74e6ab91e3`
- GPU preference: NVIDIA B200, then H200, then H100
- Hyperparameters: 12 epochs, batch size 16, learning rate 0.0002, AdamW,
  cosine schedule, frozen backbone with last encoder block unfrozen, light
  augmentation

This auxiliary classifier separates the dataset's model-generated
`urban/suburban` context labels. It is retained as evidence for weak
activity/environment context only. It does not measure pedestrian density,
street safety, crime, or SegFormer segmentation accuracy.

## Experiment History

| Run | Change | Result | Decision |
|---|---|---|---|
| `20260606T110222Z-modal-scene` | Imbalanced 47/13 split, 8 epochs | 53.85% agreement, macro F1 0.35 | Rejected: majority-class collapse |
| `20260606T110435Z-modal-scene` | Balanced split, 30 epochs | best 80%, macro F1 0.80; later epochs 70% | Valid experiment; showed early overfitting |
| `20260606T110554Z-modal-scene` | Balanced split, 8 epochs, persisted best checkpoint | best 80%, macro F1 0.80 | Prior reproducible checkpoint run |
| `20260606T121159Z-modal-scene` | Retargeted report labels to activity/environment context, 5 epochs, 60 samples | `weak_label_context_agreement` 80%, `macro_f1_weak_label_context` 0.80 | Prior presentation evidence run |
| `20260606T125349Z-modal-scene` | 300 balanced samples, ViT-224 ImageNet base, augmentation, partial unfreeze, 12 epochs | `weak_label_context_agreement` 88.33%, `macro_f1_weak_label_context` 0.8833 | **Selected** presentation evidence run |

## Core Product Model

The product's physical route indicators still come from the SegFormer
baseline:

- model: `nvidia/segformer-b0-finetuned-cityscapes-1024-1024`
- revision: `21b3847fae21ddee674abd31129307b6a1235bd9`
- allowed persisted classes: road, sidewalk, building, wall, fence, pole,
  traffic light, traffic sign, vegetation, terrain, and sky
- discarded classes: person, rider, car, truck, bus, train, motorcycle, bicycle

The demo dataset has no matching pixel-level ground truth, so SegFormer mIoU
and segmentation accuracy have not been measured. This limitation must remain
visible in the presentation.
