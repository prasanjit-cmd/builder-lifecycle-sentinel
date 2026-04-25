import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { tokens, cardStyle } from './ui';
export function ActivityFeed({ items, emptyMessage = 'No recent activity yet' }) {
    if (!items.length)
        return _jsx("div", { style: { ...cardStyle, textAlign: 'center', color: tokens.textTertiary }, children: emptyMessage });
    return (_jsx("div", { style: cardStyle, children: items.map((item) => (_jsxs("div", { style: { padding: '10px 0', borderBottom: `1px solid ${tokens.borderDefault}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontWeight: 500, color: tokens.textPrimary, fontSize: 13 }, children: item.title }), item.description && _jsx("div", { style: { fontSize: 12, color: tokens.textTertiary }, children: item.description })] }), item.timestamp && _jsx("div", { style: { fontSize: 11, color: tokens.textTertiary, whiteSpace: 'nowrap' }, children: item.timestamp })] }, item.id))) }));
}
