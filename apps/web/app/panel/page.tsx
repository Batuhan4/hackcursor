import type { Metadata } from "next";
import Link from "next/link";

import Dashboard from "@/components/dashboard";

import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "YolDost — Belediye Operasyon Paneli",
  description:
    "Explainable, KVKK-safe physical street analysis for municipal planning",
};

export default function PanelPage() {
  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.title}>YolDost Street Intelligence</h1>
        <span className={styles.tagline}>
          Explainable physical street analysis for municipal planning
        </span>
        <Link href="/">← Rota uygulaması</Link>
      </header>

      <Dashboard />

      <footer className={styles.footer}>
        Operational dashboard — detection data comes only from the Go API
        (services/api). If the API is offline, the final-demo UI marks live
        data as unavailable instead of rendering embedded fixture rows.
      </footer>
    </main>
  );
}
