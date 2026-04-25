import React from 'react';
import { pageStyle, gridStyle, LoadingState, ErrorState, EmptyState, PageHeader } from '../components/ui';
import { DataTable } from '../components/DataTable';
import { useBuilderLifecycleSentinelRunsArtifacts } from '../hooks/useBuilderLifecycleSentinelRunsArtifacts';

export default function ArtifactInventoryPage() {
  const builderLifecycleSentinelRunsArtifacts = useBuilderLifecycleSentinelRunsArtifacts();

  if (builderLifecycleSentinelRunsArtifacts.loading) return <div style={pageStyle}><LoadingState /></div>;
  if (builderLifecycleSentinelRunsArtifacts.error) return <div style={pageStyle}><ErrorState message={builderLifecycleSentinelRunsArtifacts.error} /></div>;
  if (!builderLifecycleSentinelRunsArtifacts.data) return <div style={pageStyle}><EmptyState /></div>;

  return (
    <div style={pageStyle}>
      <PageHeader title="Artifact Inventory" description="Expected create-flow artifacts with freshness, exact-agent, parse, and existence status." />
      <DataTable columns={Object.keys(((builderLifecycleSentinelRunsArtifacts.data as Record<string,unknown>)?.items as Record<string,unknown>[])?.[0] ?? {})} rows={((builderLifecycleSentinelRunsArtifacts.data as Record<string,unknown>)?.items as Record<string,unknown>[]) ?? []} />
    </div>
  );
}
