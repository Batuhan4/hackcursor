// Package postgres will hold the Render Postgres implementations of the
// inventory repositories, connected through DATABASE_URL (see
// internal/shared/config).
//
// Scaffold stage: methods return ErrNotImplemented so the wiring compiles and
// the deterministic fixture repository (internal/infrastructure/memory)
// serves development/test data. Schema lives in services/api/migrations/0001_init.sql.
//
// TODO(postgres): implement with a pgx/v5 pool following the masterfabric-go
// internal/shared/database/postgres.go pattern, then switch the repository
// selection in cmd/server/main.go when DATABASE_URL is reachable.
package postgres

import (
	"context"

	"github.com/Batuhan4/hackcursor/services/api/internal/domain/inventory/model"
	"github.com/Batuhan4/hackcursor/services/api/internal/domain/inventory/repository"
	"github.com/Batuhan4/hackcursor/services/api/internal/shared/errors"
)

// InventoryRepository is the Render Postgres adapter (pending implementation).
type InventoryRepository struct {
	// db *pgxpool.Pool — added together with the pgx dependency.
}

// Compile-time port checks: the skeleton must keep satisfying the domain
// ports so the main wiring can switch implementations without changes.
var (
	_ repository.DemoRunRepository        = (*InventoryRepository)(nil)
	_ repository.DetectionRepository      = (*InventoryRepository)(nil)
	_ repository.StreetAnalysisRepository = (*InventoryRepository)(nil)
)

// NewInventoryRepository creates the postgres adapter skeleton.
func NewInventoryRepository() *InventoryRepository {
	return &InventoryRepository{}
}

// ListDemoRuns will read from the demo_runs table.
func (r *InventoryRepository) ListDemoRuns(ctx context.Context) ([]model.DemoRun, error) {
	return nil, errors.New(errors.ErrNotImplemented, "postgres demo_runs repository not wired yet", nil)
}

// ListDetections will read from the detections table.
func (r *InventoryRepository) ListDetections(ctx context.Context, demoRunID string) ([]model.Detection, error) {
	return nil, errors.New(errors.ErrNotImplemented, "postgres detections repository not wired yet", nil)
}

func (r *InventoryRepository) ListStreetAnalyses(ctx context.Context, demoRunID string) ([]model.StreetAnalysis, error) {
	return nil, errors.New(errors.ErrNotImplemented, "postgres street_analyses repository not wired yet", nil)
}
