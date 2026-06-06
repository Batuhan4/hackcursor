/**
 * Mirror of packages/contracts/src/index.ts (subset used by the dashboard).
 * Keep field names in sync with packages/contracts/schemas/*.schema.json —
 * update both in the same commit.
 */

export type DemoRunStatus = "pending" | "running" | "completed" | "failed";

export interface DemoRun {
  id: string;
  name: string;
  status: DemoRunStatus;
  image_count: number;
  detection_count: number;
  anonymized_region_count: number;
  model_id: string | null;
  started_at: string | null;
  completed_at: string | null;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Detection {
  id: string;
  demo_run_id: string;
  image_id: string;
  object_class: string;
  confidence: number;
  bbox: BoundingBox;
  lat: number | null;
  lng: number | null;
  evidence_uri: string | null;
  model_id: string | null;
}

/** Go API list envelope: { data, count }. */
export interface ListResponse<T> {
  data: T[];
  count: number;
}

export interface HealthResponse {
  status: string;
  services?: Record<string, string>;
}
