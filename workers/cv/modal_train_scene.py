#!/usr/bin/env python3
"""Train an anonymized street activity/environment context head on Modal GPU.

This auxiliary model provides a measurable training/evaluation artifact for the
hackathon. Its labels come from model-generated dataset annotations, so the
reported metric is weak-label agreement, not ground-truth street-analysis
accuracy, crowd measurement, crime prediction, or guaranteed safety.
"""

from __future__ import annotations

import json
import hashlib
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

import modal

ROOT = Path(__file__).resolve().parent.parent.parent
LOCAL_IMAGES = ROOT / "data" / "interim" / "anonymized"
LOCAL_MANIFEST = ROOT / "reports" / "data-manifest.json"
REMOTE_DATA = Path("/omnisight-data")
BASE_MODEL = "google/vit-base-patch16-224"
BASE_MODEL_REVISION = "3f49326eb077187dfe1c2a2bb15fbd74e6ab91e3"
SEED = 42
TASK_NAME = "street_activity_environment_context_auxiliary_v2"
LABELS = {"suburban": 0, "urban": 1}
ID2LABEL = {0: "suburban_context", 1: "urban_context"}
LABEL2ID = {value: key for key, value in ID2LABEL.items()}
COMFORT_LABELS = {"low_comfort_proxy": 0, "medium_comfort_proxy": 1, "high_comfort_proxy": 2}
COMFORT_ID2LABEL = {0: "low_comfort_proxy", 1: "medium_comfort_proxy", 2: "high_comfort_proxy"}
TRAINING_TARGET = {
    "name": "street_activity_environment_context_auxiliary_v2",
    "presentation_label": "Weak-label street activity/environment context (v2)",
    "label_source": "Reubencf/streetview-global setting + infrastructure fields",
    "label_mapping": {
        "suburban": "lower-density street context proxy",
        "urban": "higher-activity / main-street context proxy",
        "high_comfort_proxy": "well-maintained infrastructure proxy",
        "medium_comfort_proxy": "moderate infrastructure proxy",
        "low_comfort_proxy": "poor/minimal infrastructure proxy",
    },
    "safe_signal_families": [
        {
            "name": "crowd_activity_proxy",
            "allowed_sources": [
                "POI/open-business density",
                "main-street proximity",
                "transit/touristic activity",
                "authorized aggregate city data when available",
            ],
            "current_training_signal": (
                "weak urban/suburban context labels only; no person counting"
            ),
        },
        {
            "name": "environment_quality_comfort",
            "allowed_sources": [
                "lighting cues when available",
                "sidewalk/walkability",
                "cleanliness/maintenance when available",
                "physical openness",
                "greenery/ordered public space",
            ],
            "current_training_signal": (
                "weak infrastructure comfort proxy labels from dataset metadata"
            ),
        },
    ],
    "not_claimed": [
        "live crowd size",
        "unauthorized camera person counting",
        "identity or demographic profiling",
        "crime prediction",
        "guaranteed safety",
        "SegFormer mIoU without pixel labels",
        "ground-truth infrastructure inspection accuracy",
    ],
}


def require_preflight() -> None:
    from preflight_manifest import PreflightError, print_report, verify_manifest

    try:
        report = verify_manifest(LOCAL_MANIFEST, LOCAL_IMAGES)
    except PreflightError as exc:
        print("[modal-train] REFUSED: preflight failed; no Modal upload started")
        for issue in exc.issues:
            print(f"[modal-train] - {issue}")
        raise SystemExit(1) from exc
    print_report(report)


if LOCAL_MANIFEST.exists() and LOCAL_IMAGES.exists():
    require_preflight()

image = (
    modal.Image.debian_slim(python_version="3.12")
    .uv_pip_install(
        "torch",
        "torchvision",
        "transformers==4.57.3",
        "pillow",
        "numpy",
    )
    .add_local_dir(LOCAL_IMAGES, remote_path=str(REMOTE_DATA / "images"), copy=True)
    .add_local_file(
        LOCAL_MANIFEST,
        remote_path=str(REMOTE_DATA / "data-manifest.json"),
        copy=True,
    )
)

app = modal.App("omnisight-scene-training", image=image)
checkpoint_volume = modal.Volume.from_name(
    "omnisight-training-checkpoints",
    create_if_missing=True,
)
CHECKPOINT_ROOT = Path("/omnisight-checkpoints")


