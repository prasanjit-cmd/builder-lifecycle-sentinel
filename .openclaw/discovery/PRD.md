# Product Requirements Document

## Product Name
Builder Lifecycle Sentinel

## Problem Statement
The Ruh agent builder create-flow can appear successful while silently missing critical lifecycle evidence: sandbox attachment may not be proven, the wrong model may be active, Think may write generic or stale PRD/TRD files, Plan may omit `architecture.json` or `PLAN.md`, Build may miss required workspace files, and Review/Test readiness may be overstated. The Ruh developer team and builder operator need a compact local QA agent that performs one manual, evidence-backed pass over a fresh create-flow and produces a trustworthy readiness report without mutating external systems or blocking the run.

## Target Users

### Primary Users
- Ruh developer team members validating the builder lifecycle during development.
- Agent-builder operators running a manual local QA pass after a fresh create-flow.

### User Context
The user has just run or is about to run one fresh agent-builder create-flow for `Builder Lifecycle Sentinel`. They need a local QA pass that answers: did the builder actually produce the expected lifecycle artifacts for this exact agent, and is the run truthfully ready for Review/Test without claiming ship/deploy readiness prematurely?

## Goals
- Produce a trustworthy readiness report for one fresh create-flow.
- Verify local evidence for environment, Think, Plan, Build, and Review/Test readiness.
- Distinguish pass, fail, and unknown/blocked states with evidence.
- Stay compact, local-only, and observe/report-only.

## Non-Goals
- Do not build, edit, repair, deploy, ship, or block anything.
- Do not call external APIs or integrations.
- Do not run destructive Docker/OpenClaw commands.
- Do not approve shipping or infer operator approval.
- Do not treat stale files from older runs as valid evidence for the fresh create-flow.

## Core Capabilities

1. **Run one manual lifecycle QA pass**
   - Accept an operator command to inspect the current or specified create-flow workspace/session.
   - Execute bounded local probes only.
   - Produce one report per run.

2. **Verify environment readiness evidence**
   - Confirm sandbox/container attachment evidence from Docker/Podman/OpenClaw sandbox state where available.
   - Confirm GPT-5.5 is active for the relevant builder/create-flow session using session/runtime metadata.
   - Report Docker or model evidence as `unknown` when the local source cannot be inspected.

3. **Verify Think phase artifacts**
   - Check `.openclaw/discovery/research-brief.md`, `PRD.md`, and `TRD.md` exist for the target fresh run.
   - Confirm PRD/TRD content is specific to `Builder Lifecycle Sentinel` and includes the local QA mission.
   - Detect generic boilerplate, wrong-agent names, or stale timestamps/content.

4. **Verify Plan phase artifacts**
   - Check `architecture.json` and `PLAN.md` exist.
   - Confirm the plan includes local-only inspection, manual one-shot behavior, observe/report-only guardrails, SQLite persistence, dashboard/reporting surfaces, and no external integrations.
   - Validate `architecture.json` is parseable JSON and references expected skills/workflows/data schema for this Sentinel.

5. **Verify Build phase artifacts**
   - Check expected files exist: `SOUL.md`, `AGENTS.md`, `IDENTITY.md`, relevant `skills/<kebab-name>/SKILL.md`, and manifest files defined by the plan/build output.
   - Confirm built content reflects the Sentinel mission and guardrails.
   - Verify skill frontmatter exists and no placeholder/TODO content remains in critical files.

6. **Verify Review/Test readiness truthfulness**
   - Inspect phase outputs, logs, and artifacts to determine whether Review/Test readiness claims match evidence.
   - Explicitly flag any claim that the agent is ready when required artifacts or checks are missing.
   - Confirm ship/deploy status is not marked complete unless explicit operator approval evidence exists.

7. **Produce an evidence-backed readiness report**
   - Summarize overall status: `ready`, `not_ready`, or `blocked_unknown`.
   - Break down results by lifecycle stage and check.
   - Include evidence references: file path, command/source, timestamp, session id, short log excerpt, and reason.

## User Flows

### Flow 1: Manual One-Shot QA Pass
1. Operator runs Builder Lifecycle Sentinel after one fresh create-flow.
2. Sentinel asks for or infers the target workspace path and relevant session/run identifier.
3. Sentinel collects local evidence from workspace files, OpenClaw/Ruh local APIs, Docker state, and logs.
4. Sentinel evaluates lifecycle checks for Environment, Think, Plan, Build, Review/Test, and Ship Guardrail.
5. Sentinel writes a readiness report to local storage and presents the summary in chat/dashboard.
6. Operator reviews failures/unknowns and decides what to fix manually.

### Flow 2: Investigate a Failed Readiness Dimension
1. Operator opens the report and sees a failed dimension, such as `Plan: architecture.json missing`.
2. Sentinel shows the failed check, expected evidence, actual evidence, and source path/log excerpt.
3. Operator uses the report to fix the builder manually.
4. Operator reruns Sentinel as a new manual QA pass.

### Flow 3: Verify Ship Guardrail
1. Operator asks whether the create-flow can ship.
2. Sentinel checks for explicit operator approval evidence.
3. If approval is absent, Sentinel reports `ship_not_approved` regardless of other lifecycle readiness.
4. Sentinel does not deploy, push, or mutate any external system.

## Channels & Integrations

### Channels
- OpenClaw chat/control UI for manual invocation and summary response.
- Mission Control dashboard for structured report viewing.

