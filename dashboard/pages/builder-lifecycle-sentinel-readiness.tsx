import React from 'react';
import { pageStyle, gridStyle, LoadingState, ErrorState, EmptyState, PageHeader } from '../components/ui';
import { MetricCard } from '../components/MetricCard';
import { DataTable } from '../components/DataTable';
import { ActivityFeed } from '../components/ActivityFeed';
import { BarChart } from '../components/BarChart';
import { useBuilderLifecycleSentinelRuns } from '../hooks/useBuilderLifecycleSentinelRuns';
import { useBuilderLifecycleSentinelRunsEvidence } from '../hooks/useBuilderLifecycleSentinelRunsEvidence';
import { useBuilderLifecycleSentinelRunsChecks } from '../hooks/useBuilderLifecycleSentinelRunsChecks';

export default function BuilderLifecycleSentinelReadinessPage() {
  const builderLifecycleSentinelRuns = useBuilderLifecycleSentinelRuns();
  const builderLifecycleSentinelRunsEvidence = useBuilderLifecycleSentinelRunsEvidence();
  const builderLifecycleSentinelRunsChecks = useBuilderLifecycleSentinelRunsChecks();

  if (builderLifecycleSentinelRuns.loading) return <div style={pageStyle}><LoadingState /></div>;
  if (builderLifecycleSentinelRuns.error) return <div style={pageStyle}><ErrorState message={builderLifecycleSentinelRuns.error} /></div>;
  if (!builderLifecycleSentinelRuns.data) return <div style={pageStyle}><EmptyState /></div>;

  return (
    <div style={pageStyle}>
      <PageHeader title="Builder Lifecycle Sentinel Readiness" description="Overview of the latest manual local QA run and lifecycle stage status." />
      <div style={gridStyle(3)}>
        <MetricCard label="Total" value={Object.values((builderLifecycleSentinelRuns.data as Record<string,unknown>)?.metrics ?? {}).length} />
      </div>
      <DataTable columns={Object.keys(((builderLifecycleSentinelRuns.data as Record<string,unknown>)?.items as Record<string,unknown>[])?.[0] ?? {})} rows={((builderLifecycleSentinelRuns.data as Record<string,unknown>)?.items as Record<string,unknown>[]) ?? []} />
      <ActivityFeed items={[]} />
      <BarChart data={[]} label="Checks by Status and Stage" />
    </div>
  );
}
