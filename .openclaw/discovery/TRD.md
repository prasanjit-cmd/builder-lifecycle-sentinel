# Technical Requirements Document

## Product Name
Builder Lifecycle Sentinel

## Architecture Overview
Builder Lifecycle Sentinel is a local-only QA agent that performs a manual one-shot inspection of a fresh Ruh agent-builder create-flow. It gathers evidence from local workspace files, OpenClaw/Ruh runtime APIs, Docker/Podman state where available, and bounded logs. It persists structured results in SQLite and exposes a Mission Control dashboard plus local API endpoints for readiness reporting.

The Sentinel is observe/report-only. It does not modify builder outputs, deploy, ship, block, or call external services.

### Data Flow
1. Operator invokes a manual QA run and provides or confirms target workspace/session context.
2. Sentinel creates a `qa_runs` record with status `running`.
3. Sentinel probes local environment evidence:
   - OpenClaw session/runtime status for GPT-5.5 and relevant session metadata.
   - Docker/Podman/OpenClaw sandbox state for sandbox attachment evidence.
   - Gateway/backend/session logs with bounded reads.
4. Sentinel inventories expected lifecycle artifacts in the target workspace.
5. Sentinel runs deterministic checks for Environment, Think, Plan, Build, Review/Test, and Ship Guardrail.
6. Sentinel stores artifacts, evidence, and check results in SQLite.
7. Sentinel computes overall readiness.
8. Sentinel presents a concise summary and dashboard views with detailed evidence.

## Skills & Workflow

### Proposed Skills

#### `collect-local-evidence`
Collect bounded local evidence from session status, workspace files, Docker/Podman state, local OpenClaw/Ruh APIs, and logs.

Inputs:
- `target_workspace`
- `target_session_id` optional
- `target_agent_name`
- `max_log_lines`

Outputs:
- Evidence items.
- Artifact inventory.
- Probe availability results.

#### `verify-builder-lifecycle`
Evaluate deterministic lifecycle checks against collected evidence.

Inputs:
- Evidence items.
- Artifact inventory.
- Expected artifact manifest.
- Target mission text.

Outputs:
- Check results grouped by stage.
- Overall status recommendation.

#### `render-readiness-report`
Create operator-facing report summaries for chat and Mission Control.

Inputs:
- QA run id.
- Check results.
- Evidence items.
- Artifact inventory.

Outputs:
- Markdown summary.
- Dashboard-ready structured data.

### Execution Flow
1. `manual_run_requested`
2. Resolve target context:
   - Default workspace: `/root/.openclaw/workspace` unless operator specifies another path.
   - Target agent name: `Builder Lifecycle Sentinel`.
3. Run `collect-local-evidence`.
4. Run `verify-builder-lifecycle`.
5. Persist `qa_runs`, `check_results`, `artifacts`, and `evidence_items`.
6. Run `render-readiness-report`.
7. Return concise summary and dashboard link/path.

## External APIs & Tools

### OpenClaw Runtime Tools

#### `session_status`
Purpose: inspect current or target visible session status where supported.
Evidence fields:
- OpenClaw version.
- Model id/name.
- Session key.
- Runtime mode.
- Queue state.
- Reasoning/text settings.

Check usage:
- Verify `openai-codex/gpt-5.5` or equivalent GPT-5.5 id is active for the relevant builder/create-flow session.
- If only Sentinel session status is available and target builder session is unavailable, mark target-model evidence as `unknown` rather than pass.

Auth: local OpenClaw runtime context.
Rate limits: none beyond local tool execution.

#### `sessions_list` and `sessions_history`
Purpose: inspect visible sessions and phase-marker history where available.
Use cases:
- Find recent builder/create-flow session.
- Verify THINK/PLAN/BUILD/REVIEW/TEST phase markers.
- Correlate files to the fresh run.

Guardrails:
- Bounded history limits.
- Do not store full transcripts; store only source references and short excerpts.

### Local OpenClaw CLI
Read-only commands allowed with timeout and bounded output:

```bash
openclaw --help
openclaw status
openclaw health
openclaw doctor
openclaw logs --help
openclaw sessions --help
openclaw tasks --help
openclaw models --help
openclaw config get <key>
openclaw sandbox --help
```

Potential Gateway/Ruh local API calls should be accessed only through local OpenClaw commands or first-class tools unless a documented localhost endpoint is available in the deployment environment.

