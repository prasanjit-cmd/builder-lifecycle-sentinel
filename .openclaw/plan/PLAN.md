# Architecture Plan

## Agent
Builder Lifecycle Sentinel is a compact local-only QA agent for the Ruh agent builder. It performs one manual, evidence-backed readiness pass over a fresh create-flow and reports whether Environment, Think, Plan, Build, Review/Test, and Ship Guardrail evidence is trustworthy.

## Skill Boundaries
The plan uses three skills:

1. `collect-local-evidence` owns all bounded read-only collection from workspace files, local OpenClaw/Ruh runtime surfaces, Docker/Podman state, and logs. It writes raw evidence, artifact inventory, and run events.
2. `verify-builder-lifecycle` owns deterministic lifecycle judgment. It reads artifacts/evidence and writes pass/fail/unknown/skipped check results plus overall status.
3. `render-readiness-report` owns presentation. It reads persisted run/check/artifact/evidence data and renders concise chat and dashboard views.

This keeps collection, judgment, and rendering separate without over-splitting every lifecycle phase into a separate skill.

## Skills

### collect-local-evidence
- Tool type: `cli`
- Dependencies: none
- Purpose: collect bounded local evidence from filesystem, OpenClaw/Ruh local tools/APIs, Docker/Podman state, and logs.
- Writes: `qa_runs`, `artifacts`, `evidence_items`, `run_events`
- Guardrails: read-only commands, timeouts, bounded log excerpts, redaction.

### verify-builder-lifecycle
- Tool type: `api`
- Dependencies: `collect-local-evidence`
- Purpose: run deterministic checks for Environment, Think, Plan, Build, Review/Test, and Ship Guardrail.
- Reads: `artifacts`, `evidence_items`
- Writes: `check_results`, `run_events`, `qa_runs`

### render-readiness-report
- Tool type: `api`
- Dependencies: `verify-builder-lifecycle`
- Purpose: render operator-facing report summaries and dashboard-ready data.
- Reads: `qa_runs`, `check_results`, `artifacts`, `evidence_items`, `run_events`
- Writes: `run_events`

## Workflow
1. Manual operator request starts a QA run.
2. `collect-local-evidence` resolves target workspace/session and collects local evidence.
3. `verify-builder-lifecycle` evaluates deterministic checks and computes overall status.
4. `render-readiness-report` presents the summary and dashboard data.

No step runs in parallel because each stage depends on the persisted outputs of the prior stage.

## Data Model
SQLite tables:

- `qa_runs`: one manual QA pass, target workspace/session, timestamps, overall status, freshness anchor.
- `artifacts`: expected lifecycle files, existence, size, modified time, hash, exact-agent match, freshness, parse status.
- `evidence_items`: bounded evidence snippets and structured values from files, session status, CLI, Docker/Podman, logs, APIs, or operator input.
- `check_results`: deterministic lifecycle checks with stage, severity, pass/fail/unknown/skipped status, expected/actual, remediation, and primary evidence.
- `run_events`: chronological activity feed for dashboard and operator review.

Every table includes `id TEXT PRIMARY KEY` and `created_at TEXT NOT NULL`.

## API Endpoints

- `GET /api/builder-lifecycle-sentinel/runs` — list recent QA runs.
- `GET /api/builder-lifecycle-sentinel/runs/:id` — run summary and lifecycle stage counts.
- `GET /api/builder-lifecycle-sentinel/runs/:id/checks` — check results with filtering by stage/status/severity.
- `GET /api/builder-lifecycle-sentinel/runs/:id/artifacts` — artifact inventory.
- `GET /api/builder-lifecycle-sentinel/runs/:id/evidence` — bounded evidence entries.

## Dashboard Pages

### Readiness Overview
Path: `/builder-lifecycle-sentinel/readiness`
- MetricCards: overall status, pass count, fail count, unknown count, critical failures.
- DataTable: lifecycle stage summary.
- ActivityFeed: run activity/evidence timeline.
- BarChart: checks by status and stage.

### Check Details
Path: `/builder-lifecycle-sentinel/checks`
- DataTable of all check results with expected, actual, remediation, evidence reference, stage, severity, and status.

### Artifact Inventory
Path: `/builder-lifecycle-sentinel/artifacts`
- DataTable of expected artifacts with existence, modified time, hash, exact-agent match, freshness, and parse status.

### Evidence Log
Path: `/builder-lifecycle-sentinel/evidence`
- ActivityFeed and DataTable of bounded redacted evidence items.

## Triggers
Manual trigger only:

- Name: Manual Fresh Create-Flow QA Pass
- Skill: `collect-local-evidence`
- Message: Run Builder Lifecycle Sentinel on the latest or specified fresh create-flow using local-only read-only evidence.

No cron, schedule, webhook, or external trigger is planned.

## Environment Variables
No external credentials are required. Optional local configuration:

- `BUILDER_SENTINEL_DEFAULT_WORKSPACE=/root/.openclaw/workspace`
- `BUILDER_SENTINEL_DEFAULT_AGENT_NAME=Builder Lifecycle Sentinel`
- `BUILDER_SENTINEL_MAX_LOG_FILES=20`
- `BUILDER_SENTINEL_MAX_LOG_BYTES=65536`
- `BUILDER_SENTINEL_MAX_LOG_EXCERPT_BYTES=2048`
- `BUILDER_SENTINEL_COMMAND_TIMEOUT_MS=10000`
- `BUILDER_SENTINEL_LOG_TIMEOUT_MS=15000`
- `BUILDER_SENTINEL_REQUIRE_EXPLICIT_SHIP_APPROVAL=true`
- `BUILDER_SENTINEL_ALLOW_EXTERNAL_CALLS=false`

## Guardrails
- Observe/report only.
- Local-only surfaces.
- No external integrations.
- No deploy/ship/push.
- No destructive commands.
- Missing or unavailable evidence becomes `unknown` or `blocked`, never `pass`.
- Logs are bounded and redacted.
- Ship/deploy readiness requires explicit operator approval evidence for the same run.

## Files Written
- `.openclaw/plan/architecture.json`
- `.openclaw/plan/PLAN.md`
