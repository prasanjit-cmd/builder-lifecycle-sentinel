CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS qa_runs (
  id TEXT PRIMARY KEY,
  target_agent_name TEXT NOT NULL,
  target_workspace TEXT NOT NULL,
  target_session_id TEXT,
  invocation_channel TEXT NOT NULL DEFAULT 'manual',
  started_at TIMESTAMPTZ NOT NULL,
  finished_at TIMESTAMPTZ,
  overall_status TEXT NOT NULL CHECK (overall_status IN ('running', 'ready', 'not_ready', 'blocked_unknown', 'error')),
  summary TEXT,
  created_by TEXT,
  freshness_anchor TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT qa_runs_finished_after_started CHECK (finished_at IS NULL OR finished_at >= started_at)
);

CREATE TABLE IF NOT EXISTS artifacts (
  id TEXT PRIMARY KEY,
  qa_run_id TEXT NOT NULL REFERENCES qa_runs(id) ON DELETE CASCADE,
  artifact_type TEXT NOT NULL CHECK (artifact_type IN (
    'research_brief', 'prd', 'trd', 'architecture_json', 'plan_md', 'soul',
    'agents', 'identity', 'skill', 'manifest', 'log'
  )),
  path TEXT NOT NULL,
  exists_flag BOOLEAN NOT NULL DEFAULT false,
  size_bytes BIGINT CHECK (size_bytes IS NULL OR size_bytes >= 0),
  modified_at TIMESTAMPTZ,
  sha256 TEXT CHECK (sha256 IS NULL OR sha256 ~ '^[a-f0-9]{64}$'),
  exact_agent_match BOOLEAN,
  freshness_status TEXT CHECK (freshness_status IS NULL OR freshness_status IN ('fresh', 'stale', 'unknown', 'not_applicable')),
  parse_status TEXT CHECK (parse_status IS NULL OR parse_status IN ('not_parsed', 'valid', 'invalid', 'unknown')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT artifacts_run_path_unique UNIQUE (qa_run_id, path)
);

CREATE TABLE IF NOT EXISTS evidence_items (
  id TEXT PRIMARY KEY,
  qa_run_id TEXT NOT NULL REFERENCES qa_runs(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN (
    'file', 'session_status', 'sessions_history', 'cli', 'docker', 'podman', 'log', 'api', 'operator_input'
  )),
  source_locator TEXT NOT NULL,
  captured_at TIMESTAMPTZ NOT NULL,
  excerpt TEXT,
  structured_value_json JSONB,
  redacted BOOLEAN NOT NULL DEFAULT false,
  confidence TEXT NOT NULL CHECK (confidence IN ('high', 'medium', 'low')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS check_results (
  id TEXT PRIMARY KEY,
  qa_run_id TEXT NOT NULL REFERENCES qa_runs(id) ON DELETE CASCADE,
  stage TEXT NOT NULL CHECK (stage IN ('environment', 'think', 'plan', 'build', 'review_test', 'ship_guardrail')),
  check_key TEXT NOT NULL,
  title TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'major', 'minor', 'info')),
  status TEXT NOT NULL CHECK (status IN ('pass', 'fail', 'unknown', 'skipped')),
  expected TEXT NOT NULL,
  actual TEXT,
  remediation TEXT,
  primary_evidence_id TEXT REFERENCES evidence_items(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT check_results_run_key_unique UNIQUE (qa_run_id, check_key)
);

CREATE TABLE IF NOT EXISTS run_events (
  id TEXT PRIMARY KEY,
  qa_run_id TEXT NOT NULL REFERENCES qa_runs(id) ON DELETE CASCADE,
  event_at TIMESTAMPTZ NOT NULL,
  event_type TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_qa_runs_started_at ON qa_runs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_qa_runs_target_agent ON qa_runs(target_agent_name);
CREATE INDEX IF NOT EXISTS idx_qa_runs_overall_status ON qa_runs(overall_status);

CREATE INDEX IF NOT EXISTS idx_artifacts_run ON artifacts(qa_run_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_type ON artifacts(artifact_type);
CREATE INDEX IF NOT EXISTS idx_artifacts_run_path ON artifacts(qa_run_id, path);
CREATE INDEX IF NOT EXISTS idx_artifacts_freshness_status ON artifacts(freshness_status);

CREATE INDEX IF NOT EXISTS idx_evidence_run ON evidence_items(qa_run_id);
CREATE INDEX IF NOT EXISTS idx_evidence_source_type ON evidence_items(source_type);
CREATE INDEX IF NOT EXISTS idx_evidence_captured_at ON evidence_items(captured_at DESC);

CREATE INDEX IF NOT EXISTS idx_check_results_run ON check_results(qa_run_id);
CREATE INDEX IF NOT EXISTS idx_check_results_stage ON check_results(stage);
CREATE INDEX IF NOT EXISTS idx_check_results_status ON check_results(status);
CREATE INDEX IF NOT EXISTS idx_check_results_run_key ON check_results(qa_run_id, check_key);
CREATE INDEX IF NOT EXISTS idx_check_results_primary_evidence ON check_results(primary_evidence_id);

CREATE INDEX IF NOT EXISTS idx_run_events_run_time ON run_events(qa_run_id, event_at DESC);
CREATE INDEX IF NOT EXISTS idx_run_events_event_type ON run_events(event_type);

DROP TRIGGER IF EXISTS trg_qa_runs_updated_at ON qa_runs;
CREATE TRIGGER trg_qa_runs_updated_at
BEFORE UPDATE ON qa_runs
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_artifacts_updated_at ON artifacts;
CREATE TRIGGER trg_artifacts_updated_at
BEFORE UPDATE ON artifacts
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_evidence_items_updated_at ON evidence_items;
CREATE TRIGGER trg_evidence_items_updated_at
BEFORE UPDATE ON evidence_items
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_check_results_updated_at ON check_results;
CREATE TRIGGER trg_check_results_updated_at
BEFORE UPDATE ON check_results
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_run_events_updated_at ON run_events;
CREATE TRIGGER trg_run_events_updated_at
BEFORE UPDATE ON run_events
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