Timeout policy:
- Default command timeout: 10 seconds.
- Log commands: 15 seconds with tail limits.
- Hanging commands produce `unknown`/`blocked` evidence, not pass.

### Docker / Podman CLI
Preferred read-only Docker commands:

```bash
docker version --format '{{.Server.Version}}'
docker ps --format '{{.ID}} {{.Image}} {{.Names}} {{.Status}}'
docker inspect <container_id_or_name>
docker logs --tail 200 <container_id_or_name>
```

Fallback Podman commands:

```bash
podman --version
podman ps --format '{{.ID}} {{.Image}} {{.Names}} {{.Status}}'
podman inspect <container_id_or_name>
podman logs --tail 200 <container_id_or_name>
```

Sandbox attachment evidence should include at least one of:
- Running container name/image that matches OpenClaw/Ruh sandbox naming conventions.
- OpenClaw sandbox CLI/API status identifying the target session/workspace.
- Logs showing sandbox creation/attachment for the target run/session.
- Workspace path mounted or associated with the sandbox container.

If `docker` and `podman` are both unavailable, record a `docker_cli_unavailable` evidence item and mark sandbox verification `unknown` or `blocked`.

### Filesystem
Expected artifact probes:

```text
<workspace>/.openclaw/discovery/research-brief.md
<workspace>/.openclaw/discovery/PRD.md
<workspace>/.openclaw/discovery/TRD.md
<workspace>/architecture.json
<workspace>/PLAN.md
<workspace>/SOUL.md
<workspace>/AGENTS.md
<workspace>/IDENTITY.md
<workspace>/skills/*/SKILL.md
<workspace>/openclaw.plugin.json
<workspace>/manifest.json
<workspace>/.openclaw/manifest.json
```

Manifest candidates are considered acceptable only if referenced by the plan/build output or present in expected builder locations.

### Logs
Expected log roots:

```text
/root/.openclaw/logs/
/root/.openclaw/agents/*/sessions/
/root/.openclaw/tasks/
<workspace>/.openclaw/
```

Log reads must be bounded:
- Max files per run: 20 by default.
- Max bytes per file: 64 KB by default.
- Max stored excerpt: 2 KB per evidence item.

## Database Schema

SQLite database: local agent runtime database.

```sql
CREATE TABLE qa_runs (
  id TEXT PRIMARY KEY,
  target_agent_name TEXT NOT NULL,
  target_workspace TEXT NOT NULL,
  target_session_id TEXT,
  invocation_channel TEXT NOT NULL DEFAULT 'manual',
  started_at TEXT NOT NULL,
  finished_at TEXT,
  overall_status TEXT NOT NULL CHECK (overall_status IN ('running','ready','not_ready','blocked_unknown','error')),
  summary TEXT,
  created_by TEXT,
  freshness_anchor TEXT
);

CREATE INDEX idx_qa_runs_started_at ON qa_runs(started_at DESC);
CREATE INDEX idx_qa_runs_target_agent ON qa_runs(target_agent_name);
```

```sql
CREATE TABLE artifacts (
  id TEXT PRIMARY KEY,
  qa_run_id TEXT NOT NULL REFERENCES qa_runs(id) ON DELETE CASCADE,
  artifact_type TEXT NOT NULL,
  path TEXT NOT NULL,
  exists_flag INTEGER NOT NULL CHECK (exists_flag IN (0,1)),
  size_bytes INTEGER,
  modified_at TEXT,
  sha256 TEXT,
  exact_agent_match INTEGER CHECK (exact_agent_match IN (0,1)),
  freshness_status TEXT CHECK (freshness_status IN ('fresh','stale','unknown','not_applicable')),
  parse_status TEXT CHECK (parse_status IN ('not_parsed','valid','invalid','unknown')),
  notes TEXT
);

CREATE INDEX idx_artifacts_run ON artifacts(qa_run_id);
CREATE INDEX idx_artifacts_type ON artifacts(artifact_type);
CREATE UNIQUE INDEX idx_artifacts_run_path ON artifacts(qa_run_id, path);
```

