package usecase

import (
	"context"

	"github.com/Batuhan4/hackcursor/services/api/internal/application/inventory/dto"
	"github.com/Batuhan4/hackcursor/services/api/internal/domain/inventory/repository"
)

// ListStreetAnalysesUseCase lists physical street analyses.
type ListStreetAnalysesUseCase struct {
	analyses repository.StreetAnalysisRepository
}

func NewListStreetAnalysesUseCase(analyses repository.StreetAnalysisRepository) *ListStreetAnalysesUseCase {
	return &ListStreetAnalysesUseCase{analyses: analyses}
}

func (uc *ListStreetAnalysesUseCase) Execute(ctx context.Context, demoRunID string) (dto.ListStreetAnalysesResponse, error) {
	analyses, err := uc.analyses.ListStreetAnalyses(ctx, demoRunID)
	if err != nil {
		return dto.ListStreetAnalysesResponse{}, err
	}
	return dto.ListStreetAnalysesResponse{Data: analyses, Count: len(analyses)}, nil
}
