export type QaRunStatus = 'running' | 'ready' | 'not_ready' | 'blocked_unknown' | 'error';
export type ArtifactType = 'research_brief' | 'prd' | 'trd' | 'architecture_json' | 'plan_md' | 'soul' | 'agents' | 'identity' | 'skill' | 'manifest' | 'log';
export type FreshnessStatus = 'fresh' | 'stale' | 'unknown' | 'not_applicable';
export type ParseStatus = 'not_parsed' | 'valid' | 'invalid' | 'unknown';
export type EvidenceSourceType = 'file' | 'session_status' | 'sessions_history' | 'cli' | 'docker' | 'podman' | 'log' | 'api' | 'operator_input';
export type EvidenceConfidence = 'high' | 'medium' | 'low';
export type CheckStage = 'environment' | 'think' | 'plan' | 'build' | 'review_test' | 'ship_guardrail';
export type CheckSeverity = 'critical' | 'major' | 'minor' | 'info';
export type CheckStatus = 'pass' | 'fail' | 'unknown' | 'skipped';
export interface QaRun {
    id: string;
    target_agent_name: string;
    target_workspace: string;
    target_session_id: string | null;
    invocation_channel: string;
    started_at: Date;
    finished_at: Date | null;
    overall_status: QaRunStatus;
    summary: string | null;
    created_by: string | null;
    freshness_anchor: string | null;
    created_at: Date;
    updated_at: Date;
}
export interface Artifact {
    id: string;
    qa_run_id: string;
    artifact_type: ArtifactType;
    path: string;
    exists_flag: boolean;
    size_bytes: number | null;
    modified_at: Date | null;
    sha256: string | null;
    exact_agent_match: boolean | null;
    freshness_status: FreshnessStatus | null;
    parse_status: ParseStatus | null;
    notes: string | null;
    created_at: Date;
    updated_at: Date;
}
export interface EvidenceItem {
    id: string;
    qa_run_id: string;
    source_type: EvidenceSourceType;
    source_locator: string;
    captured_at: Date;
    excerpt: string | null;
    structured_value_json: Record<string, unknown> | unknown[] | null;
    redacted: boolean;
    confidence: EvidenceConfidence;
    created_at: Date;
    updated_at: Date;
}
export interface CheckResult {
    id: string;
    qa_run_id: string;
    stage: CheckStage;
    check_key: string;
    title: string;
    severity: CheckSeverity;
    status: CheckStatus;
    expected: string;
    actual: string | null;
    remediation: string | null;
    primary_evidence_id: string | null;
    created_at: Date;
    updated_at: Date;
}
export interface RunEvent {
    id: string;
    qa_run_id: string;
    event_at: Date;
    event_type: string;
    message: string;
    metadata_json: Record<string, unknown> | unknown[] | null;
    created_at: Date;
    updated_at: Date;
}
