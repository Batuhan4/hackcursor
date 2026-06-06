// Package response provides JSON response helpers, following the
// masterfabric-go internal/shared/response pattern.
package response

import (
	"encoding/json"
	"net/http"

	domainErr "github.com/Batuhan4/hackcursor/services/api/internal/shared/errors"
)

// JSON writes a JSON response with the given status code and payload.
func JSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if payload != nil {
		_ = json.NewEncoder(w).Encode(payload)
	}
}

// Error writes a JSON error response, mapping domain errors to HTTP codes.
func Error(w http.ResponseWriter, err error) {
	code := domainErr.HTTPStatusCode(err)
	JSON(w, code, domainErr.ErrorResponse{
		Error:   http.StatusText(code),
		Message: err.Error(),
		Code:    code,
	})
}
