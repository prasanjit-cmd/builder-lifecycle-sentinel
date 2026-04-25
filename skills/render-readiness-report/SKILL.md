---
name: render-readiness-report
version: 1.0.0
description: "Render concise chat summaries and dashboard-ready readiness views from Builder Lifecycle Sentinel QA runs, checks, artifacts, and evidence data."
user-invocable: false
metadata:
  openclaw:
    requires:
      bins: [bash, curl, jq]
      env: []
    primaryEnv: ""
---

# Render Readiness Report

## Purpose
Render operator-facing readiness summaries from Builder Lifecycle Sentinel data. Use this after `verify-builder-lifecycle` creates `verification-result.json`, or when a dashboard/API consumer needs normalized run, check, artifact, and evidence views.

This skill focuses on presentation. It does not change the underlying readiness decision.

## Input
The agent receives one or more of:

- Path to `verification-result.json`.
- Path to `evidence-bundle.json`.
- Optional dashboard base URL on localhost.
- Optional report audience: `chat`, `dashboard`, `json`, or `all`.

Expected files:

```text
.openclaw/builder-lifecycle-sentinel/<run-id>/evidence-bundle.json
.openclaw/builder-lifecycle-sentinel/<run-id>/check-results.json
.openclaw/builder-lifecycle-sentinel/<run-id>/stage-summaries.json
.openclaw/builder-lifecycle-sentinel/<run-id>/verification-result.json
```

## Process

1. Resolve input paths and validate JSON.

```bash
set -euo pipefail
RESULT="${RESULT:?set RESULT to verification-result.json}"
OUT_DIR="${OUT_DIR:-$(dirname "$RESULT")}"
BUNDLE="${BUNDLE:-$OUT_DIR/evidence-bundle.json}"
jq -e '.overall_status and (.checks|type=="array")' "$RESULT" >/dev/null
[ -f "$BUNDLE" ] && jq -e '.artifacts and .evidence_items' "$BUNDLE" >/dev/null || true
RUN_ID="$(jq -r '.id // .runId // "qa_unknown"' "$RESULT")"
```

2. Render a concise chat report.

```bash
jq -r '
  def icon($s): if $s=="pass" or $s=="ready" then "✅" elif $s=="fail" or $s=="not_ready" then "❌" elif $s=="blocked_unknown" or $s=="unknown" then "⚠️" else "•" end;
  . as $r |
  "Builder Lifecycle Sentinel: " + (icon($r.overall_status)) + " " + ($r.overall_status|ascii_upcase) + "\n" +
  "Run: " + ($r.id // "unknown") + "\n\n" +
  "Stage summary:" + "\n" +
  ((($r.stage_summaries // []) | map("- " + .stage + ": " + icon(.status) + " " + .status + " (pass " + (.pass|tostring) + ", fail " + (.fail|tostring) + ", unknown " + (.unknown|tostring) + ")") | join("\n")) // "- No stage summaries") +
  "\n\nTop issues:" + "\n" +
  ((([$r.checks[]? | select(.status != "pass") | {sev:.severity, key:.check_key, title:.title, remediation:.remediation}][0:5]) |
    if length == 0 then "- None" else map("- [" + .sev + "] " + .title + " (`" + .key + "`)" + (if .remediation then " — " + .remediation else "" end)) | join("\n") end))
' "$RESULT" > "$OUT_DIR/readiness-chat.md"
cat "$OUT_DIR/readiness-chat.md"
```

3. Render dashboard-ready normalized JSON.

```bash
jq -n \
  --slurpfile result "$RESULT" \
  --slurpfile bundle "$BUNDLE" \
  '($result[0]) as $r | ($bundle[0] // {}) as $b |
  {
    run: {
      id: ($r.id // $r.runId),
      overallStatus: $r.overall_status,
      startedAt: ($b.qa_run.startedAt // null),
      finishedAt: ($r.finished_at // null),
      targetAgentName: ($b.qa_run.targetAgentName // null),
      targetWorkspace: ($b.qa_run.targetWorkspace // null),
      summary: ("Builder Lifecycle Sentinel " + ($r.overall_status // "unknown"))
    },
    stageSummaries: ($r.stage_summaries // []),
    checks: ($r.checks // [] | map({checkKey:.check_key, stage, severity, status, title, expected, actual, remediation, primaryEvidenceId:.primary_evidence_id})),
    artifacts: ($b.artifacts // [] | map({artifactType:.artifact_type, path, exists:(.exists_flag==1), modifiedAt:.modified_at, sha256, exactAgentMatch:.exact_agent_match, freshnessStatus:.freshness_status, parseStatus:.parse_status, notes})),
    evidence: ($b.evidence_items // [] | map({id, sourceType:.source_type, sourceLocator:.source_locator, capturedAt:.captured_at, excerpt, confidence, redacted:(.redacted==1 or .redacted==true)}))
  }' > "$OUT_DIR/readiness-dashboard.json"
```

