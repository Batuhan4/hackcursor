#!/usr/bin/env python3
"""CV worker — KVKK anonymization gate + urban object detection.

Pipeline order is a hard rule (see workers/cv/README.md and docs/kvkk.md):

    1. anonymize_faces_and_plates()   <- the GATE, always first
    2. detect_urban_objects()         <- only on anonymized derivatives
    3. write_detection_result()       <- metadata out, contracts-aligned

The face and plate detectors used by step 1 exist ONLY to locate regions for
irreversible masking. Their output is never stored, never used as an identity
feature, and never leaves this process — only region COUNTS are recorded.
Face recognition, plate OCR/reading, person profiling and person/vehicle
tracking are forbidden and intentionally not implemented.

Modes
-----
placeholder (scaffold default)
    Input is the synthetic JSON fixture (data/fixtures/demo-input.json) or the
    embedded copy of it — metadata only, no imagery. Output is deterministic:
    running twice produces byte-identical JSON, which scripts/demo-fixture.sh
    verifies. Requires only the Python stdlib.

real imagery (pending)
    Requires workers/cv/requirements.txt installed AND the anonymization
    pipeline wired. Until then this worker REFUSES image inputs rather than
    risk running detection on raw imagery.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

SCHEMA_VERSION = "1.0"
PLACEHOLDER_MODEL = "placeholder"
# Planned default detection model — Hugging Face (see docs/ai-usage.md).
DEFAULT_HF_MODEL = "shirabendor/YOLOV8-oiv7"

IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".tif", ".tiff"}

ROOT = Path(__file__).resolve().parent.parent.parent
DEFAULT_FIXTURE = ROOT / "data" / "fixtures" / "demo-input.json"


def anonymize_faces_and_plates(image_record: dict[str, Any], mode: str) -> dict[str, Any]:
    """KVKK GATE: irreversibly mask faces and license plates.

    Real mode (pending): run the HF face/plate detectors
    (arnabdhar/YOLOv8-Face-Detection, Koushim/yolov8-license-plate-detection)
    over the raw frame, apply gaussian blur / solid mask to every region, and
    return ONLY counts + method. The masked derivative replaces the raw frame
    for every later step. Raw region contents are never returned.

    Placeholder mode: materialize the counts declared in the fixture.
    """
    if mode != "placeholder":
        raise NotImplementedError(
            "real anonymization pipeline pending — placeholder mode only"
        )

    placeholder = image_record.get("placeholder", {})
    return {
        "status": "completed",
        "method": "gaussian_blur",
        "faces_masked": int(placeholder.get("faces", 0)),
        "plates_masked": int(placeholder.get("plates", 0)),
        "irreversible": True,
    }


def detect_urban_objects(
    image_record: dict[str, Any],
    anonymization: dict[str, Any],
    model: str,
    mode: str,
) -> list[dict[str, Any]]:
    """Detect inanimate urban objects on the ANONYMIZED derivative only.

    The anonymization gate result is a required argument on purpose: calling
    this without a completed gate is a programming error, not a soft warning.
    """
    if anonymization.get("status") != "completed":
        raise RuntimeError(
            "KVKK gate violation: detection requested before anonymization completed"
        )

    if mode != "placeholder":
        raise NotImplementedError(
            "real detection pipeline pending — placeholder mode only"
        )

    detections = []
    for entry in image_record.get("placeholder", {}).get("detections", []):
        detections.append(
            {
                "object_class": entry["object_class"],
                "confidence": entry["confidence"],
                "bbox": entry["bbox"],
                "lat": image_record.get("lat"),
                "lng": image_record.get("lng"),
                "evidence_uri": None,
                "model_id": model if model != PLACEHOLDER_MODEL else None,
            }
        )
    return detections


def write_detection_result(result: dict[str, Any], output: str) -> None:
    """Write the run result as deterministic JSON (sorted keys, fixed indent)."""
    payload = json.dumps(result, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
    if output == "-":
        sys.stdout.write(payload)
        return
    out_path = Path(output)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(payload, encoding="utf-8")
    print(f"[cv-worker] wrote {out_path}")


def load_fixture(path: Path) -> dict[str, Any]:
    with path.open(encoding="utf-8") as fh:
        return json.load(fh)


def looks_like_imagery(path: Path) -> bool:
    if path.is_dir():
        return True
    return path.suffix.lower() in IMAGE_SUFFIXES


def run_placeholder(fixture: dict[str, Any], model: str) -> dict[str, Any]:
    """Materialize a deterministic demo run from the synthetic fixture."""
    results = []
    detection_seq = 0
    demo_run_id = fixture.get("demo_run_id", "demo-fixture-0001")

    for image_record in fixture.get("images", []):
        image_id = image_record["image_id"]

        # 1. GATE first — always.
        anonymization = anonymize_faces_and_plates(image_record, "placeholder")

        # 2. Detection second — only with a completed gate.
        detections = detect_urban_objects(
            image_record, anonymization, model, "placeholder"
        )
        for det in detections:
            detection_seq += 1
            det["id"] = f"det-{detection_seq:04d}"
            det["demo_run_id"] = demo_run_id
            det["image_id"] = image_id

        results.append(
            {
                "image_id": image_id,
                "anonymization": anonymization,
                "detections": detections,
                "warnings": [],
            }
        )

    return {
        "schema_version": SCHEMA_VERSION,
        "generated_by": "workers/cv/run_demo.py",
        "mode": "placeholder",
        "demo_run_id": demo_run_id,
        "demo_run_name": fixture.get("demo_run_name", "fixture run"),
        "model": model,
        "results": results,
        "warnings": [
            "placeholder mode: outputs materialized from the synthetic fixture, "
            "no imagery was processed",
        ],
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument(
        "--input",
        default=str(DEFAULT_FIXTURE),
        help="JSON fixture path (placeholder mode). Image paths are refused "
        "until the anonymization pipeline is wired.",
    )
    parser.add_argument(
        "--output",
        default="-",
        help="Output JSON path, or '-' for stdout.",
    )
    parser.add_argument(
        "--model",
        default=PLACEHOLDER_MODEL,
        help=f"Detection model reference (planned default: {DEFAULT_HF_MODEL}).",
    )
    args = parser.parse_args(argv)

    input_path = Path(args.input)
    if not input_path.exists():
        print(f"[cv-worker] input not found: {input_path}", file=sys.stderr)
        return 2

    # KVKK-safe default: refuse real imagery while the anonymization pipeline
    # is pending. Detection must never run on raw frames.
    if looks_like_imagery(input_path):
        print(
            "[cv-worker] REFUSED: real imagery processing requires the "
            "anonymization pipeline, which is not wired yet. Running "
            "detection on raw imagery would violate the KVKK gate "
            "(docs/kvkk.md). Use the JSON fixture for placeholder mode:\n"
            f"  --input {DEFAULT_FIXTURE.relative_to(ROOT)}",
            file=sys.stderr,
        )
        return 3

    if input_path.suffix.lower() != ".json":
        print(
            f"[cv-worker] unsupported input type: {input_path.suffix} "
            "(expected a .json fixture)",
            file=sys.stderr,
        )
        return 2

    fixture = load_fixture(input_path)
    result = run_placeholder(fixture, args.model)
    write_detection_result(result, args.output)

    total_detections = sum(len(r["detections"]) for r in result["results"])
    total_regions = sum(
        r["anonymization"]["faces_masked"] + r["anonymization"]["plates_masked"]
        for r in result["results"]
    )
    print(
        f"[cv-worker] placeholder run complete: "
        f"{len(result['results'])} images, {total_detections} detections, "
        f"{total_regions} regions anonymized"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
