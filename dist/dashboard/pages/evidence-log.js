import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { pageStyle, LoadingState, ErrorState, EmptyState, PageHeader } from '../components/ui';
import { DataTable } from '../components/DataTable';
import { ActivityFeed } from '../components/ActivityFeed';
import { useBuilderLifecycleSentinelRunsEvidence } from '../hooks/useBuilderLifecycleSentinelRunsEvidence';
export default function EvidenceLogPage() {
    const builderLifecycleSentinelRunsEvidence = useBuilderLifecycleSentinelRunsEvidence();
    if (builderLifecycleSentinelRunsEvidence.loading)
        return _jsx("div", { style: pageStyle, children: _jsx(LoadingState, {}) });
    if (builderLifecycleSentinelRunsEvidence.error)
        return _jsx("div", { style: pageStyle, children: _jsx(ErrorState, { message: builderLifecycleSentinelRunsEvidence.error }) });
    if (!builderLifecycleSentinelRunsEvidence.data)
        return _jsx("div", { style: pageStyle, children: _jsx(EmptyState, {}) });
    return (_jsxs("div", { style: pageStyle, children: [_jsx(PageHeader, { title: "Evidence Log", description: "Bounded redacted local evidence gathered during the QA run." }), _jsx(ActivityFeed, { items: [] }), _jsx(DataTable, { columns: Object.keys(builderLifecycleSentinelRunsEvidence.data?.items?.[0] ?? {}), rows: builderLifecycleSentinelRunsEvidence.data?.items ?? [] })] }));
}
