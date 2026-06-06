import Dashboard from "@/components/dashboard";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.title}>OmniSight Street Intelligence</h1>
        <span className={styles.tagline}>
          Explainable physical street analysis for municipal planning
        </span>
      </header>

      <Dashboard />

      <footer className={styles.footer}>
        Operational dashboard — detection data comes from the Go API
        (services/api). When the API is offline, the deterministic fixture
        snapshot is shown so the demo flow stays reviewable.
      </footer>
    </main>
  );
}
