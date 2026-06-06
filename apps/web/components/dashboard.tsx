"use client";

import { useEffect, useState } from "react";

import {
  API_BASE_URL,
  getDemoRuns,
  getDetections,
  getReadiness,
  getStreetAnalyses,
} from "@/lib/api";
import type {
  DemoRun,
  Detection,
  HealthResponse,
  StreetAnalysis,
} from "@/lib/contracts";

import styles from "./dashboard.module.css";

type ApiState = "checking" | "online" | "offline";

const HEALTH_POLL_MS = 15_000;

export default function Dashboard() {
  const [apiState, setApiState] = useState<ApiState>("checking");
  const [readiness, setReadiness] = useState<HealthResponse | null>(null);
  const [run, setRun] = useState<DemoRun | null>(null);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [analyses, setAnalyses] = useState<StreetAnalysis[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      const ready = await getReadiness();
      if (cancelled) return;

      if (!ready) {
        setApiState("offline");
        setReadiness(null);
        setRun(null);
        setDetections([]);
        setAnalyses([]);
        return;
      }
      setApiState("online");
      setReadiness(ready);

      const [runs, dets, streetAnalyses] = await Promise.all([
        getDemoRuns(),
        getDetections(),
        getStreetAnalyses(),
      ]);
      if (cancelled) return;
      setRun(runs && runs.count > 0 ? runs.data[0] : null);
      setDetections(dets?.data ?? []);
      setAnalyses(streetAnalyses?.data ?? []);
    }

    refresh();
    const timer = setInterval(refresh, HEALTH_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const uniquePoints = Array.from(
    new Map(
      detections
        .filter((d) => d.lat !== null && d.lng !== null)
        .map((d) => [d.image_id, d]),
    ).values(),
  );

  return (
    <div className={styles.grid}>
      <DemoStatusPanel
        run={run}
        apiState={apiState}
        repositoryStatus={readiness?.services?.repository ?? null}
      />
      <ApiHealthPanel apiState={apiState} readiness={readiness} />
      <KvkkPanel run={run} />
      <StreetOverviewPanel analyses={analyses} />
      <MunicipalCameraPanel />
      <MapListPanel points={uniquePoints} />
      <StreetAnalysisPanel analyses={analyses} />
      <DetectionsPanel detections={detections} />
    </div>
  );
}

function mean(analyses: StreetAnalysis[], key: keyof StreetAnalysis) {
  if (analyses.length === 0) return 0;
  return (
    analyses.reduce((sum, item) => sum + Number(item[key]), 0) / analyses.length
  );
}

function StreetOverviewPanel({ analyses }: { analyses: StreetAnalysis[] }) {
  const hasAnalyses = analyses.length > 0;
  const metrics = [
    ["Fiziksel yoğunluk", mean(analyses, "built_density_pct")],
    ["Açıklık", mean(analyses, "openness_score")],
    ["Kaldırım göstergesi", mean(analyses, "sidewalk_availability_score")],
    ["Yeşillik", mean(analyses, "greenery_score")],
    ["Konfor potansiyeli", mean(analyses, "pedestrian_comfort_potential")],
  ] as const;

  return (
    <section
      className={`${styles.panel} ${styles.panelWide}`}
      aria-label="Sokak analizi genel görünümü"
    >
      <h2 className={styles.panelTitle}>
        Sokak Analizi
        <span
          className={`${styles.badge} ${
            hasAnalyses ? styles.badgeOk : styles.badgeWarn
          }`}
        >
          {hasAnalyses
            ? `${analyses.length} canlı satır`
            : "canlı API gerekli"}
        </span>
      </h2>
      {hasAnalyses ? (
        <div className={styles.metricGrid}>
          {metrics.map(([label, value]) => (
            <div className={styles.metric} key={label}>
              <span className={styles.metricLabel}>{label}</span>
              <strong>{value.toFixed(1)}</strong>
              <span className={styles.metricUnit}>/100 gösterge</span>
            </div>
          ))}
        </div>
      ) : (
        <p className={styles.panelText}>
          Canlı sokak analizi satırı dönmedi. API kullanılamadığında final
          demo gömülü örnek metrik göstermez.
        </p>
      )}
      <p className={styles.methodNote}>
        Yol, kaldırım, bina, duvar, gökyüzü ve yeşillik için SegFormer piksel
        oranları. Kişi sayımı, suç tahmini veya güvenlik garantisi iddiası
        yoktur.
      </p>
    </section>
  );
}

function MunicipalCameraPanel() {
  return (
    <section className={styles.panel} aria-label="Belediye kamera bağlamı">
      <h2 className={styles.panelTitle}>
        Canlı Belediye Bağlamı
        <span className={`${styles.badge} ${styles.badgeWarn}`}>
          yalnızca görüntüleme
        </span>
      </h2>
      <p className={styles.panelText}>
        İBB, trafik kamera görüntülerini kamusal gözlem için yayınlar. YolDost
        resmî görüntüleyiciye bağlantı verir; yazılı yetki olmadan bu akışı
        indirmez veya analiz etmez.
      </p>
      <a
        className={styles.externalLink}
        href="https://uym.ibb.gov.tr/hizmetler/trafik-olcum-ve-gozlem"
        target="_blank"
        rel="noreferrer"
      >
        Resmî İBB kamera hizmetini aç ↗
      </a>
    </section>
  );
}

function StreetAnalysisPanel({ analyses }: { analyses: StreetAnalysis[] }) {
  const ordered = [...analyses].sort(
    (a, b) =>
      b.pedestrian_comfort_potential - a.pedestrian_comfort_potential,
  );
  return (
    <section
      className={`${styles.panel} ${styles.panelWide}`}
      aria-label="Fiziksel sokak analizleri"
    >
      <h2 className={styles.panelTitle}>
        Fiziksel Sokak Analizi
        <span className={`${styles.badge} ${styles.badgeDim}`}>
          {analyses.length} satır
        </span>
      </h2>
      <div className={styles.tableWrap}>
        <table>
          <thead>
            <tr>
              <th>Kaynak</th>
              <th>Yapı</th>
              <th>Açıklık</th>
              <th>Kaldırım</th>
              <th>Yeşillik</th>
              <th>Konfor potansiyeli</th>
            </tr>
          </thead>
          <tbody>
            {ordered.length > 0 ? (
              ordered.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.source_label}</strong>
                    <span className={styles.sourceDetail}>{item.image_id}</span>
                  </td>
                  <td>{item.built_density_pct.toFixed(1)}%</td>
                  <td>{item.openness_score.toFixed(1)}</td>
                  <td>{item.sidewalk_availability_score.toFixed(1)}</td>
                  <td>{item.greenery_score.toFixed(1)}</td>
                  <td>
                    <span className={styles.scoreValue}>
                      {item.pedestrian_comfort_potential.toFixed(1)}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6}>
                  Canlı API sokak analizi satırı döndürmedi; gömülü yedek
                  veri gösterilmez.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function DemoStatusPanel({
  run,
  apiState,
  repositoryStatus,
}: {
  run: DemoRun | null;
  apiState: ApiState;
  repositoryStatus: string | null;
}) {
  const status =
    run?.status ?? (apiState === "checking" ? "checking" : "unavailable");
  const statusLabel =
    status === "completed"
      ? "tamamlandı"
      : status === "failed"
        ? "başarısız"
        : status === "unavailable"
          ? "kullanılamıyor"
          : status === "checking"
            ? "kontrol ediliyor"
            : status;
  const statusBadge =
    status === "completed"
      ? styles.badgeOk
      : status === "failed" || status === "unavailable"
        ? styles.badgeErr
        : styles.badgeWarn;

  return (
    <section className={styles.panel} aria-label="Demo durumu">
      <h2 className={styles.panelTitle}>
        Demo Durumu
        <span className={`${styles.badge} ${statusBadge}`}>{statusLabel}</span>
      </h2>
      <div className={styles.statRow}>
        <div className={styles.stat}>
          <div className={styles.statValue}>{run?.image_count ?? "—"}</div>
          <div className={styles.statLabel}>görüntü</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue}>{run?.detection_count ?? "—"}</div>
          <div className={styles.statLabel}>tespit</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue}>
            {run?.anonymized_region_count ?? "—"}
          </div>
          <div className={styles.statLabel}>maskelenen bölge</div>
        </div>
      </div>
      <dl className={styles.kv}>
        <dt>Çalıştırma</dt>
        <dd>
          {run ? `${run.name} (${run.id})` : "Canlı demo çalıştırması dönmedi"}
        </dd>
        <dt>Model</dt>
        <dd>{run?.model_id ?? "—"}</dd>
        <dt>API verisi</dt>
        <dd>
          {apiState === "online" ? "canlı API yanıtı" : "kullanılamıyor"}
        </dd>
        <dt>Depo</dt>
        <dd>{repositoryStatus ?? "kullanılamıyor"}</dd>
      </dl>
    </section>
  );
}

function ApiHealthPanel({
  apiState,
  readiness,
}: {
  apiState: ApiState;
  readiness: HealthResponse | null;
}) {
  const badge =
    apiState === "online"
      ? styles.badgeOk
      : apiState === "checking"
        ? styles.badgeDim
        : styles.badgeErr;

  const apiStateLabel =
    apiState === "online"
      ? "çevrimiçi"
      : apiState === "checking"
        ? "kontrol ediliyor"
        : "çevrimdışı";

  return (
    <section className={styles.panel} aria-label="API sağlığı">
      <h2 className={styles.panelTitle}>
        API Sağlığı
        <span className={`${styles.badge} ${badge}`}>
          <span
            className={`${styles.dot} ${apiState === "online" ? styles.dotOk : styles.dotErr}`}
          />
          {apiStateLabel}
        </span>
      </h2>
      <dl className={styles.kv}>
        <dt>Temel URL</dt>
        <dd>{API_BASE_URL || "yapılandırılmadı"}</dd>
        <dt>Canlılık</dt>
        <dd>/health/live</dd>
        <dt>Hazırlık</dt>
        <dd>{readiness?.status ?? "erişilemiyor"}</dd>
        {readiness?.services &&
          Object.entries(readiness.services).map(([name, status]) => (
            <ServiceRow key={name} name={name} status={status} />
          ))}
      </dl>
    </section>
  );
}

function ServiceRow({ name, status }: { name: string; status: string }) {
  return (
    <>
      <dt>· {name}</dt>
      <dd>{status}</dd>
    </>
  );
}

function KvkkPanel({ run }: { run: DemoRun | null }) {
  return (
    <section className={styles.panel} aria-label="KVKK durumu">
      <h2 className={styles.panelTitle}>
        KVKK Durumu
        <span className={`${styles.badge} ${styles.badgeOk}`}>
          önce anonimleştirme
        </span>
      </h2>
      <ul className={styles.checklist}>
        <li>
          Yüzler ve plakalar obje tespitinden <strong>önce</strong> geri
          döndürülemez şekilde maskelenir (bu çalıştırmada{" "}
          {run?.anonymized_region_count ?? 0} bölge)
        </li>
        <li>
          Yüz tanıma, plaka okuma veya kimlik tespiti yok — tasarım gereği
          kapsam dışı
        </li>
        <li>Yalnızca cansız kentsel objeler tespit edilir ve saklanır</li>
        <li>Ham görüntüler asla commit edilmez, yüklenmez veya gösterilmez</li>
        <li>Ham veri hackathon sonunda silinir (bkz. docs/kvkk.md)</li>
      </ul>
    </section>
  );
}

function MapListPanel({ points }: { points: Detection[] }) {
  return (
    <section
      className={`${styles.panel} ${styles.panelWide}`}
      aria-label="Harita ve konumlar"
    >
      <h2 className={styles.panelTitle}>
        Harita / Konumlar
        <span className={`${styles.badge} ${styles.badgeDim}`}>
          belediye entegrasyonu beklemede
        </span>
      </h2>
      <div className={styles.mapBox}>
        <span>Belediye segment haritası entegrasyonu beklemede</span>
        <span>
          Tespit edilen noktalar burada anonimleştirilmiş kanıt
          baloncuklarıyla gösterilecek.
        </span>
      </div>
      <div className={styles.coordList}>
        {points.length > 0 ? (
          points.map((p) => (
            <span key={p.image_id}>
              {p.image_id} → {p.lat?.toFixed(4)}, {p.lng?.toFixed(4)}
            </span>
          ))
        ) : (
          <span>Canlı konum satırı dönmedi.</span>
        )}
      </div>
    </section>
  );
}

function DetectionsPanel({ detections }: { detections: Detection[] }) {
  return (
    <section
      className={`${styles.panel} ${styles.panelWide}`}
      aria-label="Tespitler"
    >
      <h2 className={styles.panelTitle}>
        Tespitler
        <span className={`${styles.badge} ${styles.badgeDim}`}>
          {detections.length} satır
        </span>
      </h2>
      <div className={styles.tableWrap}>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Görüntü</th>
              <th>Sınıf</th>
              <th>Güven</th>
              <th>Enlem / Boylam</th>
            </tr>
          </thead>
          <tbody>
            {detections.length > 0 ? (
              detections.map((d) => (
                <tr key={d.id}>
                  <td className={styles.mono}>{d.id}</td>
                  <td className={styles.mono}>{d.image_id}</td>
                  <td>{d.object_class}</td>
                  <td>
                    <span className={styles.confTrack}>
                      <span
                        className={styles.confFill}
                        style={{ width: `${Math.round(d.confidence * 100)}%` }}
                      />
                    </span>
                    {(d.confidence * 100).toFixed(0)}%
                  </td>
                  <td className={styles.mono}>
                    {d.lat?.toFixed(4)}, {d.lng?.toFixed(4)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5}>
                  Canlı API tespit döndürmedi; gömülü yedek veri gösterilmez.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
