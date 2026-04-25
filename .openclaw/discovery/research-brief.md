# Research Brief

## Agent
Builder Lifecycle Sentinel

## Mission
A compact local QA agent for the Ruh agent builder. It verifies one fresh create-flow run end to end and produces a trustworthy readiness report. It observes and reports only; it must not block, deploy, ship, mutate external systems, or make changes outside local read-only inspection and local report persistence.

## Scope Decisions From User
- Primary users: Ruh developer team and the agent-builder operator running a manual local QA pass.
- Run mode: manual one-shot per fresh create-flow.
- Behavior: observe and report only; no blocking, deploy, ship, or external-system changes.
- Most important success signal: producing a trustworthy readiness report.
- Available local inspection surfaces: OpenClaw workspace files, Docker CLI/state, local OpenClaw/Ruh APIs, and session/backend/gateway logs.

## Key Findings

### 1. OpenClaw runtime exposes local session metadata
The `session_status` tool reports OpenClaw version, active model id, auth mode, token/cache usage, session key, runtime mode, queue state, reasoning/text settings, and elevated/runtime context. This is the most direct local evidence source for verifying that GPT-5.5 is active in the current builder/session context.

Evidence observed in this environment:
- OpenClaw version: `2026.4.23 (a979721)`
- Model: `openai-codex/gpt-5.5`
- Runtime: `direct`
- Session key: `agent:copilot:dfde47ba-15cf-4a99-8569-74a438853613`

### 2. OpenClaw CLI exposes local inspection commands
`openclaw --help` lists local commands relevant to a lifecycle sentinel:
- `openclaw status` for channel health and recent session recipients.
- `openclaw gateway *` for Gateway inspection and control.
- `openclaw health` and `openclaw doctor` for gateway/channel health.
- `openclaw logs` for Gateway file logs via RPC.
- `openclaw sessions *` for stored conversation sessions.
- `openclaw tasks *` for durable background task state.
- `openclaw models *` for model discovery/configuration.
- `openclaw config *` for non-interactive config get/set/validate.
- `openclaw sandbox *` for sandbox container management.
- `openclaw skills *` for listing and inspecting skills.

These commands should be treated as local-only surfaces. The Sentinel should prefer read-only commands and bounded log reads.

### 3. Workspace artifacts are file-based and directly inspectable
Local workspace inspection found the standard agent workspace root at `/root/.openclaw/workspace` and the architect workspace at `/root/.openclaw/workspace-architect`. The builder-created employee workspace should contain predictable files:
- Root instruction/persona files: `SOUL.md`, `AGENTS.md`, `IDENTITY.md`, likely `USER.md`, `TOOLS.md`, and `HEARTBEAT.md` depending on build output.
- Skill files under `skills/<kebab-name>/SKILL.md`.
- Discovery outputs under `.openclaw/discovery/`, including `research-brief.md`, `PRD.md`, and `TRD.md`.
- Planning outputs expected by this mission: `architecture.json` and `PLAN.md`.
- Workspace state under `.openclaw/workspace-state.json`.

The Sentinel should compare artifact existence and content against the exact target agent name and mission to avoid false positives from stale files.

### 4. ClawHub has overlapping QA/Docker skill patterns
`openclaw skills search qa/test/docker` returned potentially relevant skills:
- `acceptance-test` for validating business requirements and generating acceptance reports.
- `test-runner-codex` for writing/running tests and reporting results.
- `docker-essentials`, `docker-sandbox`, `docker-ctl`, and `docker-manager` for Docker/container inspection patterns.

These are reference patterns only during THINK. The Sentinel should not depend on installing external skills at runtime unless explicitly built later.

### 5. Docker state must be availability-checked, not assumed
In this current agent runtime, `docker` and `podman` commands were not found. Because the user says Docker CLI/state is available as a target surface, the future Sentinel should probe for Docker/Podman availability in its actual deployment context and report:
- `pass` when the container/sandbox evidence exists;
- `fail` when the create-flow requires sandbox attachment and evidence disproves it;
- `unknown` or `blocked` when the local CLI/API needed to verify Docker state is unavailable.

This distinction is critical for a trustworthy readiness report.

## APIs & Services

