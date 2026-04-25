import React from 'react';
import { pageStyle, gridStyle, LoadingState, ErrorState, EmptyState, PageHeader } from '../components/ui';
import { DataTable } from '../components/DataTable';
import { ActivityFeed } from '../components/ActivityFeed';
import { useBuilderLifecycleSentinelRunsEvidence } from '../hooks/useBuilderLifecycleSentinelRunsEvidence';

export default function EvidenceLogPage() {
  const builderLifecycleSentinelRunsEvidence = useBuilderLifecycleSentinelRunsEvidence();

  if (builderLifecycleSentinelRunsEvidence.loading) return <div style={pageStyle}><LoadingState /></div>;
  if (builderLifecycleSentinelRunsEvidence.error) return <div style={pageStyle}><ErrorState message={builderLifecycleSentinelRunsEvidence.error} /></div>;
  if (!builderLifecycleSentinelRunsEvidence.data) return <div style={pageStyle}><EmptyState /></div>;

  return (
    <div style={pageStyle}>
      <PageHeader title="Evidence Log" description="Bounded redacted local evidence gathered during the QA run." />
      <ActivityFeed items={[]} />
      <DataTable columns={Object.keys(((builderLifecycleSentinelRunsEvidence.data as Record<string,unknown>)?.items as Record<string,unknown>[])?.[0] ?? {})} rows={((builderLifecycleSentinelRunsEvidence.data as Record<string,unknown>)?.items as Record<string,unknown>[]) ?? []} />
    </div>
  );
}
