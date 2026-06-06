import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(scriptDirectory, "..");
const repoRoot = resolve(webRoot, "../..");
const rootEnvPath = resolve(repoRoot, ".env");
const maxCharactersPerFile = 6_000;

const contextFiles = [
  "AGENTS.md",
  "docs/ai-usage.md",
  "docs/demo-plan.md",
  "docs/kvkk.md",
  "docs/architecture.md",
  "reports/integrations.md",
  "reports/training-summary.md",
] as const;

type ApiKeyLookup =
  | { status: "present"; source: "environment" | ".env"; value: string }
  | { status: "missing" };

type ContextSection = {
  path: string;
  content: string;
  truncated: boolean;
};

function printHelp(): void {
  console.log(`Usage: npm run cursor:demo-readiness -- [--dry-run]

Generates a one-shot Cursor SDK demo readiness report for YolDost.

Options:
  --dry-run        Validate local inputs and key presence without importing or calling the SDK.
  --ignore-dotenv  Do not read the root .env file; useful for missing-key checks.
  --help           Show this help text.
`);
}

function stripOptionalQuotes(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function lookupCursorApiKey(readDotenv: boolean): ApiKeyLookup {
  const fromEnvironment = process.env.CURSOR_API_KEY?.trim();
  if (fromEnvironment) {
    return {
      status: "present",
      source: "environment",
      value: fromEnvironment,
    };
  }

  if (!readDotenv) {
    return { status: "missing" };
  }

  if (!existsSync(rootEnvPath)) {
    return { status: "missing" };
  }

  const envContents = readFileSync(rootEnvPath, "utf8");
  for (const line of envContents.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?CURSOR_API_KEY\s*=\s*(.*)$/);
    if (!match) {
      continue;
    }

    const value = stripOptionalQuotes(match[1]);
    if (value) {
      return { status: "present", source: ".env", value };
    }
  }

  return { status: "missing" };
}

function readContextFile(path: string): ContextSection | null {
  const absolutePath = resolve(repoRoot, path);
  if (!existsSync(absolutePath)) {
    return null;
  }

  const content = readFileSync(absolutePath, "utf8");
  return {
    path,
    content: content.slice(0, maxCharactersPerFile),
    truncated: content.length > maxCharactersPerFile,
  };
}

function collectContext(): ContextSection[] {
  return contextFiles.flatMap((path) => {
    const section = readContextFile(path);
    return section ? [section] : [];
  });
}

function buildPrompt(context: ContextSection[]): string {
  const contextBlocks = context
    .map((section) => {
      const truncationNote = section.truncated
        ? "\n\n[Truncated to keep the one-shot prompt small.]"
        : "";
      return `## ${section.path}\n\n${section.content}${truncationNote}`;
    })
    .join("\n\n---\n\n");

  return `You are preparing the YolDost hackathon demo readiness report.

Hard constraints:
- Do not edit, create, delete, or rename files.
- Do not run shell commands.
- Do not create a cloud agent, branch, commit, pull request, or deployment.
- Do not request, reveal, summarize, or infer secret values.
- Use only the context pasted below.
- Keep the wording aligned with KVKK constraints: never claim guaranteed safety, crime prediction, person counting, demographics, or pedestrian density.

Return Markdown only with these sections:
1. Overall readiness: Green, Yellow, or Red with one sentence of rationale.
2. Demo proof checklist: 6-10 checkboxes focused on live Render, Vercel, Expo, Google Routes, Cursor SDK, CV/Modal evidence, and KVKK.
3. Gaps to close before judging: concise bullets, highest risk first.
4. Safe talk track: 3 short Turkish presenter lines that avoid forbidden safety claims.

Context:

${contextBlocks}`;
}

function keyPresenceLabel(lookup: ApiKeyLookup): string {
  if (lookup.status === "missing") {
    return "missing";
  }
  return `present via ${lookup.source}`;
}

async function main(): Promise<number> {
  const args = new Set(process.argv.slice(2));
  if (args.has("--help")) {
    printHelp();
    return 0;
  }

  const context = collectContext();
  const keyLookup = lookupCursorApiKey(!args.has("--ignore-dotenv"));

  if (args.has("--dry-run")) {
    console.log("[cursor-demo-readiness] dry run ok");
    console.log(`[cursor-demo-readiness] local runtime cwd: ${repoRoot}`);
    console.log(
      `[cursor-demo-readiness] CURSOR_API_KEY: ${keyPresenceLabel(keyLookup)}`,
    );
    console.log("[cursor-demo-readiness] context files:");
    for (const section of context) {
      console.log(`- ${section.path}${section.truncated ? " (truncated)" : ""}`);
    }
    return 0;
  }

  if (keyLookup.status === "missing") {
    console.log(
      "[cursor-demo-readiness] skipped: CURSOR_API_KEY is not set in the environment or root .env",
    );
    console.log(
      "[cursor-demo-readiness] run `npm run cursor:demo-readiness -- --dry-run` to validate local inputs without a key",
    );
    return 0;
  }

  let CursorAgentErrorConstructor:
    | typeof import("@cursor/sdk").CursorAgentError
    | undefined;

  try {
    const { Agent, CursorAgentError }: typeof import("@cursor/sdk") =
      await import("@cursor/sdk");
    CursorAgentErrorConstructor = CursorAgentError;

    const result = await Agent.prompt(buildPrompt(context), {
      apiKey: keyLookup.value,
      model: { id: process.env.CURSOR_MODEL || "composer-2" },
      name: "YolDost Demo Readiness Report",
      mode: "plan",
      local: {
        cwd: repoRoot,
        settingSources: [],
        sandboxOptions: { enabled: true },
      },
    });

    if (result.status !== "finished" || !result.result?.trim()) {
      console.error(
        `[cursor-demo-readiness] run failed after startup: status=${result.status}`,
      );
      return 2;
    }

    console.log(result.result.trim());
    return 0;
  } catch (error) {
    if (
      CursorAgentErrorConstructor &&
      error instanceof CursorAgentErrorConstructor
    ) {
      console.error(
        `[cursor-demo-readiness] startup failed: ${error.message}; retryable=${error.isRetryable}`,
      );
      return 1;
    }

    console.error(
      `[cursor-demo-readiness] unexpected startup failure: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    return 1;
  }
}

const exitCode = await main();
process.exitCode = exitCode;
