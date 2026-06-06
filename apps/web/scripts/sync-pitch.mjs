// Sync the jury pitch deck and its evidence assets from the repo into
// public/ so the deployed site serves them at /pitch (rewrite in
// next.config.ts). Runs automatically via the `prebuild` npm hook; safe to
// run manually with `node scripts/sync-pitch.mjs` for local dev.
//
// Source of truth stays in presentation/ and docs/ — never edit the synced
// copies under public/ by hand.
import { cp, mkdir, copyFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(here, "..");
const repoRoot = path.resolve(webRoot, "../..");
const pub = path.join(webRoot, "public");

const jobs = [
  {
    from: path.join(repoRoot, "presentation/pitch-deck.html"),
    to: path.join(pub, "pitch.html"),
  },
  {
    from: path.join(repoRoot, "docs/evidence-screenshots"),
    to: path.join(pub, "evidence"),
    dir: true,
  },
  {
    from: path.join(repoRoot, "presentation/assets"),
    to: path.join(pub, "assets"),
    dir: true,
  },
  {
    from: path.join(repoRoot, "presentation/demo.mp4"),
    to: path.join(pub, "demo.mp4"),
  },
];

for (const job of jobs) {
  const rel = path.relative(repoRoot, job.from);
  if (!existsSync(job.from)) {
    // Never fail the build: committed copies under public/ keep /pitch
    // working even when the repo checkout omits files outside apps/web.
    console.log(`[sync-pitch] skip (absent): ${rel}`);
    continue;
  }
  if (job.dir) {
    await cp(job.from, job.to, { recursive: true });
  } else {
    await mkdir(path.dirname(job.to), { recursive: true });
    await copyFile(job.from, job.to);
  }
  console.log(`[sync-pitch] ${rel} -> ${path.relative(webRoot, job.to)}`);
}
