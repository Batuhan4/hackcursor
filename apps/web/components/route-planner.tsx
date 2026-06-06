"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

import { computeWalkingRoutes, getReadiness } from "@/lib/api";
import {
  routeOptionsFromResponse,
  ROUTE_MODES,
  toRoutePreference,
} from "@/lib/routes";
import type { RouteMode, RouteOption } from "@/lib/routes";

import GoogleRouteMap from "./google-route-map";
import RouteAssistant from "./route-assistant";
import styles from "./route-planner.module.css";

type ApiState = "checking" | "online" | "offline";
type DataSource = "live" | null;
type Phase = "idle" | "loading" | "ready";

const HEALTH_POLL_MS = 15_000;
const IBB_CAMERA_URL = "https://uym.ibb.gov.tr/hizmetler/trafik-olcum-ve-gozlem";

const INDICATOR_COLUMNS = [
  { key: "comfort", label: "Konfor" },
  { key: "openness", label: "Açıklık" },
  { key: "sidewalk", label: "Kaldırım" },
  { key: "greenery", label: "Yeşillik" },
  { key: "builtDensity", label: "Yoğunluk" },
] as const;

function formatKm(km: number): string {
  return km.toLocaleString("tr-TR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

export default function RoutePlanner() {
  const [origin, setOrigin] = useState(
    "Güngören Metro İstasyonu, İstanbul",
  );
  const [destination, setDestination] = useState(
    "Güngören Belediyesi, İstanbul",
  );
  const [mode, setMode] = useState<RouteMode>("balanced");
  const [apiState, setApiState] = useState<ApiState>("checking");
  const [source, setSource] = useState<DataSource>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const originRef = useRef<HTMLInputElement>(null);
  const destinationRef = useRef<HTMLInputElement>(null);

  // Lightweight health poll so the status pill reflects connectivity.
  useEffect(() => {
    let cancelled = false;

    async function check() {
      const ready = await getReadiness();
      if (cancelled) return;
      setApiState(ready ? "online" : "offline");
    }

    void check();
    const timer = setInterval(() => void check(), HEALTH_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  async function handleFind(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (phase === "loading") return;

    const from = origin.trim();
    const to = destination.trim();
    if (from === "" || to === "") {
      setFormError("Başlangıç ve varış noktalarını gir.");
      (from === "" ? originRef : destinationRef).current?.focus();
      return;
    }

    setFormError(null);
    setPhase("loading");

    try {
      const live = await computeWalkingRoutes(
        from,
        to,
        toRoutePreference(mode),
      );
      setRoutes(routeOptionsFromResponse(live));
      setSource("live");
      setApiState("online");
      setSelectedRouteId(null);
    } catch {
      setRoutes([]);
      setSource(null);
      setApiState("offline");
      setFormError(
        "Canlı rota servisine ulaşılamadı. Demo veya sahte rota üretilmedi.",
      );
    }
    setPhase("ready");
  }

  const status =
    apiState === "checking"
      ? { text: "Bağlanıyor…", tone: "dim" as const }
      : apiState === "offline"
        ? { text: "Canlı servis çevrimdışı", tone: "warn" as const }
        : source === "live"
          ? { text: "Canlı veri", tone: "ok" as const }
          : { text: "Canlı bağlantı hazır", tone: "ok" as const };

  const effectiveSelectedRouteId = routes.some(
    (route) => route.id === selectedRouteId,
  )
    ? selectedRouteId
    : routes[0]?.id ?? null;
  const selectedRoute =
    routes.find((route) => route.id === effectiveSelectedRouteId) ?? null;

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.brandBlock}>
          <span className={styles.wordmark}>
            Yol<span className={styles.wordmarkAccent}>Dost</span>
          </span>
          <span className={styles.headerSub}>
            {selectedRoute
              ? `${selectedRoute.badge} rota seçili · ${selectedRoute.durationMin} dk yürüyüş`
              : "Çevresel göstergelere göre yürüyüş rotası önerisi"}
          </span>
        </div>
        <span className={styles.statusPill} data-tone={status.tone}>
          {status.text}
        </span>
      </header>

      <form className={styles.search} onSubmit={handleFind}>
        <div className={styles.fields}>
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="route-origin">
              Başlangıç
            </label>
            <input
              id="route-origin"
              ref={originRef}
              className={styles.input}
              value={origin}
              onChange={(event) => setOrigin(event.target.value)}
              placeholder="Örn. Meydan Durağı"
              autoComplete="off"
            />
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="route-destination">
              Varış
            </label>
            <input
              id="route-destination"
              ref={destinationRef}
              className={styles.input}
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              placeholder="Örn. Park Girişi"
              autoComplete="off"
            />
          </div>
          <button
            type="button"
            className={styles.swap}
            aria-label="Başlangıç ve varışı değiştir"
            title="Başlangıç ve varışı değiştir"
            onClick={() => {
              setOrigin(destination);
              setDestination(origin);
            }}
          >
            ⇅
          </button>
        </div>

        <fieldset className={styles.modes}>
          <legend className={styles.fieldLabel}>Rota modu</legend>
          <div className={styles.chipRow}>
            {ROUTE_MODES.map((option) => (
              <label
                key={option.id}
                className={styles.chip}
                data-selected={mode === option.id || undefined}
                title={option.hint}
              >
                <input
                  type="radio"
                  name="route-mode"
                  value={option.id}
                  checked={mode === option.id}
                  onChange={() => {
                    setMode(option.id);
                    setSelectedRouteId(null);
                  }}
                  className={styles.chipInput}
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>

        {formError && (
          <p className={styles.formError} role="alert">
            {formError}
          </p>
        )}

        <button
          type="submit"
          className={styles.findBtn}
          disabled={phase === "loading"}
        >
          {phase === "loading" ? "Rotalar hesaplanıyor…" : "Rotaları Bul"}
        </button>
      </form>

      <div className={styles.mapPane}>
        <GoogleRouteMap
          routes={routes}
          selectedRouteId={effectiveSelectedRouteId}
          onSelectRoute={setSelectedRouteId}
        />
        {selectedRoute && (
          <aside
            className={styles.mapSuggestion}
            aria-label="Yol üstü önerilen durak"
          >
            <span className={styles.mapSuggestionTop}>
              <span className={styles.mapSuggestionTitle}>
                Yol üstü önerilen durak
              </span>
              <span className={styles.mapSuggestionBadge}>Demo</span>
            </span>
            <p className={styles.mapSuggestionText}>
              {selectedRoute.badge} rota üzerinde açık cephe ve kaldırım
              göstergeleri yüksek bir cadde kesiti — çevresel göstergelere göre
              önerilen mola noktası.
            </p>
          </aside>
        )}
      </div>

      <section className={styles.results} aria-label="Rota seçenekleri">
        {phase === "idle" && (
          <div className={styles.placeholder}>
            <p>
              Çevresel göstergelere göre önerilen rotalar burada listelenir.
              Başlangıç ile varışı girip <strong>Rotaları Bul</strong> ile
              başla.
            </p>
          </div>
        )}

        {phase === "loading" && (
          <>
            <p className={styles.srOnly} role="status">
              Rotalar hesaplanıyor
            </p>
            <div className={styles.skeleton} aria-hidden="true" />
            <div className={styles.skeleton} aria-hidden="true" />
            <div className={styles.skeleton} aria-hidden="true" />
          </>
        )}

        {phase === "ready" && routes.length === 0 && (
          <div className={styles.placeholder}>
            <p>
              Bu deneme için rota verisi bulunamadı. Bağlantıyı kontrol edip
              yeniden dene.
            </p>
          </div>
        )}

        {phase === "ready" && routes.length > 0 && (
          <>
            <h1 className={styles.resultsTitle}>
              {origin.trim()} → {destination.trim()}
            </h1>
            <ul className={styles.cards}>
              {routes.map((route) => {
                const selected = route.id === effectiveSelectedRouteId;
                return (
                  <li key={route.id}>
                    <button
                      type="button"
                      className={styles.card}
                      aria-pressed={selected}
                      onClick={() => setSelectedRouteId(route.id)}
                    >
                      <span className={styles.cardTop}>
                        <span
                          className={
                            route.isRecommended
                              ? styles.badgeRec
                              : styles.badgeAlt
                          }
                        >
                          {route.badge}
                        </span>
                        <span className={styles.duration}>
                          {route.durationMin} dk
                        </span>
                        <span className={styles.distance}>
                          {formatKm(route.distanceKm)} km
                        </span>
                        <span className={styles.extra}>
                          {route.extraMin > 0
                            ? `+${route.extraMin} dk`
                            : "en kısa süre"}
                        </span>
                      </span>

                      {route.recommendationStatus === "analyzed" && (
                        <span className={styles.indGrid}>
                          {INDICATOR_COLUMNS.map((column) => {
                            const value = route.indicators[column.key];
                            return (
                              <span key={column.key} className={styles.ind}>
                                <span className={styles.indLabel}>
                                  {column.label}
                                </span>
                                <span className={styles.indVal}>
                                  {Math.round(value)}
                                </span>
                                <span
                                  className={styles.indBar}
                                  aria-hidden="true"
                                >
                                  <span
                                    className={styles.indFill}
                                    style={{
                                      width: `${Math.round(
                                        Math.min(100, Math.max(0, value)),
                                      )}%`,
                                    }}
                                  />
                                </span>
                              </span>
                            );
                          })}
                        </span>
                      )}

                      <span className={styles.reason}>{route.reason}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {selectedRoute && (
              <p className={styles.selectionNote} role="status">
                Seçili rota: {selectedRoute.badge} —{" "}
                {selectedRoute.durationMin} dk
              </p>
            )}
          </>
        )}
      </section>

      <footer className={styles.notes}>
        <p className={styles.safety}>
          Rota önerileri görüntülerden türetilen fiziksel çevre göstergelerine
          dayanır; gerçek dünya güvenliği garanti edilmez.
        </p>
        <p className={styles.note}>
          Canlı rota, süre ve mesafe Google Routes API&apos;den gelir. Fiziksel
          göstergeler yalnızca eşleşen anonimleştirilmiş sokak analizi kapsamı
          varsa gösterilir; kapsam yoksa skor üretilmez.
        </p>
        <p className={styles.note}>
          Canlı kamera bağlamı:{" "}
          <a href={IBB_CAMERA_URL} target="_blank" rel="noreferrer">
            Resmî İBB trafik kamera hizmeti ↗
          </a>{" "}
          — yetkilendirilmiş entegrasyon sonrası kullanılabilir; görüntü
          indirilmez ve işlenmez.
        </p>
        <p className={styles.note}>
          <Link href="/panel">Belediye operasyon paneli →</Link>
        </p>
      </footer>

      <RouteAssistant
        routes={routes}
        mode={mode}
      />
    </div>
  );
}