### Local OpenClaw Tool Surfaces
These are available to an OpenClaw agent through first-class tools or local runtime integration:
- `session_status`: local session status card; used to verify active model and runtime/session context.
- `sessions_list` / `sessions_history`: inspect visible sessions and histories when available; useful for phase marker verification and transcript evidence.
- `read`: inspect workspace files and logs.
- `exec`: run bounded local read-only probes such as `openclaw --help`, `openclaw config get`, `docker ps`, `find`, `grep`, and checksum/stat commands.

### Local OpenClaw CLI
Relevant CLI commands from `openclaw --help`:
- `openclaw status`
- `openclaw gateway *`
- `openclaw health`
- `openclaw doctor`
- `openclaw logs`
- `openclaw sessions *`
- `openclaw tasks *`
- `openclaw models *`
- `openclaw config *`
- `openclaw sandbox *`
- `openclaw skills *`

Auth: local OpenClaw configuration/session auth. No external OAuth or third-party integration is required for this agent's mission.

Rate limits/pricing: no remote API rate limits should be introduced by the Sentinel itself. Local command timeouts and bounded file reads are the relevant limits.

### Docker / Container Runtime
Expected local commands in the target environment:
- `docker ps --format ...`
- `docker inspect <container>`
- `docker logs --tail <N> <container>`
- `docker version`

Fallback probes:
- `podman ps`, `podman inspect`, `podman logs`, `podman version` if Docker is absent and OpenClaw uses Podman.

Auth: local Unix socket/CLI permissions. The Sentinel must report permission errors distinctly from absent containers.

### Workspace Files and Logs
Expected readable inputs:
- `/root/.openclaw/workspace/.openclaw/discovery/research-brief.md`
- `/root/.openclaw/workspace/.openclaw/discovery/PRD.md`
- `/root/.openclaw/workspace/.openclaw/discovery/TRD.md`
- `/root/.openclaw/workspace/architecture.json`
- `/root/.openclaw/workspace/PLAN.md`
- `/root/.openclaw/workspace/SOUL.md`
- `/root/.openclaw/workspace/AGENTS.md`
- `/root/.openclaw/workspace/skills/*/SKILL.md`
- manifest files identified in the build plan, likely `openclaw.plugin.json`, `manifest.json`, or similar depending on builder output.
- `/root/.openclaw/logs/*` and relevant agent/session log directories.

## Existing Skills
Relevant ClawHub search results:
- `acceptance-test`: acceptance criteria validation and report generation.
- `test-runner-codex`: test authoring/execution/reporting.
- `docker-essentials`: Docker command workflows.
- `docker-sandbox`: sandboxed container management.
- `docker-ctl`: inspect containers, logs, and images via Podman.
- `docker-manager`: container management and operational debugging.

## Best Practices for This Agent
- Treat the readiness report as evidence-backed: every pass/fail/unknown must cite the source path, command, session key, log excerpt, or timestamp used.
- Use tri-state results: `pass`, `fail`, and `unknown`/`blocked`; never convert missing evidence into a pass.
- Avoid mutation by default: file reads, stat/checksum, bounded grep, local status calls, and local command probes only.
- Validate exact-agent specificity: PRD/TRD/PLAN/Build files must mention `Builder Lifecycle Sentinel` and the local QA mission, not just any agent.
- Detect stale artifacts: compare modification times, run/session ids, and phase markers where available.
- Bound all logs and command probes with timeouts and tail limits to keep the agent compact and deterministic.
- Separate readiness dimensions: environment, Think, Plan, Build, Review/Test truthfulness, and ship guardrail.
- Require explicit operator approval for any ship/deploy path; in THINK/PLAN/BUILD/TEST readiness, shipping must be reported as not approved unless an operator approval artifact exists.

## Risks & Considerations
- Docker CLI may be unavailable in some agent runtimes even if available on the host. The Sentinel should support both host/node execution where allowed and report unavailable evidence explicitly.
- CLI commands may hang if the Gateway is down or waiting on RPC; all probes need timeouts.
- Phase outputs can exist from a prior run. The Sentinel must look for freshness evidence, exact mission text, and session/run correlation.
- Logs may be large or privacy-sensitive; report only minimal excerpts and avoid dumping full logs.
- Model verification can be ambiguous if the builder uses multiple sessions. The Sentinel should verify the relevant create-flow session, not just the Sentinel's own runtime.
- Manifest filename may vary by implementation; the Plan/TRD should define exact acceptable manifest candidates and evidence rules.
