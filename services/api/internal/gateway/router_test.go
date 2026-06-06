package gateway_test

import (
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/Batuhan4/hackcursor/services/api/internal/application/inventory/usecase"
	"github.com/Batuhan4/hackcursor/services/api/internal/gateway"
	"github.com/Batuhan4/hackcursor/services/api/internal/gateway/handlers"
	"github.com/Batuhan4/hackcursor/services/api/internal/infrastructure/memory"
	"github.com/Batuhan4/hackcursor/services/api/internal/shared/config"
	"github.com/Batuhan4/hackcursor/services/api/internal/shared/logger"
)

// newTestRouter wires the full router exactly like cmd/server does, with the
// deterministic fixture repository.
func newTestRouter(t *testing.T) http.Handler {
	t.Helper()

	cfg := config.Load()
	log := logger.New("error", "text")
	repo := memory.NewInventoryRepository()

	return gateway.NewRouter(gateway.Dependencies{
		Logger:        log,
		Config:        cfg,
		HealthHandler: handlers.NewHealthHandler(false),
		InventoryHandler: handlers.NewInventoryHandler(
			usecase.NewListDemoRunsUseCase(repo),
			usecase.NewListDetectionsUseCase(repo),
		),
	})
}

func get(t *testing.T, router http.Handler, path string) (*httptest.ResponseRecorder, []byte) {
	t.Helper()

	req := httptest.NewRequest(http.MethodGet, path, nil)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	body, err := io.ReadAll(rec.Body)
	if err != nil {
		t.Fatalf("reading body: %v", err)
	}
	return rec, body
}

func TestHealthLive(t *testing.T) {
	router := newTestRouter(t)

	rec, body := get(t, router, "/health/live")
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}

	var payload map[string]string
	if err := json.Unmarshal(body, &payload); err != nil {
		t.Fatalf("invalid JSON: %v", err)
	}
	if payload["status"] != "alive" {
		t.Errorf("status = %q, want alive", payload["status"])
	}
}

func TestHealthReady(t *testing.T) {
	router := newTestRouter(t)

	rec, body := get(t, router, "/health/ready")
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}

	var payload handlers.HealthResponse
	if err := json.Unmarshal(body, &payload); err != nil {
		t.Fatalf("invalid JSON: %v", err)
	}
	if payload.Status != "ready" {
		t.Errorf("status = %q, want ready", payload.Status)
	}
	if payload.Services["database"] != "not_configured" {
		t.Errorf("database service = %q, want not_configured", payload.Services["database"])
	}
}

func TestListDemoRuns(t *testing.T) {
	router := newTestRouter(t)

	rec, body := get(t, router, "/api/v1/demo-runs")
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}

	var payload struct {
		Data []struct {
			ID                    string `json:"id"`
			Status                string `json:"status"`
			AnonymizedRegionCount int    `json:"anonymized_region_count"`
		} `json:"data"`
		Count int `json:"count"`
	}
	if err := json.Unmarshal(body, &payload); err != nil {
		t.Fatalf("invalid JSON: %v", err)
	}
	if payload.Count == 0 || len(payload.Data) == 0 {
		t.Fatal("expected at least one demo run in fixture data")
	}
	if payload.Data[0].ID != "demo-fixture-0001" {
		t.Errorf("run id = %q, want demo-fixture-0001", payload.Data[0].ID)
	}
}

func TestListDetections(t *testing.T) {
	router := newTestRouter(t)

	rec, body := get(t, router, "/api/v1/detections")
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}

	var payload struct {
		Data []struct {
			ObjectClass string  `json:"object_class"`
			Confidence  float64 `json:"confidence"`
		} `json:"data"`
		Count int `json:"count"`
	}
	if err := json.Unmarshal(body, &payload); err != nil {
		t.Fatalf("invalid JSON: %v", err)
	}
	if payload.Count != 7 {
		t.Errorf("count = %d, want 7 fixture detections", payload.Count)
	}

	// KVKK guard: the API must never serve person/face/plate classes.
	for _, d := range payload.Data {
		switch d.ObjectClass {
		case "person", "face", "license_plate", "plate":
			t.Errorf("forbidden object class served: %q", d.ObjectClass)
		}
		if d.Confidence < 0 || d.Confidence > 1 {
			t.Errorf("confidence out of range: %f", d.Confidence)
		}
	}
}

func TestListDetectionsFilteredByRun(t *testing.T) {
	router := newTestRouter(t)

	rec, body := get(t, router, "/api/v1/detections?demo_run_id=demo-fixture-0001")
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}
	var payload struct {
		Count int `json:"count"`
	}
	if err := json.Unmarshal(body, &payload); err != nil {
		t.Fatalf("invalid JSON: %v", err)
	}
	if payload.Count != 7 {
		t.Errorf("count = %d, want 7 for fixture run", payload.Count)
	}

	rec, body = get(t, router, "/api/v1/detections?demo_run_id=no-such-run")
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}
	if err := json.Unmarshal(body, &payload); err != nil {
		t.Fatalf("invalid JSON: %v", err)
	}
	if payload.Count != 0 {
		t.Errorf("count = %d, want 0 for unknown run", payload.Count)
	}
}

func TestUnknownRouteReturnsJSON404(t *testing.T) {
	router := newTestRouter(t)

	rec, body := get(t, router, "/api/v1/nope")
	if rec.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want 404", rec.Code)
	}
	var payload map[string]any
	if err := json.Unmarshal(body, &payload); err != nil {
		t.Fatalf("404 body must be JSON: %v", err)
	}
}

func TestRequestIDHeaderSet(t *testing.T) {
	router := newTestRouter(t)

	rec, _ := get(t, router, "/health/live")
	if rec.Header().Get("X-Request-ID") == "" {
		t.Error("X-Request-ID header missing")
	}
}
