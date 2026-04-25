import 'dotenv/config';
import pg from 'pg';

const { Client } = pg;

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  const qaRunId = 'qa_run_dev_001';
  const evidenceFileId = 'evidence_dev_file_architecture';
  const evidenceCliId = 'evidence_dev_cli_tests';

  try {
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO qa_runs (
        id, target_agent_name, target_workspace, target_session_id, invocation_channel,
        started_at, finished_at, overall_status, summary, created_by, freshness_anchor
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10, $11
      )
      ON CONFLICT (id) DO UPDATE SET
        target_agent_name = EXCLUDED.target_agent_name,
        target_workspace = EXCLUDED.target_workspace,
        target_session_id = EXCLUDED.target_session_id,
        invocation_channel = EXCLUDED.invocation_channel,
        started_at = EXCLUDED.started_at,
        finished_at = EXCLUDED.finished_at,
        overall_status = EXCLUDED.overall_status,
        summary = EXCLUDED.summary,
        created_by = EXCLUDED.created_by,
        freshness_anchor = EXCLUDED.freshness_anchor`,
      [
        qaRunId,
        'Builder Lifecycle Sentinel',
        '/root/.openclaw/workspace',
        'session-dev-2025-04-25',
        'manual',
        '2025-04-25T14:30:00.000Z',
        '2025-04-25T14:35:00.000Z',
        'not_ready',
        'Development seed run found complete planning artifacts, one failing review/test check, and ship approval still missing.',
        'dev-operator',
        'fresh-create-flow-2025-04-25T14:00:00Z',
      ],
    );

    const artifacts = [
      ['artifact_dev_research', 'research_brief', '.openclaw/discovery/research-brief.md', true, 9210, '2025-04-25T14:05:00.000Z', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', true, 'fresh', 'valid', 'Research brief is present and scoped to Builder Lifecycle Sentinel.'],
      ['artifact_dev_prd', 'prd', '.openclaw/discovery/PRD.md', true, 12488, '2025-04-25T14:12:00.000Z', 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', true, 'fresh', 'valid', 'PRD includes manual local QA workflow requirements.'],
      ['artifact_dev_architecture', 'architecture_json', '.openclaw/plan/architecture.json', true, 18355, '2025-04-25T14:20:00.000Z', 'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc', true, 'fresh', 'valid', 'Architecture JSON defines QA runs, checks, artifacts, evidence, and events tables.'],
      ['artifact_dev_ship_log', 'log', 'state/ship-approval.log', false, null, null, null, null, 'unknown', 'not_parsed', 'No explicit ship approval log was found in the development workspace.'],
    ];

    for (const artifact of artifacts) {
      await client.query(
        `INSERT INTO artifacts (
          id, qa_run_id, artifact_type, path, exists_flag, size_bytes, modified_at,
          sha256, exact_agent_match, freshness_status, parse_status, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (id) DO UPDATE SET
          artifact_type = EXCLUDED.artifact_type,
          path = EXCLUDED.path,
          exists_flag = EXCLUDED.exists_flag,
          size_bytes = EXCLUDED.size_bytes,
          modified_at = EXCLUDED.modified_at,
          sha256 = EXCLUDED.sha256,
          exact_agent_match = EXCLUDED.exact_agent_match,
          freshness_status = EXCLUDED.freshness_status,
          parse_status = EXCLUDED.parse_status,
          notes = EXCLUDED.notes`,
        [artifact[0], qaRunId, ...artifact.slice(1)],
      );
    }

    await client.query(
      `INSERT INTO evidence_items (
        id, qa_run_id, source_type, source_locator, captured_at, excerpt,
        structured_value_json, redacted, confidence
      ) VALUES
        ($1, $2, 'file', '.openclaw/plan/architecture.json', $3, $4, $5::jsonb, false, 'high'),
        ($6, $2, 'cli', 'npm test -- --runInBand', $7, $8, $9::jsonb, false, 'medium')
      ON CONFLICT (id) DO UPDATE SET
        source_type = EXCLUDED.source_type,
        source_locator = EXCLUDED.source_locator,
        captured_at = EXCLUDED.captured_at,
        excerpt = EXCLUDED.excerpt,
        structured_value_json = EXCLUDED.structured_value_json,
        redacted = EXCLUDED.redacted,
        confidence = EXCLUDED.confidence`,
      [
        evidenceFileId,
        qaRunId,
        '2025-04-25T14:31:00.000Z',
        'Architecture plan includes data schema and manual QA workflow steps.',
        JSON.stringify({ tables: 5, workflowSteps: 3, source: 'architecture.json' }),
        evidenceCliId,
        '2025-04-25T14:33:00.000Z',
        'Test command exited non-zero because one generated skill fixture was missing.',
        JSON.stringify({ command: 'npm test -- --runInBand', exitCode: 1, durationMs: 4820 }),
      ],
    );

    const checks = [
      ['check_dev_environment_workspace', 'environment', 'workspace_present', 'Workspace is readable', 'critical', 'pass', 'Target workspace can be inspected locally.', '/root/.openclaw/workspace exists and contains OpenClaw planning artifacts.', null, evidenceFileId],
      ['check_dev_plan_architecture', 'plan', 'architecture_schema_present', 'Architecture data schema is present', 'major', 'pass', 'architecture.json contains required QA persistence schema.', 'Five required tables are defined with indexes.', null, evidenceFileId],
      ['check_dev_review_tests', 'review_test', 'tests_pass', 'Automated tests pass', 'critical', 'fail', 'A deterministic test or verification command succeeds.', 'Seed evidence shows the test command exited with code 1.', 'Fix the missing generated skill fixture, then rerun review/test checks.', evidenceCliId],
      ['check_dev_ship_approval', 'ship_guardrail', 'explicit_ship_approval', 'Explicit ship approval is captured', 'critical', 'unknown', 'Operator approval evidence exists before reporting ready-to-ship.', 'No approval log or operator input was found.', 'Ask the operator for explicit ship approval or mark the run not ready.', null],
    ];

    for (const check of checks) {
      await client.query(
        `INSERT INTO check_results (
          id, qa_run_id, stage, check_key, title, severity, status,
          expected, actual, remediation, primary_evidence_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (id) DO UPDATE SET
          stage = EXCLUDED.stage,
          check_key = EXCLUDED.check_key,
          title = EXCLUDED.title,
          severity = EXCLUDED.severity,
          status = EXCLUDED.status,
          expected = EXCLUDED.expected,
          actual = EXCLUDED.actual,
          remediation = EXCLUDED.remediation,
          primary_evidence_id = EXCLUDED.primary_evidence_id`,
        [check[0], qaRunId, ...check.slice(1)],
      );
    }

    const events = [
      ['event_dev_started', '2025-04-25T14:30:00.000Z', 'probe_started', 'Started local-only Builder Lifecycle Sentinel QA run.', { channel: 'manual' }],
      ['event_dev_artifacts', '2025-04-25T14:31:30.000Z', 'probe_complete', 'Collected artifact inventory and bounded evidence excerpts.', { artifactsObserved: 4 }],
      ['event_dev_failed_check', '2025-04-25T14:33:30.000Z', 'check_failed', 'Review/test gate failed and ship approval remained unknown.', { failedChecks: ['tests_pass'], unknownChecks: ['explicit_ship_approval'] }],
      ['event_dev_report', '2025-04-25T14:35:00.000Z', 'report_rendered', 'Rendered not-ready readiness summary for development.', { overallStatus: 'not_ready' }],
    ];

    for (const event of events) {
      await client.query(
        `INSERT INTO run_events (id, qa_run_id, event_at, event_type, message, metadata_json)
        VALUES ($1, $2, $3, $4, $5, $6::jsonb)
        ON CONFLICT (id) DO UPDATE SET
          event_at = EXCLUDED.event_at,
          event_type = EXCLUDED.event_type,
          message = EXCLUDED.message,
          metadata_json = EXCLUDED.metadata_json`,
        [event[0], qaRunId, event[1], event[2], event[3], JSON.stringify(event[4])],
      );
    }

    await client.query('COMMIT');
    console.log(`Seeded development QA run ${qaRunId}`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
