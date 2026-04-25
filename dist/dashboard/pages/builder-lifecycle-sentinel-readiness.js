import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
    if (builderLifecycleSentinelRuns.loading)
        return _jsx("div", { style: pageStyle, children: _jsx(LoadingState, {}) });
    if (builderLifecycleSentinelRuns.error)
        return _jsx("div", { style: pageStyle, children: _jsx(ErrorState, { message: builderLifecycleSentinelRuns.error }) });
    if (!builderLifecycleSentinelRuns.data)
        return _jsx("div", { style: pageStyle, children: _jsx(EmptyState, {}) });
    return (_jsxs("div", { style: pageStyle, children: [_jsx(PageHeader, { title: "Builder Lifecycle Sentinel Readiness", description: "Overview of the latest manual local QA run and lifecycle stage status." }), _jsx("div", { style: gridStyle(3), children: _jsx(MetricCard, { label: "Total", value: Object.values(builderLifecycleSentinelRuns.data?.metrics ?? {}).length }) }), _jsx(DataTable, { columns: Object.keys(builderLifecycleSentinelRuns.data?.items?.[0] ?? {}), rows: builderLifecycleSentinelRuns.data?.items ?? [] }), _jsx(ActivityFeed, { items: [] }), _jsx(BarChart, { data: [], label: "Checks by Status and Stage" })] }));
}