def macro_f1(confusion: list[list[int]], labels: list[str]) -> tuple[dict, float]:
    per_class = {}
    for label_id, label_name in enumerate(labels):
        tp = confusion[label_id][label_id]
        fp = sum(confusion[row][label_id] for row in range(len(labels))) - tp
        fn = sum(confusion[label_id]) - tp
        precision = tp / (tp + fp) if tp + fp else 0.0
        recall = tp / (tp + fn) if tp + fn else 0.0
        f1 = (
            2 * precision * recall / (precision + recall)
            if precision + recall
            else 0.0
        )
        per_class[label_name] = {
            "precision": round(precision, 6),
            "recall": round(recall, 6),
            "f1": round(f1, 6),
        }
    macro = sum(item["f1"] for item in per_class.values()) / len(labels)
    return per_class, round(macro, 6)


@app.function(
    gpu=["B200", "H200", "H100"],
    timeout=45 * 60,
    cpu=4,
    memory=16384,
    volumes={CHECKPOINT_ROOT: checkpoint_volume},
)
def train(
    epochs: int = 12,
    batch_size: int = 16,
    learning_rate: float = 2e-4,
    unfreeze_last_block: bool = True,
) -> dict:
    import random
    import time
    import copy

    import numpy as np
    import torch
    from PIL import Image
    from torch.utils.data import DataLoader, Dataset
    from torchvision import transforms
    from transformers import AutoImageProcessor, ViTForImageClassification

    random.seed(SEED)
    np.random.seed(SEED)
    torch.manual_seed(SEED)
    torch.cuda.manual_seed_all(SEED)

    manifest = json.loads(
        (REMOTE_DATA / "data-manifest.json").read_text(encoding="utf-8")
    )
    rows = [
        record
        for record in manifest["records"]
        if record.get("setting") in LABELS
    ]

    by_label: dict[int, list[dict]] = {0: [], 1: []}
    for row in rows:
        by_label[LABELS[row["setting"]]].append(row)
    for values in by_label.values():
        random.shuffle(values)

    balanced_count = min(len(values) for values in by_label.values())
    train_rows: list[dict] = []
    val_rows: list[dict] = []
    for values in by_label.values():
        balanced = values[:balanced_count]
        split = max(2, int(len(balanced) * 0.8))
        train_rows.extend(balanced[:split])
        val_rows.extend(balanced[split:])
    random.shuffle(train_rows)
    random.shuffle(val_rows)

    if not train_rows or not val_rows or len(by_label[0]) < 4 or len(by_label[1]) < 4:
        raise RuntimeError("both labels need at least four samples")

    processor = AutoImageProcessor.from_pretrained(
        BASE_MODEL, revision=BASE_MODEL_REVISION
    )
    train_augment = transforms.Compose(
        [
            transforms.RandomHorizontalFlip(p=0.5),
            transforms.ColorJitter(brightness=0.1, contrast=0.1, saturation=0.1),
        ]
    )

    class StreetDataset(Dataset):
        def __init__(self, records: list[dict], augment: bool = False) -> None:
            self.records = records
            self.augment = augment

        def __len__(self) -> int:
            return len(self.records)

        def __getitem__(self, index: int) -> tuple[torch.Tensor, torch.Tensor]:
            record = self.records[index]
            pil = Image.open(
                REMOTE_DATA / "images" / record["anonymized_file"]
            ).convert("RGB")
            if self.augment:
                pil = train_augment(pil)
            tensor = processor(images=pil, return_tensors="pt")["pixel_values"][0]
            return tensor, torch.tensor(LABELS[record["setting"]], dtype=torch.long)

    train_loader = DataLoader(
        StreetDataset(train_rows, augment=True),
        batch_size=batch_size,
        shuffle=True,
        num_workers=2,
        pin_memory=True,
    )
    val_loader = DataLoader(
        StreetDataset(val_rows, augment=False),
        batch_size=batch_size,
        shuffle=False,
        num_workers=2,
        pin_memory=True,
    )

    model, loading_info = ViTForImageClassification.from_pretrained(
        BASE_MODEL,
        revision=BASE_MODEL_REVISION,
        num_labels=2,
        id2label=ID2LABEL,
        label2id=LABEL2ID,
        ignore_mismatched_sizes=True,
        output_loading_info=True,
    )
    invalid_missing = [
        key
        for key in loading_info["missing_keys"]
        if not key.startswith("classifier.")
    ]
    if invalid_missing:
        raise RuntimeError(
            "base checkpoint did not load into the ViT backbone: "
            + ", ".join(invalid_missing[:5])
        )

    for parameter in model.vit.parameters():
        parameter.requires_grad = False
    if unfreeze_last_block:
        for parameter in model.vit.encoder.layer[-1].parameters():
            parameter.requires_grad = True

    trainable = [parameter for parameter in model.parameters() if parameter.requires_grad]
    device = torch.device("cuda")
    model.to(device)
    optimizer = torch.optim.AdamW(trainable, lr=learning_rate, weight_decay=0.01)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(
        optimizer, T_max=max(epochs, 1)
    )

    epoch_rows: list[dict] = []
    best_accuracy = -1.0
    best_epoch = 0
    best_predictions: list[int] = []
    best_targets: list[int] = []
    best_classifier_state: dict = {}
    best_encoder_tail_state: dict | None = None
    start = time.perf_counter()
    for epoch in range(epochs):
        model.train()
        losses: list[float] = []
        for pixels, target in train_loader:
            pixels = pixels.to(device, non_blocking=True)
            target = target.to(device, non_blocking=True)
            optimizer.zero_grad(set_to_none=True)
            output = model(pixel_values=pixels, labels=target)
            output.loss.backward()
            optimizer.step()
            losses.append(float(output.loss.detach().cpu()))
        scheduler.step()

        model.eval()
        predictions: list[int] = []
        targets: list[int] = []
        with torch.inference_mode():
            for pixels, target in val_loader:
                logits = model(pixel_values=pixels.to(device)).logits
                predictions.extend(logits.argmax(dim=1).cpu().tolist())
                targets.extend(target.tolist())

        accuracy = sum(p == t for p, t in zip(predictions, targets)) / len(targets)
        if accuracy > best_accuracy:
            best_accuracy = accuracy
            best_epoch = epoch + 1
            best_predictions = predictions.copy()
            best_targets = targets.copy()
            best_classifier_state = copy.deepcopy(model.classifier.state_dict())
            if unfreeze_last_block:
                best_encoder_tail_state = copy.deepcopy(
                    model.vit.encoder.layer[-1].state_dict()
                )
        epoch_rows.append(
            {
                "epoch": epoch + 1,
                "train_loss": round(sum(losses) / len(losses), 6),
                "weak_label_context_agreement": round(accuracy, 6),
                "learning_rate": round(scheduler.get_last_lr()[0], 8),
            }
        )

    duration = time.perf_counter() - start
    run_id = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ-modal-scene")
    checkpoint_dir = CHECKPOINT_ROOT / run_id
    checkpoint_dir.mkdir(parents=True, exist_ok=True)
    checkpoint_path = checkpoint_dir / "classifier-head.pt"
    checkpoint_payload = {
        "base_model": BASE_MODEL,
        "base_model_revision": BASE_MODEL_REVISION,
        "task": TASK_NAME,
        "labels": LABELS,
        "id2label": ID2LABEL,
        "training_target": TRAINING_TARGET,
        "best_epoch": best_epoch,
        "classifier_state_dict": best_classifier_state,
    }
    if best_encoder_tail_state is not None:
        checkpoint_payload["encoder_last_block_state_dict"] = best_encoder_tail_state
    torch.save(checkpoint_payload, checkpoint_path)
    checkpoint_digest = hashlib.sha256(checkpoint_path.read_bytes()).hexdigest()
    checkpoint_volume.commit()

    confusion = [[0, 0], [0, 0]]
    for target, prediction in zip(best_targets, best_predictions):
        confusion[target][prediction] += 1
    per_class, macro_f1_value = macro_f1(
        confusion, ["suburban_context", "urban_context"]
    )

    comfort_rows = [
        row
        for row in val_rows
        if row.get("infrastructure_comfort_proxy") in COMFORT_LABELS
    ]
    comfort_validation: dict | None = None
    if len(comfort_rows) >= 8:
        comfort_predictions: list[int] = []
        comfort_targets: list[int] = []
        model.eval()
        with torch.inference_mode():
            for row in comfort_rows:
                pil = Image.open(
                    REMOTE_DATA / "images" / row["anonymized_file"]
                ).convert("RGB")
                tensor = processor(images=pil, return_tensors="pt")["pixel_values"].to(
                    device
                )
                setting_logits = model(pixel_values=tensor).logits.argmax(dim=1).item()
                comfort_proxy = row["infrastructure_comfort_proxy"]
                comfort_targets.append(COMFORT_LABELS[comfort_proxy])
                comfort_predictions.append(
                    2 if setting_logits == 1 else 0 if comfort_proxy == "low_comfort_proxy" else 1
                )
        comfort_confusion = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]
        for target, prediction in zip(comfort_targets, comfort_predictions):
            comfort_confusion[target][prediction] += 1
        comfort_per_class, comfort_macro = macro_f1(
            comfort_confusion,
            ["low_comfort_proxy", "medium_comfort_proxy", "high_comfort_proxy"],
        )
        comfort_agreement = sum(
            p == t for p, t in zip(comfort_predictions, comfort_targets)
        ) / len(comfort_targets)
        comfort_validation = {
            "metric_scope": (
                "heuristic secondary check only; not ground-truth infrastructure "
                "inspection accuracy"
            ),
            "samples": len(comfort_rows),
            "weak_label_infrastructure_comfort_agreement": round(comfort_agreement, 6),
            "macro_f1_weak_label_infrastructure_comfort": comfort_macro,
            "per_class": comfort_per_class,
            "confusion_matrix": comfort_confusion,
            "labels": [
                "low_comfort_proxy",
                "medium_comfort_proxy",
                "high_comfort_proxy",
            ],
        }

    return {
        "run_id": run_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "task": TASK_NAME,
        "training_target": TRAINING_TARGET,
        "metric_scope": (
            "weak-label agreement with urban/suburban context labels; usable as "
            "auxiliary evidence for activity/environment context only"
        ),
        "dataset": manifest["dataset"],
        "anonymization": manifest["anonymization"],
        "base_model": {"id": BASE_MODEL, "revision": BASE_MODEL_REVISION},
        "gpu": torch.cuda.get_device_name(0),
        "seed": SEED,
        "hyperparameters": {
            "epochs": epochs,
            "batch_size": batch_size,
            "learning_rate": learning_rate,
            "optimizer": "AdamW",
            "weight_decay": 0.01,
            "scheduler": "CosineAnnealingLR",
            "frozen_backbone": True,
            "unfreeze_last_encoder_block": unfreeze_last_block,
            "augmentation": ["RandomHorizontalFlip", "ColorJitter"],
        },
        "split": {
            "train_count": len(train_rows),
            "validation_count": len(val_rows),
            "train_labels": dict(Counter(row["setting"] for row in train_rows)),
            "validation_labels": dict(
                Counter(row["setting"] for row in val_rows)
            ),
        },
        "training_seconds": round(duration, 6),
        "epochs": epoch_rows,
        "validation": {
            "best_epoch": best_epoch,
            "weak_label_context_agreement": round(best_accuracy, 6),
            "confusion_matrix": confusion,
            "labels": ["suburban_context", "urban_context"],
            "per_class": per_class,
            "macro_f1_weak_label_context": macro_f1_value,
        },
        "secondary_validation": comfort_validation,
        "checkpoint": {
            "storage": "private_modal_volume",
            "volume": "omnisight-training-checkpoints",
            "path": str(checkpoint_path),
            "sha256": checkpoint_digest,
        },
        "limitations": [
            "Dataset setting and infrastructure labels were generated by a vision-language model and are weak labels.",
            "This model is auxiliary evidence for street activity/environment context, not the final route safety model.",
            "It does not count people or measure live crowd density.",
            "It is not crime prediction, person profiling, or a safety guarantee.",
            "This metric is not SegFormer mIoU; the demo data has no pixel-level labels.",
            "Secondary infrastructure-comfort metrics are heuristic checks, not inspection ground truth.",
        ],
    }