```sql
CREATE TABLE evidence_items (
  id TEXT PRIMARY KEY,
  qa_run_id TEXT NOT NULL REFERENCES qa_runs(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('file','session_status','sessions_history','cli','docker','podman','log','api','operator_input')),
  source_locator TEXT NOT NULL,
  captured_at TEXT NOT NULL,
  excerpt TEXT,
  structured_value_json TEXT,
  redacted INTEGER NOT NULL DEFAULT 0 CHECK (redacted IN (0,1)),
  confidence TEXT NOT NULL CHECK (confidence IN ('high','medium','low'))
);

CREATE INDEX idx_evidence_run ON evidence_items(qa_run_id);
CREATE INDEX idx_evidence_source_type ON evidence_items(source_type);
```

```sql
CREATE TABLE check_results (
  id TEXT PRIMARY KEY,
  qa_run_id TEXT NOT NULL REFERENCES qa_runs(id) ON DELETE CASCADE,
  stage TEXT NOT NULL CHECK (stage IN ('environment','think','plan','build','review_test','ship_guardrail')),
  check_key TEXT NOT NULL,
  title TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('critical','major','minor','info')),
  status TEXT NOT NULL CHECK (status IN ('pass','fail','unknown','skipped')),
  expected TEXT NOT NULL,
  actual TEXT,
  remediation TEXT,
  primary_evidence_id TEXT REFERENCES evidence_items(id),
  created_at TEXT NOT NULL
);

CREATE INDEX idx_check_results_run ON check_results(qa_run_id);
CREATE INDEX idx_check_results_stage ON check_results(stage);
CREATE INDEX idx_check_results_status ON check_results(status);
CREATE UNIQUE INDEX idx_check_results_run_key ON check_results(qa_run_id, check_key);
```

```sql
CREATE TABLE run_events (
  id TEXT PRIMARY KEY,
  qa_run_id TEXT NOT NULL REFERENCES qa_runs(id) ON DELETE CASCADE,
  event_at TEXT NOT NULL,
  event_type TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata_json TEXT
);

CREATE INDEX idx_run_events_run_time ON run_events(qa_run_id, event_at);
```

## Required Checks

### Environment Checks
- `model_gpt_55_active`: relevant builder/create-flow session uses GPT-5.5.
- `sandbox_attached`: sandbox/container attachment evidence exists for target run.
- `local_surfaces_available`: workspace, logs, local APIs/tools are readable.
- `docker_state_available`: Docker/Podman state available or explicitly unknown.

### Think Checks
- `research_brief_exists`: research brief exists.
- `prd_exists`: PRD exists.
- `trd_exists`: TRD exists.
- `prd_exact_agent`: PRD mentions `Builder Lifecycle Sentinel` and local QA mission.
- `trd_exact_agent`: TRD mentions `Builder Lifecycle Sentinel` and local QA mission.
- `think_not_generic`: PRD/TRD contain specific local surfaces and success criteria, not placeholders.

### Plan Checks
- `architecture_json_exists`: `architecture.json` exists.
- `architecture_json_valid`: JSON parses successfully.
- `plan_md_exists`: `PLAN.md` exists.
- `plan_exact_agent`: plan references Builder Lifecycle Sentinel mission.
- `plan_local_only`: plan excludes external integrations and shipping.
- `plan_dashboard_schema`: plan includes dashboard/report data needs.

### Build Checks
- `soul_exists`: `SOUL.md` exists.
- `agents_exists`: `AGENTS.md` exists.
- `identity_exists`: `IDENTITY.md` exists.
- `skill_exists`: at least one relevant `skills/*/SKILL.md` exists.
- `skill_frontmatter_valid`: skill has YAML frontmatter with name/description.
- `manifest_exists`: expected manifest candidate exists if required by plan.
- `build_exact_agent`: critical files reference correct agent/mission.
- `no_placeholders`: critical files do not contain TODO/placeholder markers.

### Review/Test Checks
- `review_readiness_truthful`: review readiness claim matches artifacts/evidence.
- `test_readiness_truthful`: test readiness claim matches checks/evidence.
- `failures_not_hidden`: known failures are reflected in report/status.

### Ship Guardrail Checks
- `no_ship_without_approval`: deploy/ship status is not marked done without explicit operator approval evidence.
- `external_mutation_absent`: Sentinel did not perform or require external mutation.

## API Endpoints

### `GET /api/builder-lifecycle-sentinel/runs`
Returns recent QA runs.

