import type {
  ComputeRoutesResponse,
  LiveRouteOption,
  RoutePreference,
} from "./api";

export type RouteMode = "balanced" | "open" | "sidewalk" | "green" | "active";

export interface RouteModeOption {
  id: RouteMode;
  label: string;
  hint: string;
}

export const ROUTE_MODES: readonly RouteModeOption[] = [
  { id: "balanced", label: "Dengeli", hint: "Süre ile konfor dengesi" },
  { id: "open", label: "Daha açık", hint: "Açıklık öncelikli" },
  { id: "sidewalk", label: "Kaldırım dostu", hint: "Kaldırım öncelikli" },
  { id: "green", label: "Daha yeşil", hint: "Yeşillik öncelikli" },
  {
    id: "active",
    label: "Canlı cephe",
    hint: "Aktif cephe potansiyeli öncelikli",
  },
] as const;

export function toRoutePreference(mode: RouteMode): RoutePreference {
  return mode === "active" ? "active_frontage" : mode;
}

export interface RouteIndicators {
  comfort: number;
  openness: number;
  sidewalk: number;
  greenery: number;
  builtDensity: number;
  roadShare: number;
  activeFrontage: number;
}

export interface RoutePoint {
  x: number;
  y: number;
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface RouteOption {
  id: string;
  badge: string;
  isRecommended: boolean;
  isShortest: boolean;
  durationMin: number;
  distanceKm: number;
  extraMin: number;
  modeScore: number;
  indicators: RouteIndicators;
  reason: string;
  path: RoutePoint[];
  geoPath: GeoPoint[];
  analysisCoverage: number;
  omnisightScore: number | null;
  recommendationStatus: "analyzed" | "insufficient_analysis_coverage";
}

type LatLng = { lat: number; lng: number };

const EMPTY_INDICATORS: RouteIndicators = {
  comfort: 0,
  openness: 0,
  sidewalk: 0,
  greenery: 0,
  builtDensity: 0,
  roadShare: 0,
  activeFrontage: 0,
};

function decodePolyline(encoded: string): LatLng[] {
  const points: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;
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

    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }

  return points;
}

function normalizePaths(decoded: LatLng[][]): RoutePoint[][] {
  const all = decoded.flat();
  if (all.length === 0) {
    return decoded.map(() => []);
  }

  const minLat = Math.min(...all.map((point) => point.lat));
  const maxLat = Math.max(...all.map((point) => point.lat));
  const minLng = Math.min(...all.map((point) => point.lng));
  const maxLng = Math.max(...all.map((point) => point.lng));
  const latSpan = maxLat - minLat || 1;
  const lngSpan = maxLng - minLng || 1;

  return decoded.map((path) =>
    path.map((point) => ({
      x: 8 + ((point.lng - minLng) / lngSpan) * 84,
      y: 56 - ((point.lat - minLat) / latSpan) * 48,
    })),
  );
}

function mapIndicators(
  indicators: LiveRouteOption["physical_indicators"],
): RouteIndicators {
  if (!indicators) {
    return EMPTY_INDICATORS;
  }
  return {
    comfort: indicators.comfort,
    openness: indicators.openness,
    sidewalk: indicators.sidewalk,
    greenery: indicators.greenery,
    builtDensity: indicators.built_density,
    roadShare: indicators.road_share,
    activeFrontage: indicators.active_frontage,
  };
}

function routeReason(route: LiveRouteOption): string {
  if (route.recommendation_status === "insufficient_analysis_coverage") {
    return "Canlı Google rotası. Fiziksel analiz kapsaması yetersiz olduğu için YolDost skoru üretilmedi.";
  }
  return (
    route.explanation ??
    "Fiziksel çevre göstergeleriyle analiz edilmiş canlı rota."
  );
}

export function routeOptionsFromResponse(
  response: ComputeRoutesResponse,
): RouteOption[] {
  const decoded = response.routes.map((route) =>
    decodePolyline(route.encoded_polyline),
  );
  const paths = normalizePaths(decoded);
  const shortestDuration = Math.min(
    ...response.routes.map((route) => route.duration_seconds),
  );
  const analyzed = response.routes.filter(
    (route) =>
      route.recommendation_status === "analyzed" &&
      route.omnisight_score !== null,
  );
  const recommendedId = [...analyzed].sort(
    (a, b) => (b.omnisight_score ?? 0) - (a.omnisight_score ?? 0),
  )[0]?.id;

  return response.routes.map((route, index) => {
    const durationMin = Math.ceil(route.duration_seconds / 60);
    const isShortest = route.duration_seconds === shortestDuration;
    const isRecommended = route.id === recommendedId;
    return {
      id: route.id,
      badge: isRecommended
        ? "Fiziksel göstergelere göre önerilen"
        : isShortest
          ? "En kısa canlı rota"
          : `Canlı alternatif ${index + 1}`,
      isRecommended,
      isShortest,
      durationMin,
      distanceKm: route.distance_meters / 1000,
      extraMin: Math.max(0, durationMin - Math.ceil(shortestDuration / 60)),
      modeScore: route.omnisight_score ?? 0,
      indicators: mapIndicators(route.physical_indicators),
      reason: routeReason(route),
      path: paths[index],
      geoPath: decoded[index] ?? [],
      analysisCoverage: route.analysis_coverage,
      omnisightScore: route.omnisight_score,
      recommendationStatus: route.recommendation_status,
    };
  });
}
