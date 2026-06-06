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
import {
  FIXTURE_DETECTIONS,
  FIXTURE_RUN,
  FIXTURE_STREET_ANALYSES,
} from "@/lib/fixture";

import styles from "./dashboard.module.css";

type ApiState = "checking" | "online" | "offline";
type DataSource = "live" | "fixture";

const HEALTH_POLL_MS = 15_000;

export default function Dashboard() {
  const [apiState, setApiState] = useState<ApiState>("checking");
  const [readiness, setReadiness] = useState<HealthResponse | null>(null);
  const [run, setRun] = useState<DemoRun>(FIXTURE_RUN);
  const [detections, setDetections] = useState<Detection[]>(FIXTURE_DETECTIONS);
  const [analyses, setAnalyses] = useState<StreetAnalysis[]>(
    FIXTURE_STREET_ANALYSES,
  );
  const [source, setSource] = useState<DataSource>("fixture");

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      const ready = await getReadiness();
      if (cancelled) return;

      if (!ready) {
        setApiState("offline");
        setReadiness(null);
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
      if (runs && runs.count > 0) {
        setRun(runs.data[0]);
        setSource("live");
      }
      if (dets) {
        setDetections(dets.data);
      }
      if (streetAnalyses) {
        setAnalyses(streetAnalyses.data);
      }
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
      <DemoStatusPanel run={run} source={source} />
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
  const metrics = [
    ["Physical density", mean(analyses, "built_density_pct")],
    ["Openness", mean(analyses, "openness_score")],
    ["Sidewalk proxy", mean(analyses, "sidewalk_availability_score")],
    ["Greenery", mean(analyses, "greenery_score")],
    ["Comfort potential", mean(analyses, "pedestrian_comfort_potential")],
  ] as const;

  return (
    <section
      className={`${styles.panel} ${styles.panelWide}`}
      aria-label="Street intelligence overview"
    >
      <h2 className={styles.panelTitle}>
        Street Intelligence
        <span className={`${styles.badge} ${styles.badgeOk}`}>
          6 open-license samples
        </span>
      </h2>
      <div className={styles.metricGrid}>
        {metrics.map(([label, value]) => (
          <div className={styles.metric} key={label}>
            <span className={styles.metricLabel}>{label}</span>
            <strong>{value.toFixed(1)}</strong>
            <span className={styles.metricUnit}>/100 proxy</span>
          </div>
        ))}
      </div>
      <p className={styles.methodNote}>
        SegFormer pixel ratios from road, sidewalk, building, wall, sky and
        vegetation. No person counting, crime prediction or guaranteed safety
        claim.
      </p>
    </section>
  );
}

function MunicipalCameraPanel() {
  return (
    <section className={styles.panel} aria-label="Municipal camera context">
      <h2 className={styles.panelTitle}>
        Live Municipal Context
        <span className={`${styles.badge} ${styles.badgeWarn}`}>view only</span>
      </h2>
      <p className={styles.panelText}>
        İBB publishes traffic camera views for public observation. OmniSight
        links to the official viewer but does not download or analyze that
        stream without written authorization.
      </p>
      <a
        className={styles.externalLink}
        href="https://uym.ibb.gov.tr/hizmetler/trafik-olcum-ve-gozlem"
        target="_blank"
        rel="noreferrer"
      >
        Open official İBB camera service ↗
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
      aria-label="Physical street analyses"
    >
      <h2 className={styles.panelTitle}>
        Physical Street Analysis
        <span className={`${styles.badge} ${styles.badgeDim}`}>
          HF / Mapillary fixture
        </span>
      </h2>
      <div className={styles.tableWrap}>
        <table>
          <thead>
            <tr>
              <th>Source</th>
              <th>Built</th>
              <th>Open</th>
              <th>Sidewalk</th>
              <th>Green</th>
              <th>Comfort potential</th>
            </tr>
          </thead>
          <tbody>
            {ordered.map((item) => (
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
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function DemoStatusPanel({
  run,
  source,
}: {
  run: DemoRun;
  source: DataSource;
}) {
  const statusBadge =
    run.status === "completed"
      ? styles.badgeOk
      : run.status === "failed"
        ? styles.badgeErr
        : styles.badgeWarn;

  return (
    <section className={styles.panel} aria-label="Demo status">
      <h2 className={styles.panelTitle}>
        Demo Status
        <span className={`${styles.badge} ${statusBadge}`}>{run.status}</span>
      </h2>
      <div className={styles.statRow}>
        <div className={styles.stat}>
          <div className={styles.statValue}>{run.image_count}</div>
          <div className={styles.statLabel}>images</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue}>{run.detection_count}</div>
          <div className={styles.statLabel}>detections</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue}>{run.anonymized_region_count}</div>
          <div className={styles.statLabel}>regions masked</div>
        </div>
      </div>
      <dl className={styles.kv}>
        <dt>Run</dt>
        <dd>
          {run.name} ({run.id})
        </dd>
        <dt>Model</dt>
        <dd>{run.model_id ?? "—"}</dd>
        <dt>Data source</dt>
        <dd>
          {source === "live" ? "live API" : "fixture fallback (API offline)"}
        </dd>
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

  return (
    <section className={styles.panel} aria-label="API health">
      <h2 className={styles.panelTitle}>
        API Health
        <span className={`${styles.badge} ${badge}`}>
          <span
            className={`${styles.dot} ${apiState === "online" ? styles.dotOk : styles.dotErr}`}
          />
          {apiState}
        </span>
      </h2>
      <dl className={styles.kv}>
        <dt>Base URL</dt>
        <dd>{API_BASE_URL}</dd>
        <dt>Liveness</dt>
        <dd>/health/live</dd>
        <dt>Readiness</dt>
        <dd>{readiness?.status ?? "unreachable"}</dd>
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

function KvkkPanel({ run }: { run: DemoRun }) {
  return (
    <section className={styles.panel} aria-label="KVKK status">
      <h2 className={styles.panelTitle}>
        KVKK Status
        <span className={`${styles.badge} ${styles.badgeOk}`}>
          anonymization-first
        </span>
      </h2>
      <ul className={styles.checklist}>
        <li>
          Faces &amp; license plates irreversibly masked{" "}
          <strong>before</strong> object detection (
          {run.anonymized_region_count} regions in this run)
        </li>
        <li>No face recognition, plate reading or identity detection — out of scope by design</li>
        <li>Only inanimate urban objects are detected and stored</li>
        <li>Raw imagery is never committed, uploaded or displayed</li>
        <li>Raw data is deleted at hackathon end (see docs/kvkk.md)</li>
      </ul>
    </section>
  );
}

function MapListPanel({ points }: { points: Detection[] }) {
  return (
    <section
      className={`${styles.panel} ${styles.panelWide}`}
      aria-label="Map and locations"
    >
      <h2 className={styles.panelTitle}>
        Map / Locations
        <span className={`${styles.badge} ${styles.badgeDim}`}>
          municipal integration pending
        </span>
      </h2>
      <div className={styles.mapBox}>
        <span>Municipal segment map integration pending</span>
        <span>
          Detected points will render here with anonymized evidence popups.
        </span>
      </div>
      <div className={styles.coordList}>
        {points.map((p) => (
          <span key={p.image_id}>
            {p.image_id} → {p.lat?.toFixed(4)}, {p.lng?.toFixed(4)}
          </span>
        ))}
      </div>
    </section>
  );
}

function DetectionsPanel({ detections }: { detections: Detection[] }) {
  return (
    <section
      className={`${styles.panel} ${styles.panelWide}`}
      aria-label="Detections"
    >
      <h2 className={styles.panelTitle}>
        Detections
        <span className={`${styles.badge} ${styles.badgeDim}`}>
          {detections.length} rows
        </span>
      </h2>
      <div className={styles.tableWrap}>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Image</th>
              <th>Class</th>
              <th>Confidence</th>
              <th>Lat / Lng</th>
            </tr>
          </thead>
          <tbody>
            {detections.map((d) => (
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
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
