import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { pageStyle, LoadingState, ErrorState, EmptyState, PageHeader } from '../components/ui';
import { DataTable } from '../components/DataTable';
import { useBuilderLifecycleSentinelRunsChecks } from '../hooks/useBuilderLifecycleSentinelRunsChecks';
export default function CheckDetailsPage() {
    const builderLifecycleSentinelRunsChecks = useBuilderLifecycleSentinelRunsChecks();
    if (builderLifecycleSentinelRunsChecks.loading)
        return _jsx("div", { style: pageStyle, children: _jsx(LoadingState, {}) });
    if (builderLifecycleSentinelRunsChecks.error)
        return _jsx("div", { style: pageStyle, children: _jsx(ErrorState, { message: builderLifecycleSentinelRunsChecks.error }) });
    if (!builderLifecycleSentinelRunsChecks.data)
        return _jsx("div", { style: pageStyle, children: _jsx(EmptyState, {}) });
    return (_jsxs("div", { style: pageStyle, children: [_jsx(PageHeader, { title: "Check Details", description: "Detailed pass/fail/unknown lifecycle checks with remediation and evidence references." }), _jsx(DataTable, { columns: Object.keys(builderLifecycleSentinelRunsChecks.data?.items?.[0] ?? {}), rows: builderLifecycleSentinelRunsChecks.data?.items ?? [] })] }));
}
