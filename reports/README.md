# Experiment and Demo Reports

This directory is the evidence source for the jury presentation. Generated
artifacts are grouped by run:

```text
reports/
  data-manifest.json
  modal-accounts.md
  runs/
    <run-id>/
      metrics.json
      report.md
```

Every report must distinguish:

- measured values from assumptions
- model accuracy from inference speed
- raw model outputs from heuristic product scores
- authorized/open-license data from simulated municipal fixtures
- weak-label agreement from ground-truth metrics such as mIoU

## Required Fields

Each model run records:

- run ID and UTC timestamp
- dataset repository, revision, license, selection filters, and sample count
- anonymization models, revisions, method, and masked-region counts
- segmentation/training model repository and revision
- random seed and software versions
- GPU type, workspace profile, wall-clock duration, and throughput
- train/validation split and hyperparameters when training occurs
- accuracy, precision, recall, F1, IoU, or confusion matrix only when matching
  ground-truth labels exist
- physical street indicators and their formulas
- known limitations, failed samples, and untested claims

No report may contain API keys, token values, raw faces, readable plates, raw
image paths, or identifying crops.

Before any Modal training upload, run
`python3 workers/cv/preflight_manifest.py`. This verifies the manifest against
`data/interim/anonymized`, checks recorded hashes and expected anonymization
revisions, and rejects raw or non-anonymized path references. If the preflight
fails, no Modal training evidence should be generated.

For the current auxiliary activity/environment context run, metric labels must
remain explicit:

- `weak_label_context_agreement`
- `macro_f1_weak_label_context`

These are weak-label context metrics, not mIoU, person-density accuracy, crime
prediction, or guaranteed safety.
