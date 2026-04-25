import React from 'react';
import { pageStyle, gridStyle, LoadingState, ErrorState, EmptyState, PageHeader } from '../components/ui';
import { DataTable } from '../components/DataTable';
import { useBuilderLifecycleSentinelRunsChecks } from '../hooks/useBuilderLifecycleSentinelRunsChecks';

export default function CheckDetailsPage() {
  const builderLifecycleSentinelRunsChecks = useBuilderLifecycleSentinelRunsChecks();

  if (builderLifecycleSentinelRunsChecks.loading) return <div style={pageStyle}><LoadingState /></div>;
  if (builderLifecycleSentinelRunsChecks.error) return <div style={pageStyle}><ErrorState message={builderLifecycleSentinelRunsChecks.error} /></div>;
  if (!builderLifecycleSentinelRunsChecks.data) return <div style={pageStyle}><EmptyState /></div>;

  return (
    <div style={pageStyle}>
      <PageHeader title="Check Details" description="Detailed pass/fail/unknown lifecycle checks with remediation and evidence references." />
      <DataTable columns={Object.keys(((builderLifecycleSentinelRunsChecks.data as Record<string,unknown>)?.items as Record<string,unknown>[])?.[0] ?? {})} rows={((builderLifecycleSentinelRunsChecks.data as Record<string,unknown>)?.items as Record<string,unknown>[]) ?? []} />
    </div>
  );
}
