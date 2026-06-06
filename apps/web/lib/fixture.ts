import type { DemoRun, Detection, StreetAnalysis } from "./contracts";

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

const analysisBase = {
  demo_run_id: FIXTURE_RUN.id,
  model_id: "nvidia/segformer-b0-finetuned-cityscapes-1024-1024",
};

export const FIXTURE_STREET_ANALYSES: StreetAnalysis[] = [
  { ...analysisBase, id: "analysis-001", image_id: "street-001.jpg", source_label: "Guatemala City", lat: 14.536885, lng: -90.573723, built_density_pct: 16.56, openness_score: 76.19, sidewalk_availability_score: 3.58, greenery_score: 100, road_share_pct: 18.66, pedestrian_comfort_potential: 56.26 },
  { ...analysisBase, id: "analysis-002", image_id: "street-002.jpg", source_label: "Austria - Vienna", lat: 48.1875357, lng: 16.3260175, built_density_pct: 38.67, openness_score: 15.75, sidewalk_availability_score: 8.39, greenery_score: 42.62, road_share_pct: 35.39, pedestrian_comfort_potential: 23.11 },
  { ...analysisBase, id: "analysis-003", image_id: "street-003.jpg", source_label: "North America", lat: 27.961220875019, lng: -82.434712217994, built_density_pct: 3.87, openness_score: 44.99, sidewalk_availability_score: 33.56, greenery_score: 100, road_share_pct: 5.14, pedestrian_comfort_potential: 57.11 },
  { ...analysisBase, id: "analysis-004", image_id: "street-004.jpg", source_label: "South America", lat: -1.38200104, lng: -48.411710133333, built_density_pct: 11.07, openness_score: 100, sidewalk_availability_score: 3.71, greenery_score: 10.97, road_share_pct: 21.65, pedestrian_comfort_potential: 47.39 },
  { ...analysisBase, id: "analysis-005", image_id: "street-005.jpg", source_label: "South America", lat: -1.3820024041667, lng: -48.41180735, built_density_pct: 18.47, openness_score: 79.93, sidewalk_availability_score: 15.79, greenery_score: 16.61, road_share_pct: 45.71, pedestrian_comfort_potential: 44.98 },
  { ...analysisBase, id: "analysis-006", image_id: "street-006.jpg", source_label: "Europe", lat: 55.620605595081, lng: 12.618361472102, built_density_pct: 3.65, openness_score: 58.04, sidewalk_availability_score: 41.16, greenery_score: 90.62, road_share_pct: 42.02, pedestrian_comfort_potential: 62.48 },
];
