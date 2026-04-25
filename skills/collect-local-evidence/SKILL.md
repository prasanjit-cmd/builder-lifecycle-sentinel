---
name: collect-local-evidence
version: 1.0.0
description: "Collect bounded read-only evidence from workspace files, OpenClaw/Ruh local runtime surfaces, Docker/Podman state, and local logs for Builder Lifecycle Sentinel QA."
user-invocable: false
metadata:
  openclaw:
    requires:
      bins: [bash, curl, jq]
      env: [BUILDER_SENTINEL_DEFAULT_WORKSPACE, BUILDER_SENTINEL_DEFAULT_AGENT_NAME, BUILDER_SENTINEL_MAX_LOG_FILES, BUILDER_SENTINEL_MAX_LOG_BYTES, BUILDER_SENTINEL_MAX_LOG_EXCERPT_BYTES, BUILDER_SENTINEL_COMMAND_TIMEOUT_MS, BUILDER_SENTINEL_LOG_TIMEOUT_MS, BUILDER_SENTINEL_ALLOW_EXTERNAL_CALLS]
    primaryEnv: BUILDER_SENTINEL_DEFAULT_WORKSPACE
---

# Collect Local Evidence

## Purpose
Collect bounded, read-only evidence for a Builder Lifecycle Sentinel QA run. Use this when asked to inspect a fresh create-flow or builder workspace using only local files, local runtime status, container state, and bounded logs.

This skill does not make external network calls unless `${BUILDER_SENTINEL_ALLOW_EXTERNAL_CALLS}` is explicitly set to `true`. For this Sentinel, treat any other value as local-only mode.

## Input
The agent receives any combination of:

- Target workspace path, or default `${BUILDER_SENTINEL_DEFAULT_WORKSPACE}`.
- Expected target agent name, or default `${BUILDER_SENTINEL_DEFAULT_AGENT_NAME}`.
- Optional target session id or freshness anchor from the user.
- Optional prior QA run id to compare against.

Use conservative defaults when env vars are absent:

```bash
: "${BUILDER_SENTINEL_MAX_LOG_FILES:=12}"
: "${BUILDER_SENTINEL_MAX_LOG_BYTES:=200000}"
: "${BUILDER_SENTINEL_MAX_LOG_EXCERPT_BYTES:=12000}"
: "${BUILDER_SENTINEL_COMMAND_TIMEOUT_MS:=10000}"
: "${BUILDER_SENTINEL_LOG_TIMEOUT_MS:=10000}"
```

## Process

1. Establish local-only guardrails and resolve the target workspace.

```bash
set -euo pipefail
ALLOW_EXTERNAL="${BUILDER_SENTINEL_ALLOW_EXTERNAL_CALLS:-false}"
TARGET_WORKSPACE="${TARGET_WORKSPACE:-${BUILDER_SENTINEL_DEFAULT_WORKSPACE:-$PWD}}"
TARGET_AGENT_NAME="${TARGET_AGENT_NAME:-${BUILDER_SENTINEL_DEFAULT_AGENT_NAME:-Builder Lifecycle Sentinel}}"
RUN_ID="${RUN_ID:-qa_$(date -u +%Y%m%dT%H%M%SZ)}"
OUT_DIR="${OUT_DIR:-$TARGET_WORKSPACE/.openclaw/builder-lifecycle-sentinel/$RUN_ID}"
mkdir -p "$OUT_DIR"
printf '{"runId":"%s","targetWorkspace":"%s","targetAgentName":"%s","startedAt":"%s","allowExternal":%s}\n' \
  "$RUN_ID" "$TARGET_WORKSPACE" "$TARGET_AGENT_NAME" "$(date -u +%FT%TZ)" \
  "$( [ "$ALLOW_EXTERNAL" = true ] && echo true || echo false )" > "$OUT_DIR/run.json"
```

2. Inventory expected create-flow artifacts without mutating them.

Inspect likely files such as `.openclaw/plan/research_brief.md`, `.openclaw/plan/prd.md`, `.openclaw/plan/trd.md`, `.openclaw/plan/architecture.json`, `.openclaw/plan/plan.md`, `SOUL.md`, `AGENTS.md`, `IDENTITY.md`, skill manifests, and generated skill files.

