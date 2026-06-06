// Package memory provides a deterministic in-memory implementation of the
// inventory repositories. It backs the scaffold/demo-fallback mode so the API
// always answers with stable data, even with no database attached.
//
// The snapshot below is aligned with data/fixtures/demo-input.json (same demo
// run id and image ids). Once the CV worker writes into Render Postgres, the
// postgres implementation becomes the source of truth and this package stays
// as the offline demo fallback.
package memory

import (
	"context"
	"time"

	"github.com/Batuhan4/hackcursor/services/api/internal/domain/inventory/model"
	"github.com/Batuhan4/hackcursor/services/api/internal/domain/inventory/repository"
)

// InventoryRepository serves the fixture snapshot.
type InventoryRepository struct {
	runs       []model.DemoRun
	detections []model.Detection
}

// Compile-time port checks.
var (
	_ repository.DemoRunRepository   = (*InventoryRepository)(nil)
	_ repository.DetectionRepository = (*InventoryRepository)(nil)
)

const (
	fixtureRunID = "demo-fixture-0001"
	fixtureModel = "shirabendor/YOLOV8-oiv7"
)

// NewInventoryRepository builds the repository with the fixture snapshot.
func NewInventoryRepository() *InventoryRepository {
	started := time.Date(2026, 6, 6, 11, 30, 0, 0, time.UTC)
	completed := started.Add(90 * time.Second)

	return &InventoryRepository{
		runs: []model.DemoRun{
			{
				ID:                    fixtureRunID,
				Name:                  "Güngören fixture run",
				Status:                model.DemoRunCompleted,
				ImageCount:            3,
				DetectionCount:        7,
				AnonymizedRegionCount: 5,
				ModelID:               ptr(fixtureModel),
				StartedAt:             &started,
				CompletedAt:           &completed,
			},
		},
		detections: []model.Detection{
			det("det-0001", "fixture-gungoren-001", "traffic_sign", 0.91, model.BoundingBox{X: 0.12, Y: 0.22, Width: 0.08, Height: 0.14}, 41.0192, 28.8725),
			det("det-0002", "fixture-gungoren-001", "trash_bin", 0.84, model.BoundingBox{X: 0.61, Y: 0.58, Width: 0.10, Height: 0.16}, 41.0192, 28.8725),
			det("det-0003", "fixture-gungoren-001", "pole", 0.78, model.BoundingBox{X: 0.83, Y: 0.15, Width: 0.04, Height: 0.52}, 41.0192, 28.8725),
			det("det-0004", "fixture-gungoren-002", "billboard", 0.88, model.BoundingBox{X: 0.30, Y: 0.10, Width: 0.26, Height: 0.20}, 41.0151, 28.8689),
			det("det-0005", "fixture-gungoren-002", "traffic_light", 0.81, model.BoundingBox{X: 0.71, Y: 0.18, Width: 0.05, Height: 0.12}, 41.0151, 28.8689),
			det("det-0006", "fixture-gungoren-003", "bench", 0.76, model.BoundingBox{X: 0.42, Y: 0.66, Width: 0.14, Height: 0.10}, 41.0235, 28.8841),
			det("det-0007", "fixture-gungoren-003", "pothole", 0.69, model.BoundingBox{X: 0.51, Y: 0.82, Width: 0.12, Height: 0.07}, 41.0235, 28.8841),
		},
	}
}

// ListDemoRuns returns all demo runs, newest first.
func (r *InventoryRepository) ListDemoRuns(ctx context.Context) ([]model.DemoRun, error) {
	out := make([]model.DemoRun, len(r.runs))
	copy(out, r.runs)
	return out, nil
}

// ListDetections returns detections, optionally filtered by demo run id.
func (r *InventoryRepository) ListDetections(ctx context.Context, demoRunID string) ([]model.Detection, error) {
	if demoRunID == "" {
		out := make([]model.Detection, len(r.detections))
		copy(out, r.detections)
		return out, nil
	}
	out := []model.Detection{}
	for _, d := range r.detections {
		if d.DemoRunID == demoRunID {
			out = append(out, d)
		}
	}
	return out, nil
}

func det(id, imageID, class string, conf float64, box model.BoundingBox, lat, lng float64) model.Detection {
	return model.Detection{
		ID:          id,
		DemoRunID:   fixtureRunID,
		ImageID:     imageID,
		ObjectClass: class,
		Confidence:  conf,
		BBox:        box,
		Lat:         ptr(lat),
		Lng:         ptr(lng),
		EvidenceURI: nil,
		ModelID:     ptr(fixtureModel),
	}
}

func ptr[T any](v T) *T {
	return &v
}
