# Training Summary

## Training Target

The current Modal training target is
`street_activity_environment_context_auxiliary`: an auxiliary evidence model for
YolDost's "active route + safer-potential environment" story (formerly
OmniOS/OmniSight). It is
not the final route safety model.

Product scoring should combine two safe signal families:

- Crowd/activity proxies: POI/open-business density, main-street proximity,
  transit/touristic activity, and authorized aggregate city data when available.
- Environmental quality/comfort: lighting cues, sidewalk/walkability,
  cleanliness/maintenance when available, physical openness, greenery, and
  ordered public space.

Current Modal training uses only anonymized images and weak `urban/suburban`
context labels from the demo dataset. The exact metric labels are:

- `weak_label_context_agreement`
- `macro_f1_weak_label_context`

These metrics do not measure live crowd size, unauthorized camera person
counting, identity/profiling, crime risk, or guaranteed safety.

## Selected Evidence Run

The selected auxiliary training run is
`20260606T121159Z-modal-scene`.

- Data: 60 locally anonymized Hugging Face / Mapillary derivatives
- Source license: `CC-BY-SA-4.0`
- Preflight gate: PASS (`records=60`, `files=60`, `sha256=60`)
- Privacy gate: solid mask with 20% bounding-box padding
- Regions masked: 1 face, 13 license plates
- Balanced subset: 23 urban and 23 suburban samples
- Split: 36 train, 10 validation
- Base model: `google/vit-base-patch16-224-in21k`
- Base revision: `b4569560a39a0f1af58e3ddaf17facf20ab919b0`
- GPU: NVIDIA B200
- Hyperparameters: 5 epochs, batch size 8, learning rate 0.0003, AdamW,
  weight decay 0.01, frozen backbone
- Selected epoch: 5
- Training time: 2.702 seconds
- Weak-label context agreement: 80%
- Macro F1 (weak-label context): 0.80
- Report: `reports/runs/20260606T121159Z-modal-scene/report.md`
- Checkpoint: private Modal Volume `omnisight-training-checkpoints`
- Checkpoint SHA-256:
  `1d92fc3189d9fba7505407542cf3145950b8690035cda9418741fc39d6791cde`

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
| `20260606T121159Z-modal-scene` | Retargeted report labels to activity/environment context, 5 epochs | `weak_label_context_agreement` 80%, `macro_f1_weak_label_context` 0.80 | Selected presentation evidence run |

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
