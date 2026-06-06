// Package usecase implements the inventory application use cases, following
// the masterfabric-go application/<ctx>/usecase pattern.
package usecase

import (
	"context"

	"github.com/Batuhan4/hackcursor/services/api/internal/application/inventory/dto"
	"github.com/Batuhan4/hackcursor/services/api/internal/domain/inventory/repository"
)

// ListDemoRunsUseCase lists demo runs for the dashboard.
type ListDemoRunsUseCase struct {
	runs repository.DemoRunRepository
}

// NewListDemoRunsUseCase wires the use case with its repository port.
func NewListDemoRunsUseCase(runs repository.DemoRunRepository) *ListDemoRunsUseCase {
	return &ListDemoRunsUseCase{runs: runs}
}

// Execute returns all demo runs.
func (uc *ListDemoRunsUseCase) Execute(ctx context.Context) (dto.ListDemoRunsResponse, error) {
	runs, err := uc.runs.ListDemoRuns(ctx)
	if err != nil {
		return dto.ListDemoRunsResponse{}, err
	}
	return dto.ListDemoRunsResponse{Data: runs, Count: len(runs)}, nil
}
