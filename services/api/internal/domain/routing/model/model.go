// Package model defines consumer walking-route contracts.
package model

import "strings"

// Coordinate identifies a waypoint by WGS84 point or human-readable address.
type Coordinate struct {
	Lat     float64 `json:"lat,omitempty"`
	Lng     float64 `json:"lng,omitempty"`
	Address string  `json:"address,omitempty"`
}

// RoutePreference describes how analyzed physical indicators should be weighted.
type RoutePreference string

const (
	PreferenceBalanced RoutePreference = "balanced"
	PreferenceOpen     RoutePreference = "open"
	PreferenceSidewalk RoutePreference = "sidewalk"
	PreferenceGreen    RoutePreference = "green"
	PreferenceActive   RoutePreference = "active_frontage"
)

// ComputeRoutesRequest asks for live walking alternatives.
type ComputeRoutesRequest struct {
	Origin             Coordinate      `json:"origin"`
	Destination        Coordinate      `json:"destination"`
	Preference         RoutePreference `json:"preference"`
	OriginAddress      string          `json:"origin_address,omitempty"`
	DestinationAddress string          `json:"destination_address,omitempty"`
}

// Normalize maps flat address aliases onto nested origin/destination fields.
func (r *ComputeRoutesRequest) Normalize() {
	if originAddress := strings.TrimSpace(r.OriginAddress); originAddress != "" && !r.Origin.hasPointOrAddress() {
		r.Origin.Address = originAddress
	}
	if destinationAddress := strings.TrimSpace(r.DestinationAddress); destinationAddress != "" && !r.Destination.hasPointOrAddress() {
		r.Destination.Address = destinationAddress
	}
}

func (c Coordinate) hasPointOrAddress() bool {
	if strings.TrimSpace(c.Address) != "" {
		return true
	}
	return c.Lat >= -90 && c.Lat <= 90 &&
		c.Lng >= -180 && c.Lng <= 180 &&
		(c.Lat != 0 || c.Lng != 0)
}

// PhysicalIndicators averages matched street analyses along a route corridor.
type PhysicalIndicators struct {
	Comfort        float64 `json:"comfort"`
	Openness       float64 `json:"openness"`
	Sidewalk       float64 `json:"sidewalk"`
	Greenery       float64 `json:"greenery"`
	BuiltDensity   float64 `json:"built_density"`
	RoadShare      float64 `json:"road_share"`
	ActiveFrontage float64 `json:"active_frontage"`
}

// RouteOption is one Google walking alternative with optional YolDost analysis.
type RouteOption struct {
	ID                   string              `json:"id"`
	DistanceMeters       int                 `json:"distance_meters"`
	DurationSeconds      int                 `json:"duration_seconds"`
	EncodedPolyline      string              `json:"encoded_polyline"`
	GoogleRouteLabels    []string            `json:"google_route_labels"`
	AnalysisCoverage     float64             `json:"analysis_coverage"`
	OmniSightScore       *float64            `json:"omnisight_score"`
	RecommendationStatus string              `json:"recommendation_status"`
	Explanation          *string             `json:"explanation"`
	PhysicalIndicators   *PhysicalIndicators `json:"physical_indicators,omitempty"`
}

// ComputeRoutesResponse returns uncached Google alternatives.
type ComputeRoutesResponse struct {
	Preference      RoutePreference `json:"preference"`
	Routes          []RouteOption   `json:"routes"`
	Attribution     string          `json:"attribution"`
	Disclaimer      string          `json:"disclaimer"`
	GeneratedLive   bool            `json:"generated_live"`
	PersistentCache bool            `json:"persistent_cache"`
}
