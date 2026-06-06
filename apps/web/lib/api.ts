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
export const API_BASE_URL = stripTrailingSlash(
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ?? "",
);

function stripTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function apiURL(path: string): string {
  if (!API_BASE_URL) {
    throw new Error(
      "NEXT_PUBLIC_API_BASE_URL is not configured; final demo requires the Render API URL.",
    );
  }
  return `${API_BASE_URL}${path}`;
}

async function getJSON<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(apiURL(path), {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    // UI callers render explicit unavailable states; no embedded web fallback.
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

export type RoutePreference =
  | "balanced"
  | "open"
  | "sidewalk"
  | "green"
  | "active_frontage";

export interface LivePhysicalIndicators {
  comfort: number;
  openness: number;
  sidewalk: number;
  greenery: number;
  built_density: number;
  road_share: number;
  active_frontage: number;
}

export interface LiveRouteOption {
  id: string;
  distance_meters: number;
  duration_seconds: number;
  encoded_polyline: string;
  google_route_labels: string[];
  analysis_coverage: number;
  omnisight_score: number | null;
  recommendation_status: "analyzed" | "insufficient_analysis_coverage";
  explanation: string | null;
  physical_indicators?: LivePhysicalIndicators | null;
}

export interface ComputeRoutesResponse {
  preference: RoutePreference;
  routes: LiveRouteOption[];
  attribution: "Google Maps";
  disclaimer: string;
  generated_live: true;
  persistent_cache: false;
}

export async function computeWalkingRoutes(
  originAddress: string,
  destinationAddress: string,
  preference: RoutePreference,
): Promise<ComputeRoutesResponse> {
  const res = await fetch(apiURL("/api/v1/routes"), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      origin: { address: originAddress },
      destination: { address: destinationAddress },
      preference,
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`live routes unavailable: HTTP ${res.status}`);
  }
  return (await res.json()) as ComputeRoutesResponse;
}

/** Route summary sent to the assistant endpoint (metric snapshot only). */
export interface RouteAssistantRouteSummary {
  id: string;
  distance_meters: number;
  duration_seconds: number;
  analysis_coverage: number;
  omnisight_score: number | null;
  recommendation_status: "analyzed" | "insufficient_analysis_coverage";
  explanation: string | null;
}

export interface RouteAssistantRequest {
  message: string;
  preference: string;
  routes: RouteAssistantRouteSummary[];
}

export interface RouteAssistantResponse {
  answer: string;
  provider: "cursor-sdk";
  model: string;
  generated_live: true;
}

/**
 * The Cursor SDK is hosted in a same-origin Vercel server route. It remains
 * separate from the mandatory Go routing backend because the SDK is
 * TypeScript-only.
 */
export async function postRouteAssistant(
  body: RouteAssistantRequest,
): Promise<RouteAssistantResponse> {
  const res = await fetch("/api/route-assistant", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`route assistant unavailable: HTTP ${res.status}`);
  }
  return (await res.json()) as RouteAssistantResponse;
}