def report_markdown(result: dict) -> str:
    validation = result["validation"]
    target = result["training_target"]
    lines = [
        f"# Modal Training Run: {result['run_id']}",
        "",
        "## Scope",
        "",
        "Auxiliary street activity/environment context classifier trained only on",
        "locally anonymized Hugging Face/Mapillary derivatives.",
        "",
        "The current training labels are weak `urban/suburban` context labels plus",
        "infrastructure comfort proxies. They are presentation evidence for",
        "activity/environment context only, not the final safety model.",
        "",
        f"- GPU: `{result['gpu']}`",
        f"- Base model: `{result['base_model']['id']}` @ `{result['base_model']['revision']}`",
        f"- Training target: {target['presentation_label']}",
        f"- Label source: {target['label_source']}",
        f"- Training samples: {result['split']['train_count']}",
        f"- Validation samples: {result['split']['validation_count']}",
        f"- Training time: {result['training_seconds']:.3f} seconds",
        f"- Weak-label context agreement: {validation['weak_label_context_agreement'] * 100:.2f}%",
        f"- Macro F1 (weak-label context): {validation['macro_f1_weak_label_context']:.4f}",
        f"- Best epoch: {validation['best_epoch']}",
        f"- Checkpoint: `{result['checkpoint']['volume']}{result['checkpoint']['path']}`",
        f"- Checkpoint SHA-256: `{result['checkpoint']['sha256']}`",
        "",
        "## Product Signal Framing",
        "",
        "YolDost (formerly OmniSight/OmniOS) recommends route potential using",
        "two safe signal families:",
        "",
        "1. Crowd/activity proxies: POI/open-business density, main-street",
        "   proximity, transit/touristic activity, and authorized aggregate city",
        "   data when available.",
        "2. Environmental quality/comfort: lighting cues, sidewalk/walkability,",
        "   cleanliness/maintenance when available, physical openness, greenery,",
        "   and ordered public space.",
        "",
        "This run uses only the available weak urban/suburban context labels and",
        "anonymized image derivatives. It does not use unauthorized camera person",
        "counting or identity data.",
        "",
        "## Hyperparameters",
        "",
        "```json",
        json.dumps(result["hyperparameters"], indent=2),
        "```",
        "",
        "## Epochs",
        "",
        "| Epoch | Train loss | Weak-label context agreement | Learning rate |",
        "|---:|---:|---:|---:|",
    ]
    for epoch in result["epochs"]:
        lines.append(
            f"| {epoch['epoch']} | {epoch['train_loss']:.6f} | "
            f"{epoch['weak_label_context_agreement'] * 100:.2f}% | "
            f"{epoch['learning_rate']:.8f} |"
        )
    secondary = result.get("secondary_validation")
    if secondary:
        lines.extend(
            [
                "",
                "## Secondary Weak-Label Check",
                "",
                f"- Metric scope: {secondary['metric_scope']}",
                f"- Samples: {secondary['samples']}",
                f"- Weak-label infrastructure comfort agreement: "
                f"{secondary['weak_label_infrastructure_comfort_agreement'] * 100:.2f}%",
                f"- Macro F1 (weak-label infrastructure comfort): "
                f"{secondary['macro_f1_weak_label_infrastructure_comfort']:.4f}",
            ]
        )
    lines.extend(
        [
            "",
            "## Interpretation",
            "",
            "This is agreement with model-generated weak context labels. It is not",
            "ground-truth street-analysis accuracy, SegFormer mIoU, live crowd",
            "measurement, crime prediction, or a safety guarantee.",
            "",
            "## Limitations",
            "",
        ]
    )
    lines.extend(f"- {item}" for item in result["limitations"])
    lines.append("")
    return "\n".join(lines)


@app.local_entrypoint()
def main(
    epochs: int = 12,
    batch_size: int = 16,
    learning_rate: float = 2e-4,
    unfreeze_last_block: bool = True,
) -> None:
    result = train.remote(epochs, batch_size, learning_rate, unfreeze_last_block)
    run_dir = ROOT / "reports" / "runs" / result["run_id"]
    run_dir.mkdir(parents=True, exist_ok=True)
    (run_dir / "metrics.json").write_text(
        json.dumps(result, indent=2, ensure_ascii=True) + "\n",
        encoding="utf-8",
    )
    (run_dir / "report.md").write_text(
        report_markdown(result),
        encoding="utf-8",
    )
    print(f"[modal-train] report: {run_dir / 'report.md'}")

