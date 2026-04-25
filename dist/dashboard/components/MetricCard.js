import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { tokens, cardStyle } from './ui';
export function MetricCard({ label, value, trend }) {
    return (_jsxs("div", { style: { ...cardStyle, borderLeft: `4px solid ${tokens.primary}`, display: 'flex', flexDirection: 'column', gap: 4 }, children: [_jsx("div", { style: { fontSize: 28, fontWeight: 700, color: tokens.textPrimary }, children: value }), _jsx("div", { style: { fontSize: 13, color: tokens.textSecondary }, children: label }), trend && _jsx("div", { style: { fontSize: 12, color: tokens.textTertiary }, children: trend })] }));
}
