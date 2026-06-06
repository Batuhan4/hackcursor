package usecase

import (
	"testing"

	inventoryModel "github.com/Batuhan4/hackcursor/services/api/internal/domain/inventory/model"
	"github.com/Batuhan4/hackcursor/services/api/internal/domain/routing/model"
)

func TestEnrichRouteAppliesFixtureCoverageForGungorenPolyline(t *testing.T) {
	analyses := []inventoryModel.StreetAnalysis{
		{
			SourceLabel:                "Güngören Gençosman",
			Lat:                        ptr(41.0151),
			Lng:                        ptr(28.8689),
			OpennessScore:              58.0,
			SidewalkAvailabilityScore:  22.0,
			GreeneryScore:              55.0,
			PedestrianComfortPotential: 49.0,
		},
		{
			SourceLabel:                "Güngören Merkez",
			Lat:                        ptr(41.0192),
			Lng:                        ptr(28.8725),
			OpennessScore:              62.0,
			SidewalkAvailabilityScore:  18.0,
			GreeneryScore:              60.0,
			PedestrianComfortPotential: 48.5,
		},
	}

	route := model.RouteOption{
		ID:              "google-walk-1",
		EncodedPolyline: "oxjyF_ofoD@zA@FbDiDhE_E",
	}

	enriched := enrichRoute(route, analyses, model.PreferenceBalanced)
	if enriched.AnalysisCoverage <= 0 {
		t.Fatalf("coverage = %f, want > 0", enriched.AnalysisCoverage)
	}
	if enriched.OmniSightScore == nil {
		t.Fatal("score must be set when fixture coverage exists")
	}
	if enriched.RecommendationStatus != "analyzed" {
		t.Fatalf("status = %q, want analyzed", enriched.RecommendationStatus)
	}
}

func TestEnrichRouteLeavesDistantRouteUnscored(t *testing.T) {
	analyses := []inventoryModel.StreetAnalysis{
		{
			SourceLabel: "Güngören Merkez",
			Lat:         ptr(41.0192),
			Lng:         ptr(28.8725),
		},
	}

	route := model.RouteOption{
		ID:              "google-walk-1",
		EncodedPolyline: "u{~vFvyysM",
	}

	enriched := enrichRoute(route, analyses, model.PreferenceBalanced)
	if enriched.AnalysisCoverage != 0 {
		t.Fatalf("coverage = %f, want 0", enriched.AnalysisCoverage)
	}
	if enriched.OmniSightScore != nil {
		t.Fatal("score must remain null without nearby analyses")
	}
}

func ptr[T any](value T) *T {
	return &value
}
