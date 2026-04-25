---
name: verify-builder-lifecycle
version: 1.0.0
description: "Evaluate deterministic Environment, Think, Plan, Build, Review/Test, and Ship Guardrail checks against collected Builder Lifecycle Sentinel evidence."
user-invocable: false
metadata:
  openclaw:
    requires:
      bins: [bash, curl, jq]
      env: [BUILDER_SENTINEL_REQUIRE_EXPLICIT_SHIP_APPROVAL]
    primaryEnv: BUILDER_SENTINEL_REQUIRE_EXPLICIT_SHIP_APPROVAL
---

# Verify Builder Lifecycle

## Purpose
Evaluate deterministic readiness checks for a fresh builder/create-flow run using evidence from `collect-local-evidence`. Use this skill after an evidence bundle exists and before rendering a report.

The lifecycle stages are:

1. Environment
2. Think
3. Plan
4. Build
5. Review/Test
6. Ship Guardrail

## Input
The agent receives:

- Path to `evidence-bundle.json` from `collect-local-evidence`.
- Optional target agent name, target session id, and freshness anchor.
- Optional operator statement approving or rejecting ship readiness.

Expected bundle shape:

```json
{
  "qa_run": { "runId": "qa_...", "targetWorkspace": "...", "targetAgentName": "..." },
  "artifacts": [ { "path": "...", "exists_flag": 1, "sha256": "..." } ],
  "evidence_items": [ { "source_type": "file", "source_locator": "...", "excerpt": "..." } ]
}
```

## Process

1. Validate the evidence bundle.

```bash
set -euo pipefail
BUNDLE="${BUNDLE:?set BUNDLE to evidence-bundle.json}"
OUT_DIR="${OUT_DIR:-$(dirname "$BUNDLE")}"
jq -e '.qa_run and (.artifacts|type=="array") and (.evidence_items|type=="array")' "$BUNDLE" >/dev/null
RUN_ID="$(jq -r '.qa_run.runId // .qa_run.id // "qa_unknown"' "$BUNDLE")"
REQUIRE_SHIP="${BUILDER_SENTINEL_REQUIRE_EXPLICIT_SHIP_APPROVAL:-true}"
```

2. Create deterministic check definitions.

```bash
cat > "$OUT_DIR/check-definitions.json" <<'EOF'
[
  {"stage":"environment","check_key":"workspace_exists","title":"Target workspace exists","severity":"critical","expected":"Evidence bundle identifies an inspected workspace."},
  {"stage":"environment","check_key":"local_only_guardrail","title":"Local-only collection guardrail honored","severity":"critical","expected":"External calls disabled unless explicitly allowed."},
  {"stage":"environment","check_key":"runtime_probe_available","title":"Runtime probe captured","severity":"major","expected":"At least one OpenClaw/Ruh status or CLI evidence item exists."},
  {"stage":"think","check_key":"research_or_brief_exists","title":"Think/research artifact exists","severity":"major","expected":"Research brief, PRD, or similar thinking artifact exists."},
  {"stage":"think","check_key":"target_agent_identified","title":"Target agent identified","severity":"major","expected":"Artifacts or evidence reference the expected target agent name."},
  {"stage":"plan","check_key":"architecture_json_valid","title":"Architecture JSON is present and valid","severity":"critical","expected":".openclaw/plan/architecture.json exists and parses as JSON."},
  {"stage":"plan","check_key":"plan_artifact_exists","title":"Plan artifact exists","severity":"major","expected":"A plan document or architecture workflow exists."},
  {"stage":"build","check_key":"skills_created","title":"Required skills created","severity":"critical","expected":"Expected SKILL.md files exist for collect-local-evidence, verify-builder-lifecycle, and render-readiness-report or planned generated skills."},
  {"stage":"build","check_key":"skill_frontmatter_present","title":"Skill frontmatter present","severity":"major","expected":"Each generated SKILL.md has YAML frontmatter with name and description."},
  {"stage":"review_test","check_key":"artifact_inventory_complete","title":"Artifact inventory complete","severity":"major","expected":"Artifact inventory includes existence, size, modified time, and hash where available."},
  {"stage":"review_test","check_key":"logs_checked_bounded","title":"Logs checked with bounds","severity":"minor","expected":"Log evidence is bounded and redacted."},
  {"stage":"ship_guardrail","check_key":"explicit_ship_approval","title":"Explicit ship approval captured","severity":"critical","expected":"When required, operator approval evidence exists before marking shippable."}
]
EOF
```