Response:
```json
{
  "runs": [
    {
      "id": "run_...",
      "targetAgentName": "Builder Lifecycle Sentinel",
      "targetWorkspace": "/root/.openclaw/workspace",
      "startedAt": "2026-04-25T14:30:00Z",
      "finishedAt": "2026-04-25T14:30:20Z",
      "overallStatus": "not_ready",
      "summary": "Plan missing architecture.json"
    }
  ]
}
```

Consumed by: Readiness Overview run selector.

### `GET /api/builder-lifecycle-sentinel/runs/:id`
Returns run summary and stage counts.

Response:
```json
{
  "id": "run_...",
  "overallStatus": "ready",
  "stageSummaries": [
    { "stage": "environment", "status": "pass", "pass": 4, "fail": 0, "unknown": 0 },
    { "stage": "think", "status": "pass", "pass": 6, "fail": 0, "unknown": 0 }
  ]
}
```

Consumed by: Readiness Overview metric cards and stage table.

### `GET /api/builder-lifecycle-sentinel/runs/:id/checks`
Returns check results with evidence references.

Query params:
- `stage`
- `status`
- `severity`

Response:
```json
{
  "checks": [
    {
      "checkKey": "trd_exists",
      "stage": "think",
      "severity": "critical",
      "status": "fail",
      "expected": "TRD.md exists under .openclaw/discovery",
      "actual": "File not found",
      "primaryEvidenceId": "ev_...",
      "remediation": "Rerun THINK or create TRD before Plan."
    }
  ]
}
```

Consumed by: Check Details table.

### `GET /api/builder-lifecycle-sentinel/runs/:id/artifacts`
Returns artifact inventory.

Response:
```json
{
  "artifacts": [
    {
      "artifactType": "prd",
      "path": "/root/.openclaw/workspace/.openclaw/discovery/PRD.md",
      "exists": true,
      "modifiedAt": "2026-04-25T14:30:00Z",
      "sha256": "...",
      "exactAgentMatch": true,
      "freshnessStatus": "fresh",
      "parseStatus": "not_parsed"
    }
  ]
}
```

Consumed by: Artifact Inventory page.

### `GET /api/builder-lifecycle-sentinel/runs/:id/evidence`
Returns bounded evidence entries.

Query params:
- `sourceType`
- `checkKey`

Response:
```json
{
  "evidence": [
    {
      "id": "ev_...",
      "sourceType": "session_status",
      "sourceLocator": "agent:copilot:...",
      "capturedAt": "2026-04-25T14:30:01Z",
      "excerpt": "Model: openai-codex/gpt-5.5",
      "confidence": "high",
      "redacted": false
    }
  ]
}
```

Consumed by: Evidence Log page and expanded check details.

## Dashboard Pages

### Page 1: Readiness Overview
- Title: Builder Lifecycle Sentinel Readiness
- Path: `/builder-lifecycle-sentinel/readiness`
- Components:
  - `metric-cards`: overall status, pass count, fail count, unknown count, critical failures.
  - `data-table`: lifecycle stage summary from `check_results` grouped by stage.
  - `activity-feed`: recent `run_events`.
  - `bar-chart`: check count by status and stage.

### Page 2: Check Details
- Path: `/builder-lifecycle-sentinel/checks`
- Components:
  - `data-table`: check results.
  - Filters: stage, status, severity.
  - Detail drawer: expected, actual, remediation, evidence excerpt.

### Page 3: Artifact Inventory
- Path: `/builder-lifecycle-sentinel/artifacts`
- Components:
  - `data-table`: artifacts.
  - Status badges for missing/stale/wrong-agent/invalid JSON.
  - Hash and modified-time columns.

### Page 4: Evidence Log
- Path: `/builder-lifecycle-sentinel/evidence`
- Components:
  - `activity-feed`: evidence items ordered by captured time.
  - `data-table`: source type, locator, confidence, redaction flag, excerpt.

## Vector Collections

### `builder_lifecycle_failure_patterns`
What gets embedded:
- Concise summaries of failed checks.
- Remediation notes.
- Operator-confirmed root causes.

When:
- After a QA run finishes, embed only summarized non-secret failure patterns.

Use:
- Suggest likely causes and remediation in future runs.

### `builder_lifecycle_docs_context`
What gets embedded:
- Non-secret local documentation snippets about expected builder lifecycle artifacts and phase contracts.

When:
- During setup/build of the Sentinel, not during every QA pass unless docs change.

Use:
- Improve explanations and reduce brittle hardcoding.

