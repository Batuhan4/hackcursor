// Package errors defines domain error kinds and their HTTP mapping, following
// the masterfabric-go internal/shared/errors pattern.
package errors

import (
	"errors"
	"fmt"
	"net/http"
)

// Sentinel domain errors.
var (
	ErrNotFound       = errors.New("resource not found")
	ErrAlreadyExists  = errors.New("resource already exists")
	ErrValidation     = errors.New("validation error")
	ErrInternal       = errors.New("internal error")
	ErrBadRequest     = errors.New("bad request")
	ErrRateLimited    = errors.New("rate limited")
	ErrNotImplemented = errors.New("not implemented")
)

// DomainError is a structured error with an underlying cause and a message.
type DomainError struct {
	Kind    error  // One of the sentinel errors above.
	Message string // Human-readable message.
	Err     error  // Optional wrapped error for debugging.
}

// Error implements the error interface.
func (e *DomainError) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("%s: %s: %v", e.Kind, e.Message, e.Err)
	}
	return fmt.Sprintf("%s: %s", e.Kind, e.Message)
}

// Unwrap returns the underlying sentinel error for errors.Is.
func (e *DomainError) Unwrap() error {
	return e.Kind
}

// New creates a new DomainError.
func New(kind error, message string, err error) *DomainError {
	return &DomainError{Kind: kind, Message: message, Err: err}
}

// HTTPStatusCode maps a domain error to an HTTP status code.
func HTTPStatusCode(err error) int {
	switch {
	case errors.Is(err, ErrNotFound):
		return http.StatusNotFound
	case errors.Is(err, ErrAlreadyExists):
		return http.StatusConflict
	case errors.Is(err, ErrValidation):
		return http.StatusUnprocessableEntity
	case errors.Is(err, ErrBadRequest):
		return http.StatusBadRequest
	case errors.Is(err, ErrRateLimited):
		return http.StatusTooManyRequests
	case errors.Is(err, ErrNotImplemented):
		return http.StatusNotImplemented
	default:
		return http.StatusInternalServerError
	}
}

// ErrorResponse is the JSON structure returned to API clients.
type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message"`
	Code    int    `json:"code"`
}
