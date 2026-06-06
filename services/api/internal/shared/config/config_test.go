package config

import "testing"

func TestLoadDefaults(t *testing.T) {
	cfg := Load()

	if cfg.Server.Port != 8080 {
		t.Errorf("default port = %d, want 8080", cfg.Server.Port)
	}
	if len(cfg.CORS.AllowedOrigins) != 1 || cfg.CORS.AllowedOrigins[0] != "http://localhost:3000" {
		t.Errorf("default CORS origins = %v", cfg.CORS.AllowedOrigins)
	}
}

func TestPortFromRenderEnv(t *testing.T) {
	t.Setenv("PORT", "10000")

	cfg := Load()
	if cfg.Server.Port != 10000 {
		t.Errorf("port = %d, want 10000 from PORT env", cfg.Server.Port)
	}
}

func TestEnvFirstOfPrefersFirstName(t *testing.T) {
	t.Setenv("HF_TOKEN", "a")
	t.Setenv("HUGGINGFACE_API_KEY", "b")

	cfg := Load()
	if cfg.HuggingFace.Token != "a" {
		t.Errorf("HF token should prefer HF_TOKEN over HUGGINGFACE_API_KEY")
	}
}

func TestEnvFirstOfFallsBack(t *testing.T) {
	t.Setenv("GOOGLE_MAPS_API_KEY", "")
	t.Setenv("GOOGLE_STREET_VIEW_API_KEY", "sv")

	cfg := Load()
	if cfg.Google.APIKey != "sv" {
		t.Errorf("Google key should fall back to GOOGLE_STREET_VIEW_API_KEY")
	}
}

// SecretPresence must report only booleans — it is logged at startup, so this
// guards against anyone accidentally returning values.
func TestSecretPresenceReportsOnlyBooleans(t *testing.T) {
	t.Setenv("DATABASE_URL", "postgres://user:secret@host/db")
	t.Setenv("HF_TOKEN", "super-secret")

	cfg := Load()
	presence := cfg.SecretPresence()

	if !presence["database_url"] {
		t.Error("database_url should be reported present")
	}
	if !presence["huggingface_token"] {
		t.Error("huggingface_token should be reported present")
	}
	if presence["google_api_key"] && cfg.Google.APIKey == "" {
		t.Error("google_api_key presence must match config")
	}
}
