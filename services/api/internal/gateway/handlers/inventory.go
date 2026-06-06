package handlers

import (
	"net/http"

	"github.com/Batuhan4/hackcursor/services/api/internal/application/inventory/usecase"
	"github.com/Batuhan4/hackcursor/services/api/internal/shared/response"
)

// InventoryHandler serves demo runs and detections to the dashboard.
type InventoryHandler struct {
	listDemoRuns   *usecase.ListDemoRunsUseCase
	listDetections *usecase.ListDetectionsUseCase
}

// NewInventoryHandler wires the inventory handler with its use cases.
func NewInventoryHandler(
	listDemoRuns *usecase.ListDemoRunsUseCase,
	listDetections *usecase.ListDetectionsUseCase,
) *InventoryHandler {
	return &InventoryHandler{
		listDemoRuns:   listDemoRuns,
		listDetections: listDetections,
	}
}

// ListDemoRuns handles GET /api/v1/demo-runs.
func (h *InventoryHandler) ListDemoRuns(w http.ResponseWriter, r *http.Request) {
	resp, err := h.listDemoRuns.Execute(r.Context())
	if err != nil {
		response.Error(w, err)
		return
	}
	response.JSON(w, http.StatusOK, resp)
}

// ListDetections handles GET /api/v1/detections?demo_run_id=<optional>.
func (h *InventoryHandler) ListDetections(w http.ResponseWriter, r *http.Request) {
	demoRunID := r.URL.Query().Get("demo_run_id")

	resp, err := h.listDetections.Execute(r.Context(), demoRunID)
	if err != nil {
		response.Error(w, err)
		return
	}
	response.JSON(w, http.StatusOK, resp)
}
