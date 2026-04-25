import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { tokens, cardStyle } from './ui';
export function PieChart({ data, label = '' }) {
    if (!data.length)
        return _jsx("div", { style: { ...cardStyle, textAlign: 'center', color: tokens.textTertiary }, children: "No chart data available" });
    const max = Math.max(...data.map(d => d.value), 1);
    return (_jsxs("div", { style: cardStyle, children: [label && _jsx("div", { style: { fontSize: 14, fontWeight: 600, color: tokens.textPrimary, marginBottom: 12 }, children: label }), _jsx("div", { style: { display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }, children: data.map((d, i) => (_jsxs("div", { style: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }, children: [_jsx("div", { style: { width: '100%', background: tokens.primary + '30', borderRadius: 4, height: Math.max(4, (d.value / max) * 100), transition: 'height 0.3s' } }), _jsx("div", { style: { fontSize: 10, color: tokens.textTertiary, textAlign: 'center' }, children: d.label })] }, i))) })] }));
}
