// Package logger provides the structured slog logger, following the
// masterfabric-go internal/shared/logger pattern.
package logger

import (
	"context"
	"log/slog"
	"os"
	"strings"
)

type ctxKey string

const keyRequestID ctxKey = "request_id"

// New creates a new structured logger.
func New(level, format string) *slog.Logger {
	var lvl slog.Level
	switch strings.ToLower(level) {
	case "debug":
		lvl = slog.LevelDebug
	case "warn":
		lvl = slog.LevelWarn
	case "error":
		lvl = slog.LevelError
	default:
		lvl = slog.LevelInfo
	}

	opts := &slog.HandlerOptions{
		Level:     lvl,
		AddSource: lvl == slog.LevelDebug,
	}

	var handler slog.Handler
	if strings.ToLower(format) == "text" {
		handler = slog.NewTextHandler(os.Stdout, opts)
	} else {
		handler = slog.NewJSONHandler(os.Stdout, opts)
	}

	return slog.New(handler)
}

// WithContext enriches the logger with values from the context.
func WithContext(ctx context.Context, logger *slog.Logger) *slog.Logger {
	if v, ok := ctx.Value(keyRequestID).(string); ok && v != "" {
		logger = logger.With("request_id", v)
	}
	return logger
}

// ContextWithRequestID stores a request ID in the context.
func ContextWithRequestID(ctx context.Context, requestID string) context.Context {
	return context.WithValue(ctx, keyRequestID, requestID)
}
