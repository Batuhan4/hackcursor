// Package model defines the urban object inventory domain entities.
//
// Field names (JSON tags) are the contract source of truth together with
// packages/contracts/schemas/*.schema.json — keep them in sync.
//
// KVKK invariants live in the shape of these types:
//   - AnonymizationEvent stores only region counts and the masking method.
//     There are no fields for region contents, crops, embeddings, identities
//     or plate text — on purpose.
//   - ImageSource has no raw-image URI field; only anonymized derivatives.
//   - Detection.ObjectClass must always be an inanimate urban object class.
package model

import "time"

// DemoRunStatus enumerates the lifecycle of a demo run.
type DemoRunStatus string

// Demo run statuses.
const (
	DemoRunPending   DemoRunStatus = "pending"
	DemoRunRunning   DemoRunStatus = "running"
	DemoRunCompleted DemoRunStatus = "completed"
	DemoRunFailed    DemoRunStatus = "failed"
)

// DemoRun is one repeatable demo execution over a fixed set of input images.
type DemoRun struct {
	ID                    string        `json:"id"`
	Name                  string        `json:"name"`
	Status                DemoRunStatus `json:"status"`
	ImageCount            int           `json:"image_count"`
	DetectionCount        int           `json:"detection_count"`
	AnonymizedRegionCount int           `json:"anonymized_region_count"`
	ModelID               *string       `json:"model_id"`
	StartedAt             *time.Time    `json:"started_at"`
	CompletedAt           *time.Time    `json:"completed_at"`
}

// ImageProvider enumerates where an input image came from.
type ImageProvider string

// Image providers.
const (
	ProviderGoogleStreetView ImageProvider = "google_street_view"
	ProviderGoogleMapsStatic ImageProvider = "google_maps_static"
	ProviderFixture          ImageProvider = "fixture"
	ProviderFieldUpload      ImageProvider = "field_upload"
)

// ImageSource is the metadata of one input image. Raw pixels are never stored
// in the system of record; there is intentionally no raw-image URI field.
type ImageSource struct {
	ID            string        `json:"id"`
	DemoRunID     string        `json:"demo_run_id"`
	Provider      ImageProvider `json:"provider"`
	ExternalRef   *string       `json:"external_ref"`
	Lat           *float64      `json:"lat"`
	Lng           *float64      `json:"lng"`
	Heading       *float64      `json:"heading"`
	CapturedAt    *time.Time    `json:"captured_at"`
	Anonymized    bool          `json:"anonymized"`
	AnonymizedURI *string       `json:"anonymized_uri"`
}

// BoundingBox is a normalized [0,1] box relative to image width/height.
type BoundingBox struct {
	X      float64 `json:"x"`
	Y      float64 `json:"y"`
	Width  float64 `json:"width"`
	Height float64 `json:"height"`
}

// Detection is one detected inanimate urban object on an anonymized image.
type Detection struct {
	ID          string      `json:"id"`
	DemoRunID   string      `json:"demo_run_id"`
	ImageID     string      `json:"image_id"`
	ObjectClass string      `json:"object_class"`
	Confidence  float64     `json:"confidence"`
	BBox        BoundingBox `json:"bbox"`
	Lat         *float64    `json:"lat"`
	Lng         *float64    `json:"lng"`
	EvidenceURI *string     `json:"evidence_uri"`
	ModelID     *string     `json:"model_id"`
}

// StreetAnalysis stores physical street indicators derived only from allowed
// inanimate segmentation classes. It contains no person or vehicle metrics.
type StreetAnalysis struct {
	ID                         string   `json:"id"`
	DemoRunID                  string   `json:"demo_run_id"`
	ImageID                    string   `json:"image_id"`
	SourceLabel                string   `json:"source_label"`
	Lat                        *float64 `json:"lat"`
	Lng                        *float64 `json:"lng"`
	BuiltDensityPct            float64  `json:"built_density_pct"`
	OpennessScore              float64  `json:"openness_score"`
	SidewalkAvailabilityScore  float64  `json:"sidewalk_availability_score"`
	GreeneryScore              float64  `json:"greenery_score"`
	RoadSharePct               float64  `json:"road_share_pct"`
	PedestrianComfortPotential float64  `json:"pedestrian_comfort_potential"`
	ModelID                    *string  `json:"model_id"`
}

// AnonymizedRegionType enumerates what kind of region was masked.
type AnonymizedRegionType string

// Region types. Face/plate detectors exist ONLY to find regions to mask.
const (
	RegionFace         AnonymizedRegionType = "face"
	RegionLicensePlate AnonymizedRegionType = "license_plate"
)

// AnonymizationMethod enumerates irreversible masking methods.
type AnonymizationMethod string

// Masking methods.
const (
	MethodGaussianBlur AnonymizationMethod = "gaussian_blur"
	MethodSolidMask    AnonymizationMethod = "solid_mask"
)

// AnonymizationEvent is the audit record proving an image passed the
// irreversible anonymization gate before any product detection ran.
type AnonymizationEvent struct {
	ID           string               `json:"id"`
	DemoRunID    string               `json:"demo_run_id"`
	ImageID      string               `json:"image_id"`
	RegionType   AnonymizedRegionType `json:"region_type"`
	RegionCount  int                  `json:"region_count"`
	Method       AnonymizationMethod  `json:"method"`
	Irreversible bool                 `json:"irreversible"` // always true; reversible masking is not a valid state
	ProcessedAt  *time.Time           `json:"processed_at"`
}