```bash
cd "$TARGET_WORKSPACE"
cat > "$OUT_DIR/artifact-paths.txt" <<'EOF'
.openclaw/plan/research_brief.md
.openclaw/plan/prd.md
.openclaw/plan/trd.md
.openclaw/plan/architecture.json
.openclaw/plan/plan.md
SOUL.md
AGENTS.md
IDENTITY.md
USER.md
EOF
find skills -maxdepth 2 -type f -name SKILL.md 2>/dev/null | sort >> "$OUT_DIR/artifact-paths.txt" || true
while IFS= read -r path; do
  if [ -e "$path" ]; then
    sha="$(sha256sum "$path" | awk '{print $1}')"
    size="$(wc -c < "$path" | tr -d ' ')"
    mod="$(date -u -r "$path" +%FT%TZ 2>/dev/null || stat -c %y "$path" 2>/dev/null || true)"
    jq -n --arg path "$path" --arg sha "$sha" --arg mod "$mod" --argjson size "$size" \
      '{artifact_type: (if $path|test("SKILL.md$") then "skill" elif $path|test("architecture.json$") then "architecture_json" elif $path|test("plan.md$") then "plan_md" else ($path|split("/")|last|split(".")|first) end), path:$path, exists_flag:1, size_bytes:$size, modified_at:$mod, sha256:$sha, parse_status:"not_parsed", freshness_status:"unknown"}'
  else
    jq -n --arg path "$path" '{artifact_type:($path|split("/")|last|split(".")|first), path:$path, exists_flag:0, freshness_status:"unknown", parse_status:"not_parsed"}'
  fi
done < "$OUT_DIR/artifact-paths.txt" | jq -s . > "$OUT_DIR/artifacts.json"
```

3. Capture safe excerpts from important files and redact common secrets.

```bash
redact='s/(api[_-]?key|token|secret|password|authorization)[=: ][^[:space:]]+/\1=[REDACTED]/Ig'
: > "$OUT_DIR/evidence.jsonl"
for path in .openclaw/plan/research_brief.md .openclaw/plan/prd.md .openclaw/plan/trd.md .openclaw/plan/architecture.json .openclaw/plan/plan.md SOUL.md AGENTS.md IDENTITY.md; do
  [ -f "$path" ] || continue
  excerpt="$(head -c 8000 "$path" | sed -E "$redact")"
  jq -cn --arg source_type file --arg loc "$path" --arg at "$(date -u +%FT%TZ)" --arg excerpt "$excerpt" \
    '{id:("ev_"+now|tostring), source_type:$source_type, source_locator:$loc, captured_at:$at, excerpt:$excerpt, redacted:($excerpt|test("REDACTED")), confidence:"high"}' >> "$OUT_DIR/evidence.jsonl"
done
```

4. Capture read-only OpenClaw/Ruh runtime surfaces when available.

```bash
for cmd in \
  "openclaw status" \
  "openclaw gateway status" \
  "openclaw sessions list --json" \
  "ruh status"; do
  name="$(printf '%s' "$cmd" | tr ' /' '__')"
  if timeout "$(( ${BUILDER_SENTINEL_COMMAND_TIMEOUT_MS:-10000} / 1000 ))" bash -lc "command -v ${cmd%% *} >/dev/null && $cmd" > "$OUT_DIR/$name.out" 2> "$OUT_DIR/$name.err"; then
    status=pass
  else
    status=unknown
  fi
  out="$(head -c 12000 "$OUT_DIR/$name.out" 2>/dev/null | sed -E "$redact" || true)"
  err="$(head -c 4000 "$OUT_DIR/$name.err" 2>/dev/null | sed -E "$redact" || true)"
  jq -cn --arg loc "$cmd" --arg at "$(date -u +%FT%TZ)" --arg out "$out" --arg err "$err" --arg status "$status" \
    '{source_type:"cli", source_locator:$loc, captured_at:$at, excerpt:($out + (if $err != "" then "\nSTDERR:\n"+$err else "" end)), structured_value_json:({probe_status:$status}|tojson), redacted:(($out+$err)|test("REDACTED")), confidence:(if $status=="pass" then "high" else "low" end)}' >> "$OUT_DIR/evidence.jsonl"
done
```

