import type { Metadata } from "next";
import Link from "next/link";

import Dashboard from "@/components/dashboard";

import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "YolDost — Belediye Operasyon Paneli",
  description:
    "Belediye planlaması için açıklanabilir, KVKK uyumlu fiziksel sokak analizi",
};

export default function PanelPage() {
  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.title}>YolDost Sokak Analizi</h1>
        <span className={styles.tagline}>
          Belediye planlaması için açıklanabilir fiziksel sokak analizi
        </span>
        <Link href="/">← Rota uygulaması</Link>
      </header>

      <Dashboard />

      <footer className={styles.footer}>
        Operasyon paneli — tespit verileri yalnızca Go API&apos;den
        (services/api) gelir. API çevrimdışıysa final demo arayüzü gömülü
        örnek satırlar göstermek yerine canlı veriyi kullanılamaz olarak
        işaretler.
      </footer>
    </main>
  );
}
