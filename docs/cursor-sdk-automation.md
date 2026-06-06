# Cursor SDK Demo Readiness Automation

This repository includes a small local Cursor SDK automation for the hackathon
AI-adaptation bonus:

```bash
cd apps/web
npm run cursor:demo-readiness
```

The script asks Cursor SDK for a one-shot Markdown readiness report using only
repo documentation and recorded evidence snippets. It is a presentation helper,
not part of the core YolDost route computation path.

## What it checks

- live Render, Vercel, Expo, Google Routes, and Cursor SDK proof points
- CV/Modal evidence and KVKK anonymization boundaries
- demo-safe Turkish talk track that avoids guaranteed-safety, crime,
  unsupported crowd/person-counting, or demographic claims

## Safety behavior

- Uses `CURSOR_API_KEY` from the environment first, then the root `.env`.
- Never prints the key or any `.env` contents.
- Skips gracefully when `CURSOR_API_KEY` is missing.
- Explicitly runs the SDK local runtime with the repository root as `cwd`.
- Uses one-shot `Agent.prompt(...)`, so SDK resources are disposed by the SDK.
- Does not create cloud agents, branches, commits, pull requests, deployments,
  or PR reviewer requests.
- The prompt instructs the agent not to edit files or run commands.

## Local verification

Run this to validate the command wiring and context collection without calling
the SDK:

```bash
cd apps/web
npm run cursor:demo-readiness -- --dry-run
```

To exercise the missing-key path without changing local files:

```bash
cd apps/web
env -u CURSOR_API_KEY npm run cursor:demo-readiness -- --dry-run --ignore-dotenv
```

Exit codes:

- `0`: report generated, dry-run passed, or SDK call skipped because the key is
  missing.
- `1`: startup/auth/config/network failure before the SDK run executed.
- `2`: SDK run started but returned a non-finished or empty result.

This automation complements `scripts/verify.sh`; it does not replace lint,
typecheck, Go tests, CV determinism checks, or live endpoint smoke tests.
