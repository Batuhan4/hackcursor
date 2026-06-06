package usecase

import (
	"context"

	"github.com/Batuhan4/hackcursor/services/api/internal/application/inventory/dto"
	"github.com/Batuhan4/hackcursor/services/api/internal/domain/inventory/repository"
)

// ListDetectionsUseCase lists detections, optionally scoped to one demo run.
type ListDetectionsUseCase struct {
	detections repository.DetectionRepository
}

// NewListDetectionsUseCase wires the use case with its repository port.
func NewListDetectionsUseCase(detections repository.DetectionRepository) *ListDetectionsUseCase {
	return &ListDetectionsUseCase{detections: detections}
}

// Execute returns detections; demoRunID may be empty for all runs.
func (uc *ListDetectionsUseCase) Execute(ctx context.Context, demoRunID string) (dto.ListDetectionsResponse, error) {
	detections, err := uc.detections.ListDetections(ctx, demoRunID)
	if err != nil {
		return dto.ListDetectionsResponse{}, err
	}
	return dto.ListDetectionsResponse{Data: detections, Count: len(detections)}, nil
}
