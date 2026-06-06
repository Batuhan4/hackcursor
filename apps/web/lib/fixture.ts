import type { DemoRun, Detection } from "./contracts";

/**
 * Offline fallback snapshot — identical to the fixture served by
 * services/api/internal/infrastructure/memory. The dashboard renders this
 * when the API is unreachable so the demo skeleton is always visible.
 */
export const FIXTURE_RUN: DemoRun = {
  id: "demo-fixture-0001",
  name: "Güngören fixture run",
  status: "completed",
  image_count: 3,
  detection_count: 7,
  anonymized_region_count: 5,
  model_id: "shirabendor/YOLOV8-oiv7",
  started_at: "2026-06-06T11:30:00Z",
  completed_at: "2026-06-06T11:31:30Z",
};

const base = {
  demo_run_id: FIXTURE_RUN.id,
  evidence_uri: null,
  model_id: FIXTURE_RUN.model_id,
};

export const FIXTURE_DETECTIONS: Detection[] = [
  { ...base, id: "det-0001", image_id: "fixture-gungoren-001", object_class: "traffic_sign", confidence: 0.91, bbox: { x: 0.12, y: 0.22, width: 0.08, height: 0.14 }, lat: 41.0192, lng: 28.8725 },
  { ...base, id: "det-0002", image_id: "fixture-gungoren-001", object_class: "trash_bin", confidence: 0.84, bbox: { x: 0.61, y: 0.58, width: 0.1, height: 0.16 }, lat: 41.0192, lng: 28.8725 },
  { ...base, id: "det-0003", image_id: "fixture-gungoren-001", object_class: "pole", confidence: 0.78, bbox: { x: 0.83, y: 0.15, width: 0.04, height: 0.52 }, lat: 41.0192, lng: 28.8725 },
  { ...base, id: "det-0004", image_id: "fixture-gungoren-002", object_class: "billboard", confidence: 0.88, bbox: { x: 0.3, y: 0.1, width: 0.26, height: 0.2 }, lat: 41.0151, lng: 28.8689 },
  { ...base, id: "det-0005", image_id: "fixture-gungoren-002", object_class: "traffic_light", confidence: 0.81, bbox: { x: 0.71, y: 0.18, width: 0.05, height: 0.12 }, lat: 41.0151, lng: 28.8689 },
  { ...base, id: "det-0006", image_id: "fixture-gungoren-003", object_class: "bench", confidence: 0.76, bbox: { x: 0.42, y: 0.66, width: 0.14, height: 0.1 }, lat: 41.0235, lng: 28.8841 },
  { ...base, id: "det-0007", image_id: "fixture-gungoren-003", object_class: "pothole", confidence: 0.69, bbox: { x: 0.51, y: 0.82, width: 0.12, height: 0.07 }, lat: 41.0235, lng: 28.8841 },
];