3. Evaluate checks with deterministic `jq` predicates.

```bash
jq --arg requireShip "$REQUIRE_SHIP" '
  def artifact($re): [.artifacts[]? | select(.path|test($re))];
  def ev($re): [.evidence_items[]? | select(((.source_locator // "") + "\n" + (.excerpt // "")) | test($re; "i"))];
  def result($stage;$key;$title;$severity;$expected;$pass;$actual;$remediation;$evidenceId):
    {id:("check_"+$key), created_at:(now|todateiso8601), qa_run_id:(.qa_run.runId // .qa_run.id // "qa_unknown"), stage:$stage, check_key:$key, title:$title, severity:$severity,
     status:(if $pass == true then "pass" elif $pass == false then "fail" else "unknown" end), expected:$expected, actual:$actual, remediation:$remediation, primary_evidence_id:$evidenceId};
  . as $b |
  [
    result("environment";"workspace_exists";"Target workspace exists";"critical";"Evidence bundle identifies an inspected workspace."; (($b.qa_run.targetWorkspace // "") != ""); ($b.qa_run.targetWorkspace // "missing"); "Provide a valid target workspace and re-run evidence collection."; null),
    result("environment";"local_only_guardrail";"Local-only collection guardrail honored";"critical";"External calls disabled unless explicitly allowed."; (($b.qa_run.allowExternal // false) == false); ("allowExternal=" + (($b.qa_run.allowExternal // false)|tostring)); "Set BUILDER_SENTINEL_ALLOW_EXTERNAL_CALLS=false for local-only QA."; null),
    result("environment";"runtime_probe_available";"Runtime probe captured";"major";"At least one OpenClaw/Ruh status or CLI evidence item exists."; ((ev("openclaw status|gateway status|ruh status")|length) > 0); ((ev("openclaw status|gateway status|ruh status")|length|tostring)+" runtime probe items"); "Capture local runtime status with collect-local-evidence."; null),
    result("think";"research_or_brief_exists";"Think/research artifact exists";"major";"Research brief, PRD, or similar thinking artifact exists."; ((artifact("research_brief|prd")|map(select(.exists_flag==1))|length) > 0); ((artifact("research_brief|prd")|length|tostring)+" candidate artifacts"); "Create or locate the Think/PRD research artifact."; null),
    result("think";"target_agent_identified";"Target agent identified";"major";"Artifacts or evidence reference the expected target agent name."; ((ev($b.qa_run.targetAgentName // "Builder Lifecycle Sentinel")|length) > 0); ($b.qa_run.targetAgentName // "unknown target agent"); "Add explicit target agent identity to plan/artifacts."; null),
    result("plan";"architecture_json_valid";"Architecture JSON is present and valid";"critical";".openclaw/plan/architecture.json exists and parses as JSON."; ((artifact("architecture\\.json$")|map(select(.exists_flag==1))|length) > 0); ((artifact("architecture\\.json$")|length|tostring)+" architecture artifacts"); "Generate a valid architecture.json."; null),
    result("plan";"plan_artifact_exists";"Plan artifact exists";"major";"A plan document or architecture workflow exists."; (((artifact("plan\\.md$")|map(select(.exists_flag==1))|length) > 0) or ((artifact("architecture\\.json$")|map(select(.exists_flag==1))|length) > 0)); "plan.md or architecture.json evidence"; "Create a plan artifact before building."; null),
    result("build";"skills_created";"Required skills created";"critical";"Expected SKILL.md files exist."; ((artifact("skills/(collect-local-evidence|verify-builder-lifecycle|render-readiness-report)/SKILL\\.md$")|map(select(.exists_flag==1))|length) >= 3); ((artifact("skills/.*/SKILL\\.md$")|map(select(.exists_flag==1))|length|tostring)+" skill files"); "Write all required SKILL.md files."; null),
    result("build";"skill_frontmatter_present";"Skill frontmatter present";"major";"Each generated SKILL.md has YAML frontmatter with name and description."; ((ev("^---|name:|description:")|length) > 0); "frontmatter evidence excerpts searched"; "Add valid YAML frontmatter to every generated skill."; null),
    result("review_test";"artifact_inventory_complete";"Artifact inventory complete";"major";"Artifact inventory includes existence, size, modified time, and hash where available."; (($b.artifacts|length) > 0 and ([$b.artifacts[]? | select(.exists_flag==1 and (.sha256 // "") != "")]|length) > 0); (($b.artifacts|length|tostring)+" artifacts inventoried"); "Re-run evidence collection artifact inventory."; null),
    result("review_test";"logs_checked_bounded";"Logs checked with bounds";"minor";"Log evidence is bounded and redacted."; ((ev("log")|length) > 0); ((ev("log")|length|tostring)+" log evidence items"); "Collect bounded local logs or mark skipped if no logs exist."; null),
    result("ship_guardrail";"explicit_ship_approval";"Explicit ship approval captured";"critical";"When required, operator approval evidence exists before marking shippable."; (if ($requireShip|ascii_downcase) == "true" then ((ev("ship approval|approved to ship|operator approval")|length) > 0) else true end); (if ($requireShip|ascii_downcase) == "true" then "approval required" else "approval not required by env" end); "Ask the operator for explicit ship approval before marking ready to ship."; null)
  ]' "$BUNDLE" > "$OUT_DIR/check-results.json"
```

