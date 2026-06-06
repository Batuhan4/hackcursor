export type RoutePreference =
  | 'balanced'
  | 'open'
  | 'sidewalk'
  | 'green'
  | 'active_frontage';

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface PhysicalIndicators {
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
  analysis_coverage: number;
  omnisight_score: number | null;
  recommendation_status: 'analyzed' | 'insufficient_analysis_coverage';
  explanation: string | null;
  physical_indicators?: PhysicalIndicators | null;
}

export interface ComputeRoutesResponse {
  routes: LiveRouteOption[];
}

export interface MobileRouteOption {
  id: string;
  durationMin: number;
  distanceKm: number;
  score: number | null;
  status: LiveRouteOption['recommendation_status'];
  explanation: string;
  geoPath: GeoPoint[];
  indicators: PhysicalIndicators | null;
}

export function decodePolyline(encoded: string): GeoPoint[] {
  const points: GeoPoint[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index < encoded.length);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index < encoded.length);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }

  return points;
}

export function mapRouteOptions(routes: LiveRouteOption[]): MobileRouteOption[] {
  return routes.map((route) => ({
    id: route.id,
    durationMin: Math.ceil(route.duration_seconds / 60),
    distanceKm: route.distance_meters / 1000,
    score: route.omnisight_score,
    status: route.recommendation_status,
    explanation:
      route.explanation ??
      'Canlı Google rotası; fiziksel analiz kapsaması yetersizse skor üretilmez.',
    geoPath: decodePolyline(route.encoded_polyline),
    indicators: route.physical_indicators ?? null,
  }));
}

export async function fetchWalkingRoutes(
  apiBaseUrl: string,
  originAddress: string,
  destinationAddress: string,
  preference: RoutePreference = 'balanced',
): Promise<MobileRouteOption[]> {
  const response = await fetch(`${apiBaseUrl}/api/v1/routes`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      origin: { address: originAddress },
      destination: { address: destinationAddress },
      preference,
    }),
  });

  if (!response.ok) {
    throw new Error(`Route request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as ComputeRoutesResponse;
  return mapRouteOptions(payload.routes);
}
