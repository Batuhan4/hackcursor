package usecase

import (
	"fmt"
	"math"

	inventoryModel "github.com/Batuhan4/hackcursor/services/api/internal/domain/inventory/model"
	"github.com/Batuhan4/hackcursor/services/api/internal/domain/routing/model"
)

const (
	coverageRadiusMeters = 400.0
	minCoverageFraction  = 0.08
	maxPolylineSamples   = 48
)

type latLng struct {
	lat float64
	lng float64
}

func enrichRoutes(
	routes []model.RouteOption,
	analyses []inventoryModel.StreetAnalysis,
	preference model.RoutePreference,
) []model.RouteOption {
	if len(routes) == 0 || len(analyses) == 0 {
		return routes
	}

	enriched := make([]model.RouteOption, len(routes))
	copy(enriched, routes)
	for index := range enriched {
		enriched[index] = enrichRoute(enriched[index], analyses, preference)
	}
	return enriched
}

func enrichRoute(
	route model.RouteOption,
	analyses []inventoryModel.StreetAnalysis,
	preference model.RoutePreference,
) model.RouteOption {
	points := samplePolyline(decodePolyline(route.EncodedPolyline), maxPolylineSamples)
	if len(points) == 0 {
		return route
	}

	matched := make([]inventoryModel.StreetAnalysis, 0)
	matchedSamples := 0
	for _, point := range points {
		if nearest, ok := nearestAnalysis(point, analyses, coverageRadiusMeters); ok {
			matchedSamples++
			matched = append(matched, nearest)
		}
	}

	coverage := float64(matchedSamples) / float64(len(points))
	route.AnalysisCoverage = roundTo(coverage, 4)
	if coverage < minCoverageFraction || len(matched) == 0 {
		route.OmniSightScore = nil
		route.RecommendationStatus = "insufficient_analysis_coverage"
		route.Explanation = nil
		return route
	}

	score := roundTo(averagePreferenceScore(preference, matched), 2)
	route.OmniSightScore = &score
	route.RecommendationStatus = "analyzed"
	explanation := buildExplanation(preference, coverage, score)
	route.Explanation = &explanation
	return route
}

func nearestAnalysis(
	point latLng,
	analyses []inventoryModel.StreetAnalysis,
	radiusMeters float64,
) (inventoryModel.StreetAnalysis, bool) {
	var (
		best    inventoryModel.StreetAnalysis
		found   bool
		bestDist = math.MaxFloat64
	)

	for _, analysis := range analyses {
		if analysis.Lat == nil || analysis.Lng == nil {
			continue
		}
		distance := haversineMeters(point.lat, point.lng, *analysis.Lat, *analysis.Lng)
		if distance <= radiusMeters && distance < bestDist {
			best = analysis
			bestDist = distance
			found = true
		}
	}
	return best, found
}

func averagePreferenceScore(
	preference model.RoutePreference,
	analyses []inventoryModel.StreetAnalysis,
) float64 {
	if len(analyses) == 0 {
		return 0
	}
	total := 0.0
	for _, analysis := range analyses {
		total += preferenceScore(preference, analysis)
	}
	return total / float64(len(analyses))
}

func preferenceScore(
	preference model.RoutePreference,
	analysis inventoryModel.StreetAnalysis,
) float64 {
	switch preference {
	case model.PreferenceOpen:
		return analysis.OpennessScore
	case model.PreferenceSidewalk:
		return analysis.SidewalkAvailabilityScore
	case model.PreferenceGreen:
		return analysis.GreeneryScore
	case model.PreferenceActive:
		return (analysis.OpennessScore + analysis.PedestrianComfortPotential) / 2
	default:
		return analysis.PedestrianComfortPotential
	}
}

func buildExplanation(
	preference model.RoutePreference,
	coverage float64,
	score float64,
) string {
	switch preference {
	case model.PreferenceOpen:
		return fmt.Sprintf(
			"Güngören fixture analiz kapsamı %.0f%%; aciklik odakli YolDost skoru %.1f/100.",
			coverage*100,
			score,
		)
	case model.PreferenceSidewalk:
		return fmt.Sprintf(
			"Güngören fixture analiz kapsamı %.0f%%; kaldirim odakli YolDost skoru %.1f/100.",
			coverage*100,
			score,
		)
	case model.PreferenceGreen:
		return fmt.Sprintf(
			"Güngören fixture analiz kapsamı %.0f%%; yesillik odakli YolDost skoru %.1f/100.",
			coverage*100,
			score,
		)
	case model.PreferenceActive:
		return fmt.Sprintf(
			"Güngören fixture analiz kapsamı %.0f%%; aktif cephe potansiyeli odakli YolDost skoru %.1f/100.",
			coverage*100,
			score,
		)
	default:
		return fmt.Sprintf(
			"Güngören fixture analiz kapsamı %.0f%%; dengeli YolDost skoru %.1f/100.",
			coverage*100,
			score,
		)
	}
}

func samplePolyline(points []latLng, maxSamples int) []latLng {
	if len(points) == 0 {
		return nil
	}
	if len(points) <= maxSamples {
		return points
	}

	step := float64(len(points)-1) / float64(maxSamples-1)
	sampled := make([]latLng, 0, maxSamples)
	for index := 0; index < maxSamples; index++ {
		position := int(math.Round(float64(index) * step))
		if position >= len(points) {
			position = len(points) - 1
		}
		sampled = append(sampled, points[position])
	}
	return sampled
}

func decodePolyline(encoded string) []latLng {
	if encoded == "" {
		return nil
	}

	points := make([]latLng, 0)
	index := 0
	lat := 0
	lng := 0

	for index < len(encoded) {
		shift := 0
		result := 0
		var byte int
		for {
			if index >= len(encoded) {
				return points
			}
			byte = int(encoded[index]) - 63
			index++
			result |= (byte & 0x1f) << shift
			shift += 5
			if byte < 0x20 {
				break
			}
		}
		deltaLat := result >> 1
		if result&1 != 0 {
			deltaLat = ^deltaLat
		}
		lat += deltaLat

		shift = 0
		result = 0
		for {
			if index >= len(encoded) {
				return points
			}
			byte = int(encoded[index]) - 63
			index++
			result |= (byte & 0x1f) << shift
			shift += 5
			if byte < 0x20 {
				break
			}
		}
		deltaLng := result >> 1
		if result&1 != 0 {
			deltaLng = ^deltaLng
		}
		lng += deltaLng

		points = append(points, latLng{
			lat: float64(lat) / 1e5,
			lng: float64(lng) / 1e5,
		})
	}

	return points
}

func haversineMeters(lat1, lng1, lat2, lng2 float64) float64 {
	const earthRadius = 6371000.0
	dLat := (lat2 - lat1) * math.Pi / 180
	dLng := (lng2 - lng1) * math.Pi / 180
	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(lat1*math.Pi/180)*math.Cos(lat2*math.Pi/180)*
			math.Sin(dLng/2)*math.Sin(dLng/2)
	return 2 * earthRadius * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
}

func roundTo(value float64, places int) float64 {
	factor := math.Pow(10, float64(places))
	return math.Round(value*factor) / factor
}