5. Capture Docker and Podman state using read-only commands.

```bash
for engine in docker podman; do
  command -v "$engine" >/dev/null || continue
  "$engine" ps --format json > "$OUT_DIR/${engine}-ps.jsonl" 2>/dev/null || true
  "$engine" images --format json > "$OUT_DIR/${engine}-images.jsonl" 2>/dev/null || true
  excerpt="$(cat "$OUT_DIR/${engine}-ps.jsonl" "$OUT_DIR/${engine}-images.jsonl" 2>/dev/null | head -c 12000 | sed -E "$redact")"
  jq -cn --arg engine "$engine" --arg at "$(date -u +%FT%TZ)" --arg excerpt "$excerpt" \
    '{source_type:$engine, source_locator:($engine+" ps/images"), captured_at:$at, excerpt:$excerpt, redacted:($excerpt|test("REDACTED")), confidence:"medium"}' >> "$OUT_DIR/evidence.jsonl"
done
```

6. Capture bounded logs only from local paths and only within configured limits.

```bash
max_files="${BUILDER_SENTINEL_MAX_LOG_FILES:-12}"
max_bytes="${BUILDER_SENTINEL_MAX_LOG_BYTES:-200000}"
max_excerpt="${BUILDER_SENTINEL_MAX_LOG_EXCERPT_BYTES:-12000}"
find "$TARGET_WORKSPACE" "$HOME/.openclaw" /tmp -type f \( -name '*.log' -o -name '*openclaw*.txt' -o -name '*ruh*.txt' \) 2>/dev/null |
  sort | head -n "$max_files" > "$OUT_DIR/log-paths.txt"
while IFS= read -r log; do
  [ -f "$log" ] || continue
  excerpt="$(tail -c "$max_bytes" "$log" 2>/dev/null | head -c "$max_excerpt" | sed -E "$redact")"
  jq -cn --arg loc "$log" --arg at "$(date -u +%FT%TZ)" --arg excerpt "$excerpt" \
    '{source_type:"log", source_locator:$loc, captured_at:$at, excerpt:$excerpt, redacted:($excerpt|test("REDACTED")), confidence:"medium"}' >> "$OUT_DIR/evidence.jsonl"
done < "$OUT_DIR/log-paths.txt"
```

7. Produce one evidence bundle for downstream checks.

```bash
jq -s . "$OUT_DIR/evidence.jsonl" > "$OUT_DIR/evidence.json"
jq -n \
  --slurpfile run "$OUT_DIR/run.json" \
  --slurpfile artifacts "$OUT_DIR/artifacts.json" \
  --slurpfile evidence "$OUT_DIR/evidence.json" \
  '{qa_run:$run[0], artifacts:$artifacts[0], evidence_items:$evidence[0]}' > "$OUT_DIR/evidence-bundle.json"
printf '%s\n' "$OUT_DIR/evidence-bundle.json"
```

## Output
Return:

- Path to `evidence-bundle.json`.
- `runId`, target workspace, expected agent name, and local-only/external-call setting.
- Counts of artifacts and evidence items collected.
- Any probes that were unavailable or low confidence.

Example concise response:

```json
{
  "type": "evidence_collected",
  "runId": "qa_20250101T120000Z",
  "bundlePath": "/workspace/.openclaw/builder-lifecycle-sentinel/qa_20250101T120000Z/evidence-bundle.json",
  "artifactCount": 12,
  "evidenceCount": 18,
  "localOnly": true
}
```

## Error Handling
- If the workspace does not exist, stop and report `[blocked] target workspace not found`.
- If required bins are missing, collect what is possible and mark missing probes as low-confidence evidence.
- If `${BUILDER_SENTINEL_ALLOW_EXTERNAL_CALLS}` is not `true`, do not run `curl` against external URLs; local HTTP endpoints on `localhost` are acceptable only if explicitly relevant.
- If a command fails, record stderr as redacted evidence and continue unless it prevents locating the workspace.
- If logs are too large, read only configured byte ranges and say the evidence is bounded.