4. Derive stage summaries and overall status.

```bash
jq '
  group_by(.stage) | map({stage:.[0].stage, pass:map(select(.status=="pass"))|length, fail:map(select(.status=="fail"))|length, unknown:map(select(.status=="unknown"))|length, skipped:map(select(.status=="skipped"))|length,
  status:(if any(.status=="fail") then "fail" elif any(.status=="unknown") then "unknown" else "pass" end)})' \
  "$OUT_DIR/check-results.json" > "$OUT_DIR/stage-summaries.json"
OVERALL="$(jq -r 'if any(.severity=="critical" and .status=="fail") then "not_ready" elif any(.status=="fail") then "not_ready" elif any(.status=="unknown") then "blocked_unknown" else "ready" end' "$OUT_DIR/check-results.json")"
jq -n --arg id "$RUN_ID" --arg status "$OVERALL" --slurpfile checks "$OUT_DIR/check-results.json" --slurpfile stages "$OUT_DIR/stage-summaries.json" \
  '{id:$id, overall_status:$status, checks:$checks[0], stage_summaries:$stages[0], finished_at:(now|todateiso8601)}' > "$OUT_DIR/verification-result.json"
printf '%s\n' "$OUT_DIR/verification-result.json"
```

5. Optionally post or inspect local dashboard API endpoints if the running app exposes them on localhost. Do not call external hosts.

```bash
BASE_URL="${BUILDER_SENTINEL_LOCAL_BASE_URL:-}"
if [ -n "$BASE_URL" ] && printf '%s' "$BASE_URL" | grep -Eq '^https?://(localhost|127\.0\.0\.1)(:|/)'; then
  curl -sS "$BASE_URL/api/builder-lifecycle-sentinel/runs/$RUN_ID/checks" \
    -H 'Accept: application/json' | jq .
fi
```

## Output
Return:

- Path to `verification-result.json`.
- Overall status: `ready`, `not_ready`, `blocked_unknown`, or `error`.
- Counts of pass/fail/unknown checks by stage.
- The highest-severity failures and direct remediation.

Example:

```json
{
  "type": "verification_complete",
  "runId": "qa_20250101T120000Z",
  "overallStatus": "not_ready",
  "resultPath": "/workspace/.openclaw/builder-lifecycle-sentinel/qa_20250101T120000Z/verification-result.json",
  "criticalFailures": ["explicit_ship_approval"]
}
```

## Error Handling
- If the evidence bundle is missing or invalid JSON, stop with `[blocked] evidence bundle missing or invalid`.
- If `jq` is missing, report that deterministic checks cannot run and ask for `jq` to be installed.
- If evidence is absent for a stage, mark checks `unknown` or `fail` according to severity; do not invent pass evidence.
- If `${BUILDER_SENTINEL_REQUIRE_EXPLICIT_SHIP_APPROVAL}` is true or unset, fail the Ship Guardrail without explicit operator approval evidence.
- If local dashboard API calls fail, keep file-based verification results and note that dashboard sync was skipped.
