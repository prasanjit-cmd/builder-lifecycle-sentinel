import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { tokens, cardStyle } from './ui';
export function DataTable({ columns, rows, emptyMessage = 'No data' }) {
    if (!rows.length)
        return _jsx("div", { style: { ...cardStyle, textAlign: 'center', color: tokens.textTertiary, padding: 32 }, children: emptyMessage });
    return (_jsx("div", { style: { ...cardStyle, padding: 0, overflow: 'auto' }, children: _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse', fontSize: 13 }, children: [_jsx("thead", { children: _jsx("tr", { children: columns.map((c) => _jsx("th", { style: { textAlign: 'left', padding: '10px 14px', borderBottom: `1px solid ${tokens.borderDefault}`, fontWeight: 600, color: tokens.textSecondary, background: '#fafafa' }, children: c }, c)) }) }), _jsx("tbody", { children: rows.map((row, i) => (_jsx("tr", { style: { background: i % 2 ? '#fafafa' : 'white' }, children: columns.map((c) => _jsx("td", { style: { padding: '10px 14px', borderBottom: `1px solid ${tokens.borderDefault}`, color: tokens.textPrimary }, children: String(row[c] ?? row[c.toLowerCase()] ?? '-') }, c)) }, i))) })] }) }));
}
export function TableStatus({ status }) {
    const color = status === 'active' ? tokens.success : status === 'error' ? tokens.error : tokens.warning;
    return _jsx("span", { style: { display: 'inline-block', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: color + '18', color }, children: status });
}
