import type {
  DemoRun,
  Detection,
  HealthResponse,
  ListResponse,
  StreetAnalysis,
} from "./contracts";

/**
 * Base URL of the Go API (services/api). Configured per environment:
 * local dev → http://localhost:8080, production → Render service URL.
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

async function getJSON<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    // API offline is a supported demo state — panels fall back to fixture data.
    return null;
  }
}

export function getLiveness(): Promise<HealthResponse | null> {
  return getJSON<HealthResponse>("/health/live");
}

export function getReadiness(): Promise<HealthResponse | null> {
  return getJSON<HealthResponse>("/health/ready");
}

export function getDemoRuns(): Promise<ListResponse<DemoRun> | null> {
  return getJSON<ListResponse<DemoRun>>("/api/v1/demo-runs");
}

export function getDetections(
  demoRunId?: string,
): Promise<ListResponse<Detection> | null> {
  const query = demoRunId
    ? `?demo_run_id=${encodeURIComponent(demoRunId)}`
    : "";
  return getJSON<ListResponse<Detection>>(`/api/v1/detections${query}`);
}

export function getStreetAnalyses(
  demoRunId?: string,
): Promise<ListResponse<StreetAnalysis> | null> {
  const query = demoRunId
    ? `?demo_run_id=${encodeURIComponent(demoRunId)}`
    : "";
  return getJSON<ListResponse<StreetAnalysis>>(
    `/api/v1/street-analyses${query}`,
  );
}
