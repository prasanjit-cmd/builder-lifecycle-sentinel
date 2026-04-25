# Builder Lifecycle Sentinel

> Built with [Ruh.ai](https://ruh.ai) — digital employees with a soul.

## Quick Start

```bash
# Clone and install
git clone <repo-url>
cd builder-lifecycle-sentinel
cp .env.example .env  # fill in your credentials
npm install

# Start database and run migrations
docker-compose up -d postgres
npm run db:migrate

# Start the agent
npm run dev
```

## Skills

| Skill | Description |
|-------|-------------|
| Collect Local Evidence | Collect bounded read-only evidence from workspace files, OpenClaw/Ruh local runtime surfaces, Docker/Podman state, and logs. |
| Verify Builder Lifecycle | Evaluate deterministic Environment, Think, Plan, Build, Review/Test, and Ship Guardrail checks against collected evidence. |
| Render Readiness Report | Render concise chat summaries and dashboard-ready readiness views from QA run, check, artifact, and evidence data. |

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `BUILDER_SENTINEL_DEFAULT_WORKSPACE` | Default workspace path to inspect when the operator does not specify one. | No |
| `BUILDER_SENTINEL_DEFAULT_AGENT_NAME` | Expected agent name used for exact-agent checks. | No |
| `BUILDER_SENTINEL_MAX_LOG_FILES` | Maximum number of local log files to inspect per run. | No |
| `BUILDER_SENTINEL_MAX_LOG_BYTES` | Maximum bytes read from any one log file. | No |
| `BUILDER_SENTINEL_MAX_LOG_EXCERPT_BYTES` | Maximum bytes stored in one evidence excerpt. | No |
| `BUILDER_SENTINEL_COMMAND_TIMEOUT_MS` | Timeout for read-only local CLI probes. | No |
| `BUILDER_SENTINEL_LOG_TIMEOUT_MS` | Timeout for bounded log inspection probes. | No |
| `BUILDER_SENTINEL_REQUIRE_EXPLICIT_SHIP_APPROVAL` | When true, ship/deploy readiness is never assumed without operator approval evidence. | No |
| `BUILDER_SENTINEL_ALLOW_EXTERNAL_CALLS` | Must remain false for this local-only Sentinel. | No |

## Architecture

See `.openclaw/plan/PLAN.md` for the full architecture plan.
See `.openclaw/discovery/PRD.md` and `TRD.md` for requirements.
