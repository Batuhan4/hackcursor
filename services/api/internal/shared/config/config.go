// Package config loads all runtime configuration from environment variables,
// following the masterfabric-go internal/shared/config pattern.
//
// Secret VALUES are never logged or printed anywhere — use SecretPresence to
// report which secrets are set.
package config

import (
	"os"
	"strconv"
	"strings"
	"time"
)

// Config holds all application configuration.
type Config struct {
	Server      ServerConfig
	Database    DatabaseConfig
	Google      GoogleConfig
	HuggingFace HuggingFaceConfig
	CORS        CORSConfig
	Log         LogConfig
}

// ServerConfig holds HTTP server settings. Render injects PORT.
type ServerConfig struct {
	Host         string
	Port         int
	ReadTimeout  time.Duration
	WriteTimeout time.Duration
	IdleTimeout  time.Duration
}

// DatabaseConfig holds the Render Postgres connection string (DATABASE_URL).
type DatabaseConfig struct {
	URL string
}

// GoogleConfig holds the Street View / Maps API key.
type GoogleConfig struct {
	APIKey string
}

// HuggingFaceConfig holds the Hugging Face token for model/dataset access.
type HuggingFaceConfig struct {
	Token string
}

// CORSConfig holds allowed origins for the web dashboard.
type CORSConfig struct {
	AllowedOrigins []string
}

// LogConfig holds logging settings.
type LogConfig struct {
	Level  string // debug, info, warn, error
	Format string // json, text
}

// Load reads configuration from environment variables with sensible defaults.
func Load() *Config {
	return &Config{
		Server: ServerConfig{
			Host:         envOrDefault("SERVER_HOST", "0.0.0.0"),
			Port:         envOrDefaultInt("PORT", 8080),
			ReadTimeout:  time.Duration(envOrDefaultInt("SERVER_READ_TIMEOUT_SECONDS", 15)) * time.Second,
			WriteTimeout: time.Duration(envOrDefaultInt("SERVER_WRITE_TIMEOUT_SECONDS", 15)) * time.Second,
			IdleTimeout:  time.Duration(envOrDefaultInt("SERVER_IDLE_TIMEOUT_SECONDS", 60)) * time.Second,
		},
		Database: DatabaseConfig{
			URL: os.Getenv("DATABASE_URL"),
		},
		Google: GoogleConfig{
			APIKey: envFirstOf("GOOGLE_MAPS_API_KEY", "GOOGLE_STREET_VIEW_API_KEY"),
		},
		HuggingFace: HuggingFaceConfig{
			Token: envFirstOf("HF_TOKEN", "HUGGINGFACE_API_KEY"),
		},
		CORS: CORSConfig{
			AllowedOrigins: envOrDefaultSlice("CORS_ALLOWED_ORIGINS", []string{"http://localhost:3000"}),
		},
		Log: LogConfig{
			Level:  envOrDefault("LOG_LEVEL", "info"),
			Format: envOrDefault("LOG_FORMAT", "json"),
		},
	}
}

// SecretPresence reports which secret-bearing settings are configured WITHOUT
// exposing any value. The returned map is safe to log.
func (c *Config) SecretPresence() map[string]bool {
	return map[string]bool{
		"database_url":      c.Database.URL != "",
		"google_api_key":    c.Google.APIKey != "",
		"huggingface_token": c.HuggingFace.Token != "",
	}
}

func envOrDefault(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}

func envOrDefaultInt(key string, defaultVal int) int {
	if val := os.Getenv(key); val != "" {
		if intVal, err := strconv.Atoi(val); err == nil {
			return intVal
		}
	}
	return defaultVal
}

func envOrDefaultSlice(key string, defaultVal []string) []string {
	if val := os.Getenv(key); val != "" {
		parts := strings.Split(val, ",")
		var result []string
		for _, p := range parts {
			if trimmed := strings.TrimSpace(p); trimmed != "" {
				result = append(result, trimmed)
			}
		}
		if len(result) > 0 {
			return result
		}
	}
	return defaultVal
}

// envFirstOf returns the first non-empty value among the given variable names.
func envFirstOf(names ...string) string {
	for _, name := range names {
		if val := os.Getenv(name); val != "" {
			return val
		}
	}
	return ""
}
