"use client";

import type { RouteOption, RoutePoint } from "@/lib/routes";

import styles from "./demo-map.module.css";

/**
 * Schematic rendering of live Google encoded polylines. The geometry comes
 * from Google Routes; the background is intentionally non-cartographic.
 */

interface DemoMapProps {
  routes: RouteOption[];
  selectedRouteId: string | null;
  onSelectRoute: (routeId: string) => void;
}

const VERTICAL_ROADS = [16, 28, 38, 46, 62, 72, 84];
const HORIZONTAL_ROADS = [16, 22, 30, 36, 46, 52];
const MAJOR_VERTICAL = new Set([38, 62]);
const MAJOR_HORIZONTAL = new Set([30, 46]);

function toPolylinePoints(path: RoutePoint[]): string {
  return path.map((p) => `${p.x},${p.y}`).join(" ");
}

export default function DemoMap({
  routes,
  selectedRouteId,
  onSelectRoute,
}: DemoMapProps) {
  const hasRoutes = routes.length > 0;
  const firstPath = routes[0]?.path ?? [];
  const routeStart = firstPath[0];
  const routeEnd = firstPath[firstPath.length - 1];
  // Selected route renders last so it stays on top.
  const ordered = [...routes].sort(
    (a, b) =>
      Number(a.id === selectedRouteId) - Number(b.id === selectedRouteId),
  );

  return (
    <div className={styles.wrap}>
      <svg
        className={styles.svg}
        viewBox="0 0 100 64"
        preserveAspectRatio="xMidYMid slice"
        role="img"
        aria-label={
          hasRoutes
            ? `Canlı rota şeması: ${routes.length} Google rota seçeneği`
            : "Canlı rota şeması"
        }
      >
        <rect x="-4" y="-4" width="108" height="72" className={styles.canvas} />

        {/* Green zones */}
        <rect x="46" y="36" width="34" height="18" rx="2" className={styles.park} />
        <rect x="6" y="6" width="16" height="11" rx="2" className={styles.park} />

        {/* Street grid */}
        {VERTICAL_ROADS.map((x) => (
          <line
            key={`v-${x}`}
            x1={x}
            y1={-4}
            x2={x}
            y2={68}
            className={
              MAJOR_VERTICAL.has(x) ? styles.roadMajor : styles.roadMinor
            }
          />
        ))}
        {HORIZONTAL_ROADS.map((y) => (
          <line
            key={`h-${y}`}
            x1={-4}
            y1={y}
            x2={104}
            y2={y}
            className={
              MAJOR_HORIZONTAL.has(y) ? styles.roadMajor : styles.roadMinor
            }
          />
        ))}

        {/* Route polylines */}
        {ordered.map((route) => {
          const selected = route.id === selectedRouteId;
          const linePoints = toPolylinePoints(route.path);
          return (
            <g
              key={route.id}
              data-selected={selected || undefined}
              data-role={
                route.isRecommended
                  ? "recommended"
                  : route.isShortest
                    ? "shortest"
                    : "warm"
              }
              className={styles.route}
              onClick={() => onSelectRoute(route.id)}
            >
              <title>{`${route.badge} — ${route.durationMin} dk`}</title>
              <polyline points={linePoints} className={styles.routeCasing} />
              <polyline points={linePoints} className={styles.routeLine} />
              <polyline points={linePoints} className={styles.routeHit} />
            </g>
          );
        })}

        {/* Origin / destination markers */}
        {routeStart && routeEnd && (
          <>
            <g
              className={styles.markerStart}
              transform={`translate(${routeStart.x} ${routeStart.y})`}
            >
              <circle r="3" />
              <text dy="1.1" textAnchor="middle">
                A
              </text>
            </g>
            <g
              className={styles.markerEnd}
              transform={`translate(${routeEnd.x} ${routeEnd.y})`}
            >
              <circle r="3" />
              <text dy="1.1" textAnchor="middle">
                B
              </text>
            </g>
          </>
        )}
      </svg>

      <span className={styles.demoTag}>Canlı Google rotası · şematik görünüm</span>
      <span className={styles.sourceTag}>Rota geometrisi: Google Maps</span>
      {!hasRoutes && (
        <span className={styles.hint}>
          Başlangıç ve varış noktalarını girip rotaları bulun; seçenekler bu
          haritada karşılaştırılır.
        </span>
      )}
    </div>
  );
}
