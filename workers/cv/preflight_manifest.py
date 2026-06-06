#!/usr/bin/env python3
"""Verify anonymized training data before any Modal upload.

The verifier is intentionally stdlib-only and prints only aggregate status plus
record indexes/filenames for remediation. It never reads image contents beyond
streaming bytes into SHA-256 and never prints raw paths or file contents.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent.parent.parent
DEFAULT_MANIFEST = ROOT / "reports" / "data-manifest.json"
DEFAULT_ANONYMIZED_DIR = ROOT / "data" / "interim" / "anonymized"

EXPECTED_DATASET_ID = "Reubencf/streetview-global"
EXPECTED_DATASET_REVISION = "a206537534dc0e8165e0e7d36f08df14795127db"
EXPECTED_MASK_METHOD = "solid_mask"
EXPECTED_FACE_MODEL_ID = "arnabdhar/YOLOv8-Face-Detection"
EXPECTED_FACE_MODEL_REVISION = "52fa54977207fa4f021de949b515fb19dcab4488"
EXPECTED_PLATE_MODEL_ID = "Koushim/yolov8-license-plate-detection"
EXPECTED_PLATE_MODEL_REVISION = "9aaa5cd490abe0c165882ba87f4f62658ab54d01"

SAFE_IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp"}
RAW_PATH_MARKERS = {
    "raw",
    "private",
    "captures",
    "uploads",
    "datasets",
    "original",
    "unverified",
}
HEX_SHA256 = re.compile(r"^[0-9a-f]{64}$")


class PreflightError(RuntimeError):
    """Raised when anonymized data is not safe to upload."""

    def __init__(self, issues: list[str]) -> None:
        self.issues = issues
        super().__init__("\n".join(issues))


@dataclass(frozen=True)
class PreflightReport:
    records: int
    files_checked: int
    hashes_checked: int
    faces_masked: int
    plates_masked: int


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def load_manifest(path: Path) -> dict[str, Any]:
    with path.open(encoding="utf-8") as handle:
        payload = json.load(handle)
    if not isinstance(payload, dict):
        raise PreflightError(["manifest root must be a JSON object"])
    return payload


def is_relative_plain_image(value: str) -> bool:
    path = Path(value)
    parts = path.parts
    if path.is_absolute() or len(parts) != 1:
        return False
    if any(part in {"", ".", ".."} for part in parts):
        return False
    if path.suffix.lower() not in SAFE_IMAGE_SUFFIXES:
        return False
    lowered = value.lower()
    return not any(marker in lowered.split("/") for marker in RAW_PATH_MARKERS)


def require_expected(
    issues: list[str],
    label: str,
    actual: Any,
    expected: str,
    *,
    required: bool = True,
) -> None:
    if actual is None and not required:
        return
    if actual != expected:
        issues.append(f"{label} must be {expected!r}")


def verify_manifest(
    manifest_path: Path = DEFAULT_MANIFEST,
    anonymized_dir: Path = DEFAULT_ANONYMIZED_DIR,
) -> PreflightReport:
    issues: list[str] = []
    manifest_path = manifest_path.resolve()
    anonymized_dir = anonymized_dir.resolve()

    if not manifest_path.exists():
        raise PreflightError(["reports/data-manifest.json is missing"])
    if not anonymized_dir.exists() or not anonymized_dir.is_dir():
        raise PreflightError(["data/interim/anonymized directory is missing"])

    manifest = load_manifest(manifest_path)
    dataset = manifest.get("dataset") or {}
    anonymization = manifest.get("anonymization") or {}
    face_model = anonymization.get("face_model") or {}
    plate_model = anonymization.get("plate_model") or {}

    require_expected(issues, "dataset.id", dataset.get("id"), EXPECTED_DATASET_ID)
    require_expected(
        issues,
        "dataset.revision",
        dataset.get("revision"),
        EXPECTED_DATASET_REVISION,
    )
    require_expected(
        issues,
        "anonymization.method",
        anonymization.get("method"),
        EXPECTED_MASK_METHOD,
    )
    require_expected(
        issues,
        "anonymization.face_model.id",
        face_model.get("id"),
        EXPECTED_FACE_MODEL_ID,
        required=False,
    )
    require_expected(
        issues,
        "anonymization.face_model.revision",
        face_model.get("revision"),
        EXPECTED_FACE_MODEL_REVISION,
        required=False,
    )
    require_expected(
        issues,
        "anonymization.plate_model.id",
        plate_model.get("id"),
        EXPECTED_PLATE_MODEL_ID,
        required=False,
    )
    require_expected(
        issues,
        "anonymization.plate_model.revision",
        plate_model.get("revision"),
        EXPECTED_PLATE_MODEL_REVISION,
        required=False,
    )

    records = manifest.get("records")
    if not isinstance(records, list) or not records:
        issues.append("records must be a non-empty array")
        raise PreflightError(issues)

    sample_count = manifest.get("sample_count")
    if sample_count is not None and sample_count != len(records):
        issues.append("sample_count must match records length")

    files_checked = 0
    hashes_checked = 0
    faces_masked = 0
    plates_masked = 0
    seen_files: set[str] = set()

    for index, record in enumerate(records, start=1):
        if not isinstance(record, dict):
            issues.append(f"record {index}: must be a JSON object")
            continue

        filename = record.get("anonymized_file")
        safe_name = filename if isinstance(filename, str) else None
        if not safe_name or not is_relative_plain_image(safe_name):
            issues.append(
                f"record {index}: anonymized_file must be a plain image filename "
                "inside data/interim/anonymized"
            )
            continue
        if safe_name in seen_files:
            issues.append(f"record {index}: duplicate anonymized filename {safe_name!r}")
        seen_files.add(safe_name)

        image_path = (anonymized_dir / safe_name).resolve()
        try:
            image_path.relative_to(anonymized_dir)
        except ValueError:
            issues.append(f"record {index}: image path escapes anonymized directory")
            continue
        if not image_path.exists() or not image_path.is_file():
            issues.append(f"record {index}: missing anonymized image {safe_name!r}")
            continue
        files_checked += 1

        if record.get("mask_method") != EXPECTED_MASK_METHOD:
            issues.append(f"record {index}: mask_method must be {EXPECTED_MASK_METHOD!r}")

        expected_hash = record.get("anonymized_sha256") or record.get("sha256")
        if expected_hash is not None:
            if not isinstance(expected_hash, str) or not HEX_SHA256.match(expected_hash):
                issues.append(f"record {index}: anonymized_sha256 must be lowercase SHA-256")
            else:
                actual_hash = sha256(image_path)
                hashes_checked += 1
                if actual_hash != expected_hash:
                    issues.append(f"record {index}: SHA-256 mismatch for {safe_name!r}")

        faces_masked += int(record.get("faces_masked") or 0)
        plates_masked += int(record.get("plates_masked") or 0)

    if issues:
        raise PreflightError(issues)

    return PreflightReport(
        records=len(records),
        files_checked=files_checked,
        hashes_checked=hashes_checked,
        faces_masked=faces_masked,
        plates_masked=plates_masked,
    )


def manifest_payload(filename: str, digest: str, **overrides: Any) -> dict[str, Any]:
    record = {
        "source_id": "fixture-1",
        "anonymized_file": filename,
        "anonymized_sha256": digest,
        "mask_method": EXPECTED_MASK_METHOD,
        "faces_masked": 1,
        "plates_masked": 0,
    }
    record.update(overrides.pop("record_overrides", {}))
    payload = {
        "dataset": {
            "id": EXPECTED_DATASET_ID,
            "revision": EXPECTED_DATASET_REVISION,
            "license": "CC-BY-SA-4.0",
        },
        "anonymization": {
            "method": EXPECTED_MASK_METHOD,
            "face_model": {
                "id": EXPECTED_FACE_MODEL_ID,
                "revision": EXPECTED_FACE_MODEL_REVISION,
            },
            "plate_model": {
                "id": EXPECTED_PLATE_MODEL_ID,
                "revision": EXPECTED_PLATE_MODEL_REVISION,
            },
        },
        "sample_count": 1,
        "records": [record],
    }
    payload.update(overrides)
    return payload


def run_self_test() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        images = root / "data" / "interim" / "anonymized"
        reports = root / "reports"
        images.mkdir(parents=True)
        reports.mkdir()
        image = images / "street-001.jpg"
        image.write_bytes(b"anonymized-fixture-bytes\n")
        digest = sha256(image)
        manifest = reports / "data-manifest.json"

        manifest.write_text(
            json.dumps(manifest_payload("street-001.jpg", digest), indent=2) + "\n",
            encoding="utf-8",
        )
        report = verify_manifest(manifest, images)
        assert report.records == 1
        assert report.files_checked == 1
        assert report.hashes_checked == 1

        manifest.write_text(
            json.dumps(
                manifest_payload(
                    "../raw/street-001.jpg",
                    digest,
                    record_overrides={"mask_method": "gaussian_blur"},
                ),
                indent=2,
            )
            + "\n",
            encoding="utf-8",
        )
        try:
            verify_manifest(manifest, images)
        except PreflightError as exc:
            joined = "\n".join(exc.issues)
            assert "plain image filename" in joined
        else:
            raise AssertionError("raw path fixture should fail")

        manifest.write_text(
            json.dumps(
                manifest_payload(
                    "street-001.jpg",
                    "0" * 64,
                    anonymization={"method": "gaussian_blur"},
                ),
                indent=2,
            )
            + "\n",
            encoding="utf-8",
        )
        try:
            verify_manifest(manifest, images)
        except PreflightError as exc:
            joined = "\n".join(exc.issues)
            assert "anonymization.method" in joined
            assert "SHA-256 mismatch" in joined
        else:
            raise AssertionError("bad method/hash fixture should fail")


def print_report(report: PreflightReport) -> None:
    print("[preflight] PASS: anonymized manifest verified")
    print(
        "[preflight] "
        f"records={report.records} files={report.files_checked} "
        f"sha256={report.hashes_checked} "
        f"faces_masked={report.faces_masked} plates_masked={report.plates_masked}"
    )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    parser.add_argument("--anonymized-dir", type=Path, default=DEFAULT_ANONYMIZED_DIR)
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()

    if args.self_test:
        run_self_test()
        print("[preflight:self-test] PASS")
        return 0

    try:
        report = verify_manifest(args.manifest, args.anonymized_dir)
    except PreflightError as exc:
        print("[preflight] FAIL: anonymized manifest is not upload-safe")
        for issue in exc.issues:
            print(f"[preflight] - {issue}")
        return 1

    print_report(report)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
