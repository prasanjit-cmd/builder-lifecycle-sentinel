import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { pageStyle, LoadingState, ErrorState, EmptyState, PageHeader } from '../components/ui';
import { DataTable } from '../components/DataTable';
import { useBuilderLifecycleSentinelRunsArtifacts } from '../hooks/useBuilderLifecycleSentinelRunsArtifacts';
export default function ArtifactInventoryPage() {
    const builderLifecycleSentinelRunsArtifacts = useBuilderLifecycleSentinelRunsArtifacts();
    if (builderLifecycleSentinelRunsArtifacts.loading)
        return _jsx("div", { style: pageStyle, children: _jsx(LoadingState, {}) });
    if (builderLifecycleSentinelRunsArtifacts.error)
        return _jsx("div", { style: pageStyle, children: _jsx(ErrorState, { message: builderLifecycleSentinelRunsArtifacts.error }) });
    if (!builderLifecycleSentinelRunsArtifacts.data)
        return _jsx("div", { style: pageStyle, children: _jsx(EmptyState, {}) });
    return (_jsxs("div", { style: pageStyle, children: [_jsx(PageHeader, { title: "Artifact Inventory", description: "Expected create-flow artifacts with freshness, exact-agent, parse, and existence status." }), _jsx(DataTable, { columns: Object.keys(builderLifecycleSentinelRunsArtifacts.data?.items?.[0] ?? {}), rows: builderLifecycleSentinelRunsArtifacts.data?.items ?? [] })] }));
}