Guardrails:
- Do not embed raw logs, secrets, full transcripts, or config files containing credentials.

## Triggers & Scheduling

### Manual Trigger
Primary trigger only.

Examples:
- Operator says: `Run Builder Lifecycle Sentinel on the latest create-flow.`
- Operator provides: `target_workspace=/root/.openclaw/workspace target_session_id=...`

### Scheduled Trigger
Not required.

### Webhooks
Not required.

### Cron
None by default. The PRD calls for manual one-shot per fresh create-flow.

## Environment Variables

No external integration credentials are required.

Optional local configuration variables:

```text
BUILDER_SENTINEL_DEFAULT_WORKSPACE=/root/.openclaw/workspace
BUILDER_SENTINEL_DEFAULT_AGENT_NAME=Builder Lifecycle Sentinel
BUILDER_SENTINEL_MAX_LOG_FILES=20
BUILDER_SENTINEL_MAX_LOG_BYTES=65536
BUILDER_SENTINEL_MAX_LOG_EXCERPT_BYTES=2048
BUILDER_SENTINEL_COMMAND_TIMEOUT_MS=10000
BUILDER_SENTINEL_LOG_TIMEOUT_MS=15000
BUILDER_SENTINEL_REQUIRE_EXPLICIT_SHIP_APPROVAL=true
BUILDER_SENTINEL_ALLOW_EXTERNAL_CALLS=false
```

OpenClaw environment is inherited from the local runtime. The Sentinel must not require Google Ads, Meta, Slack, GitHub, cloud database, or deployment credentials.

## Error Handling & Guardrails

### Status Semantics
- `pass`: evidence directly satisfies the check.
- `fail`: evidence directly disproves the check or required artifact is absent/invalid.
- `unknown`: evidence source unavailable, ambiguous, or insufficient.
- `skipped`: check not applicable based on explicit plan/run context.

### Overall Status Computation
- `ready`: all critical checks pass, no major fails, ship guardrail is not violated.
- `not_ready`: any critical or major lifecycle check fails.
- `blocked_unknown`: one or more critical checks are unknown and no critical checks fail.
- `error`: Sentinel could not complete its own run due to internal error.

### Command Safety
- Use read-only commands only.
- Apply timeouts to all CLI probes.
- Limit command output size.
- Never run destructive commands: `rm`, `docker stop`, `docker kill`, `docker rm`, `openclaw reset`, deploy/push/ship commands, or config mutations.

### Log Safety
- Read bounded tails/excerpts only.
- Redact tokens, bearer strings, API keys, cookies, and secrets.
- Store source references and short excerpts, not full logs.

### Freshness Rules
A file can be considered fresh if at least one is true:
- Its modified time is after the run's freshness anchor.
- It contains the target agent name and mission from the current create-flow.
- It is referenced by the current session/run logs or phase markers.

If freshness cannot be established for a critical artifact, mark freshness `unknown` and the relevant check `unknown` or `fail` depending on whether stale evidence is likely.

### Exact-Agent Specificity Rules
Critical docs and build artifacts must contain:
- `Builder Lifecycle Sentinel`.
- Local QA / Ruh agent builder mission language.
- Manual one-shot or observe/report-only guardrail where relevant.

Generic lifecycle files or wrong-agent names fail exact-agent checks.

### Ship Guardrail
The Sentinel must never report deployment/shipping as complete unless explicit operator approval evidence exists for the same run. If no approval artifact is found:
- `no_ship_without_approval` passes only if ship/deploy is not claimed.
- If any artifact/log claims shipped/deployed without approval, status is `fail`.

### Retry Policy
- File reads: retry once for transient access errors.
- CLI probes: no tight loops; one retry only if failure is clearly transient and non-destructive.
- Logs: no retries beyond alternate source path discovery.

### Performance Bounds
- Target runtime: under 60 seconds for normal local workspaces.
- Hard cap: 120 seconds unless operator explicitly requests deeper log analysis.
- Max files scanned by content: 100 by default.
- Max artifact content read per file: 128 KB by default.

## Implementation Notes for Future BUILD Phase
- Build only after human review of these THINK documents.
- Skills should live under `skills/` and include frontmatter.
- The Sentinel should persist reports locally and expose dashboard endpoints.
- Keep all checks deterministic where possible; use LLM judgment only for concise summarization and remediation phrasing, not for pass/fail when deterministic evidence exists.
