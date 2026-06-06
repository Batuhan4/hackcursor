// Package repository defines the persistence ports for the inventory domain,
// following the masterfabric-go domain/<ctx>/repository pattern. Concrete
// implementations live under internal/infrastructure.
package repository

import (
	"context"

	"github.com/Batuhan4/hackcursor/services/api/internal/domain/inventory/model"
)

// DemoRunRepository provides access to demo runs.
type DemoRunRepository interface {
	// ListDemoRuns returns all demo runs, newest first.
	ListDemoRuns(ctx context.Context) ([]model.DemoRun, error)
}

// DetectionRepository provides access to detections.
type DetectionRepository interface {
	// ListDetections returns detections, optionally filtered by demo run id
	// (empty string = all runs).
	ListDetections(ctx context.Context, demoRunID string) ([]model.Detection, error)
}
