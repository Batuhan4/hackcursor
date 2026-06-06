-- Urban Object Inventory schema for Render Postgres (DATABASE_URL).
-- Mirrors packages/contracts/schemas/*.schema.json.
--
-- KVKK by design:
--   * anonymization_events stores ONLY region counts + method. There are no
--     columns for region contents, crops, embeddings, identities or plate
--     text — and none may ever be added.
--   * image_sources has no raw-image URI column; only anonymized derivatives.

CREATE TABLE IF NOT EXISTS demo_runs (
    id                      TEXT PRIMARY KEY,
    name                    TEXT NOT NULL,
    status                  TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    image_count             INTEGER NOT NULL DEFAULT 0,
    detection_count         INTEGER NOT NULL DEFAULT 0,
    anonymized_region_count INTEGER NOT NULL DEFAULT 0,
    model_id                TEXT,
    started_at              TIMESTAMPTZ,
    completed_at            TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS image_sources (
    id             TEXT PRIMARY KEY,
    demo_run_id    TEXT NOT NULL REFERENCES demo_runs (id) ON DELETE CASCADE,
    provider       TEXT NOT NULL CHECK (provider IN ('google_street_view', 'google_maps_static', 'fixture', 'field_upload')),
    external_ref   TEXT,
    lat            DOUBLE PRECISION CHECK (lat BETWEEN -90 AND 90),
    lng            DOUBLE PRECISION CHECK (lng BETWEEN -180 AND 180),
    heading        DOUBLE PRECISION CHECK (heading BETWEEN 0 AND 360),
    captured_at    TIMESTAMPTZ,
    anonymized     BOOLEAN NOT NULL DEFAULT FALSE,
    anonymized_uri TEXT
);

CREATE TABLE IF NOT EXISTS anonymization_events (
    id           TEXT PRIMARY KEY,
    demo_run_id  TEXT NOT NULL REFERENCES demo_runs (id) ON DELETE CASCADE,
    image_id     TEXT NOT NULL REFERENCES image_sources (id) ON DELETE CASCADE,
    region_type  TEXT NOT NULL CHECK (region_type IN ('face', 'license_plate')),
    region_count INTEGER NOT NULL CHECK (region_count >= 0),
    method       TEXT NOT NULL CHECK (method IN ('gaussian_blur', 'solid_mask')),
    irreversible BOOLEAN NOT NULL CHECK (irreversible = TRUE),
    processed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS detections (
    id           TEXT PRIMARY KEY,
    demo_run_id  TEXT NOT NULL REFERENCES demo_runs (id) ON DELETE CASCADE,
    image_id     TEXT NOT NULL REFERENCES image_sources (id) ON DELETE CASCADE,
    object_class TEXT NOT NULL,
    confidence   DOUBLE PRECISION NOT NULL CHECK (confidence BETWEEN 0 AND 1),
    bbox_x       DOUBLE PRECISION NOT NULL CHECK (bbox_x BETWEEN 0 AND 1),
    bbox_y       DOUBLE PRECISION NOT NULL CHECK (bbox_y BETWEEN 0 AND 1),
    bbox_width   DOUBLE PRECISION NOT NULL CHECK (bbox_width BETWEEN 0 AND 1),
    bbox_height  DOUBLE PRECISION NOT NULL CHECK (bbox_height BETWEEN 0 AND 1),
    lat          DOUBLE PRECISION CHECK (lat BETWEEN -90 AND 90),
    lng          DOUBLE PRECISION CHECK (lng BETWEEN -180 AND 180),
    evidence_uri TEXT,
    model_id     TEXT
);

CREATE TABLE IF NOT EXISTS street_analyses (
    id                           TEXT PRIMARY KEY,
    demo_run_id                  TEXT NOT NULL REFERENCES demo_runs (id) ON DELETE CASCADE,
    image_id                     TEXT NOT NULL,
    source_label                 TEXT NOT NULL,
    lat                          DOUBLE PRECISION CHECK (lat BETWEEN -90 AND 90),
    lng                          DOUBLE PRECISION CHECK (lng BETWEEN -180 AND 180),
    built_density_pct            DOUBLE PRECISION NOT NULL CHECK (built_density_pct BETWEEN 0 AND 100),
    openness_score               DOUBLE PRECISION NOT NULL CHECK (openness_score BETWEEN 0 AND 100),
    sidewalk_availability_score  DOUBLE PRECISION NOT NULL CHECK (sidewalk_availability_score BETWEEN 0 AND 100),
    greenery_score               DOUBLE PRECISION NOT NULL CHECK (greenery_score BETWEEN 0 AND 100),
    road_share_pct               DOUBLE PRECISION NOT NULL CHECK (road_share_pct BETWEEN 0 AND 100),
    pedestrian_comfort_potential DOUBLE PRECISION NOT NULL CHECK (pedestrian_comfort_potential BETWEEN 0 AND 100),
    model_id                     TEXT
);

CREATE INDEX IF NOT EXISTS idx_detections_demo_run ON detections (demo_run_id);
CREATE INDEX IF NOT EXISTS idx_detections_class ON detections (object_class);
CREATE INDEX IF NOT EXISTS idx_image_sources_demo_run ON image_sources (demo_run_id);
CREATE INDEX IF NOT EXISTS idx_anonymization_events_image ON anonymization_events (image_id);
CREATE INDEX IF NOT EXISTS idx_street_analyses_demo_run ON street_analyses (demo_run_id);