### Local Integrations
- OpenClaw workspace filesystem.
- Local OpenClaw/Ruh APIs or tools exposed to the agent runtime.
- OpenClaw CLI where available and safe to run read-only commands.
- Docker or Podman CLI/state where available.
- Session/backend/gateway logs.

### External Integrations
None. External API calls, cloud services, public repos, and deployment systems are out of scope.

## Data Requirements

### Entities

#### QA Run
- Run id.
- Target agent name: `Builder Lifecycle Sentinel`.
- Target workspace path.
- Target session/run id when available.
- Started/finished timestamps.
- Overall status: `ready`, `not_ready`, `blocked_unknown`.
- Operator-provided notes or target selector.

#### Check Result
- Check id and lifecycle stage.
- Severity: `critical`, `major`, `minor`, `info`.
- Status: `pass`, `fail`, `unknown`, `skipped`.
- Expected evidence.
- Actual evidence summary.
- Source type: `file`, `session_status`, `cli`, `docker`, `log`, `api`.
- Source path/command/session key/log reference.
- Timestamp.
- Remediation hint.

#### Artifact
- Artifact type: `research_brief`, `prd`, `trd`, `architecture_json`, `plan_md`, `soul`, `agents`, `identity`, `skill`, `manifest`, `log`.
- Path.
- Exists boolean.
- Size.
- Modified timestamp.
- Content hash.
- Freshness assessment.
- Exact-agent match assessment.

#### Evidence Item
- Evidence id.
- Associated check id.
- Source type.
- Source locator.
- Short excerpt or structured value.
- Captured timestamp.
- Redaction flag.

### Data Volume
- One manual report per fresh create-flow.
- Typical run: 20-60 check results, 10-30 artifacts, 20-80 evidence items.
- Logs should be bounded to short excerpts and metadata, not stored wholesale.

### Update Frequency
- On demand only, one-shot per fresh create-flow.
- No scheduled polling required.

## Dashboard Requirements

### Page: Readiness Overview
URL path: `/builder-lifecycle-sentinel/readiness`
- Metric cards:
  - Overall status.
  - Passed checks count.
  - Failed checks count.
  - Unknown/blocked checks count.
  - Critical failures count.
- Stage status table:
  - Environment, Think, Plan, Build, Review/Test, Ship Guardrail.
  - Status, critical failures, evidence count, last checked timestamp.
- Activity feed:
  - Chronological local probes and major findings.

### Page: Check Details
URL path: `/builder-lifecycle-sentinel/checks`
- Data table of all check results.
- Filters by status, severity, lifecycle stage, source type.
- Expandable evidence excerpt per check.
- Remediation hints.

### Page: Artifact Inventory
URL path: `/builder-lifecycle-sentinel/artifacts`
- Data table of expected artifacts.
- Columns: type, path, exists, modified time, size, hash, exact-agent match, freshness.
- Visual warning for missing, stale, or wrong-agent files.

### Page: Evidence Log
URL path: `/builder-lifecycle-sentinel/evidence`
- Bounded evidence entries collected during the run.
- Source locator, excerpt, timestamp, redaction flag.
- No full raw log dumps.

## Memory & Context

The agent should remember:
- Prior QA run summaries for comparison.
- Known local workspace paths selected by the operator.
- Recurring failure signatures and remediation hints.
- Operator approval state only when explicitly evidenced for a specific run.

The agent should not remember:
- Secrets from logs or config files.
- Full session transcripts or full backend logs.
- Any external credentials.

## Success Criteria

The Builder Lifecycle Sentinel works when:
- It produces a local readiness report for a fresh create-flow without mutating external systems.
- Every pass/fail/unknown includes evidence or a clear reason evidence was unavailable.
- It correctly verifies GPT-5.5/model state for the relevant session or reports uncertainty.
- It correctly verifies sandbox/container attachment evidence or reports uncertainty.
- It confirms Think artifacts are present and specific to `Builder Lifecycle Sentinel`.
- It confirms Plan artifacts include `architecture.json` and `PLAN.md` and are parseable/specific.
- It confirms Build artifacts include expected SOUL, AGENTS, skill, and manifest files.
- It flags Review/Test readiness claims that are unsupported by evidence.
- It never claims ship/deploy readiness without explicit operator approval.
- It completes in a bounded, compact manual run suitable for local developer use.

## Acceptance Criteria

1. Given a fresh successful create-flow, when the operator runs Sentinel, then the report marks all required lifecycle checks `pass` and includes evidence references.
2. Given a missing `TRD.md`, when Sentinel runs, then Think status is `fail` and the report names the missing path.
3. Given a PRD from a different agent, when Sentinel runs, then Think status is `fail` or `major` because exact-agent specificity failed.
4. Given Docker CLI is unavailable, when Sentinel cannot verify sandbox attachment, then it reports `unknown` or `blocked`, not `pass`.
5. Given the active model is not GPT-5.5 for the target session, when Sentinel runs, then environment status is `fail`.
6. Given `architecture.json` contains invalid JSON, when Sentinel runs, then Plan status is `fail` with parse error evidence.
7. Given Build omits `skills/<kebab-name>/SKILL.md`, when Sentinel runs, then Build status is `fail` with expected path evidence.
8. Given no explicit operator approval exists, when Sentinel evaluates ship status, then Ship Guardrail is `not_approved` and no deploy action is attempted.
