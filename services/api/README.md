# Urban Object Inventory API (Go)

Go backend for the Cursor x ALT+TAB hackathon, following the
[masterfabric-go](https://github.com/gurkanfikretgunak/masterfabric-go)
architecture (see `docs/architecture.md` for the layer mapping).

## Layout

```
cmd/server/                      entrypoint: config → deps → router → serve
internal/domain/inventory/       entities (model) + persistence ports (repository)
internal/application/inventory/  use cases + DTOs
internal/gateway/                chi router + HTTP handlers
internal/infrastructure/memory/  deterministic fixture repository (demo fallback)
internal/infrastructure/postgres/ Render Postgres adapter (skeleton, see TODO)
internal/shared/                 config, logger, response, errors, middleware
migrations/                      Postgres schema (0001_init.sql)
```

## Run

```bash
make run        # go run ./cmd/server  (listens on PORT, default 8080)
make check      # go vet ./... && go test ./...
make build      # binary at bin/server
```

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health/live` | Liveness (Render health check) |
| GET | `/health/ready` | Readiness + dependency report |
| GET | `/api/v1/demo-runs` | List demo runs |
| GET | `/api/v1/detections?demo_run_id=` | List detections (optional filter) |

## Environment

| Name | Purpose |
| --- | --- |
| `PORT` | Listen port (Render injects this) |
| `DATABASE_URL` | Render Postgres DSN |
| `GOOGLE_MAPS_API_KEY` / `GOOGLE_STREET_VIEW_API_KEY` | Imagery source (first one wins) |
| `HF_TOKEN` / `HUGGINGFACE_API_KEY` | Hugging Face access (first one wins) |
| `CORS_ALLOWED_ORIGINS` | Comma-separated; defaults to `http://localhost:3000` |

Secret values are never logged — startup logs report presence booleans only.

## Render deploy

- Build command: `go build -o bin/server ./cmd/server` (root: `services/api`)
- Start command: `./bin/server`
- Health check path: `/health/live`