4. Render API-shaped endpoint files for dashboard development.

```bash
mkdir -p "$OUT_DIR/api/builder-lifecycle-sentinel/runs/$RUN_ID"
jq '{runs:[.run]}' "$OUT_DIR/readiness-dashboard.json" > "$OUT_DIR/api/builder-lifecycle-sentinel/runs/index.json"
jq '{id:.run.id, overallStatus:.run.overallStatus, stageSummaries:.stageSummaries}' "$OUT_DIR/readiness-dashboard.json" > "$OUT_DIR/api/builder-lifecycle-sentinel/runs/$RUN_ID/index.json"
jq '{checks:.checks}' "$OUT_DIR/readiness-dashboard.json" > "$OUT_DIR/api/builder-lifecycle-sentinel/runs/$RUN_ID/checks.json"
jq '{artifacts:.artifacts}' "$OUT_DIR/readiness-dashboard.json" > "$OUT_DIR/api/builder-lifecycle-sentinel/runs/$RUN_ID/artifacts.json"
jq '{evidence:.evidence}' "$OUT_DIR/readiness-dashboard.json" > "$OUT_DIR/api/builder-lifecycle-sentinel/runs/$RUN_ID/evidence.json"
```

5. Optionally compare rendered files with a local dashboard API. Use only localhost URLs.

```bash
BASE_URL="${BUILDER_SENTINEL_LOCAL_BASE_URL:-}"
if [ -n "$BASE_URL" ] && printf '%s' "$BASE_URL" | grep -Eq '^https?://(localhost|127\.0\.0\.1)(:|/)'; then
  curl -sS "$BASE_URL/api/builder-lifecycle-sentinel/runs" -H 'Accept: application/json' | jq . > "$OUT_DIR/live-runs.json" || true
  curl -sS "$BASE_URL/api/builder-lifecycle-sentinel/runs/$RUN_ID/checks" -H 'Accept: application/json' | jq . > "$OUT_DIR/live-checks.json" || true
fi
```

6. Prepare the final user-facing response.

Use the chat report as the visible summary. Attach or cite dashboard JSON paths only when useful.

```bash
printf 'chat=%s\ndashboard=%s\napi_fixture_dir=%s\n' \
  "$OUT_DIR/readiness-chat.md" \
  "$OUT_DIR/readiness-dashboard.json" \
  "$OUT_DIR/api"
```

## Output
Return one of these forms:

### Chat summary
A concise message with:

- Overall status and run id.
- Per-stage pass/fail/unknown counts.
- Top 3-5 blocking issues with remediation.
- Paths to generated report artifacts.

### Dashboard-ready JSON
A JSON object matching:

```json
{
  "run": { "id": "qa_...", "overallStatus": "ready", "summary": "..." },
  "stageSummaries": [],
  "checks": [],
  "artifacts": [],
  "evidence": []
}
```

### Endpoint-shaped fixtures
Files under:

```text
api/builder-lifecycle-sentinel/runs/index.json
api/builder-lifecycle-sentinel/runs/<run-id>/index.json
api/builder-lifecycle-sentinel/runs/<run-id>/checks.json
api/builder-lifecycle-sentinel/runs/<run-id>/artifacts.json
api/builder-lifecycle-sentinel/runs/<run-id>/evidence.json
```

## Error Handling
- If `verification-result.json` is missing or invalid, stop with `[blocked] verification result missing or invalid`.
- If evidence or artifacts are missing, still render the check summary and mark dashboard lists empty.
- If the result contains failures, do not soften them; show the readiness as `not_ready` or `blocked_unknown` exactly as computed.
- If localhost API comparison fails, keep file-based reports and note that live dashboard comparison was skipped.
- If the user requests a very short summary, include only overall status, blockers, and the report path.
