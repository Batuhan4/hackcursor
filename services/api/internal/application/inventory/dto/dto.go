// Package dto defines the API-facing payloads for the inventory use cases,
// following the masterfabric-go application/<ctx>/dto pattern.
package dto

import "github.com/Batuhan4/hackcursor/services/api/internal/domain/inventory/model"

// ListDemoRunsResponse is the payload for GET /api/v1/demo-runs.
type ListDemoRunsResponse struct {
	Data  []model.DemoRun `json:"data"`
	Count int             `json:"count"`
}

// ListDetectionsResponse is the payload for GET /api/v1/detections.
type ListDetectionsResponse struct {
	Data  []model.Detection `json:"data"`
	Count int               `json:"count"`
}

// ListStreetAnalysesResponse is the payload for GET /api/v1/street-analyses.
type ListStreetAnalysesResponse struct {
	Data  []model.StreetAnalysis `json:"data"`
	Count int                    `json:"count"`
}
