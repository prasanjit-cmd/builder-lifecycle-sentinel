import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const tokens = {
    primary: '#ae00d0',
    primaryHover: '#9400b4',
    secondary: '#7b5aff',
    background: '#f9f7f9',
    cardColor: '#ffffff',
    sidebarBg: '#fdfbff',
    textPrimary: '#121212',
    textSecondary: '#4b5563',
    textTertiary: '#9ca3af',
    borderDefault: '#e5e7eb',
    success: '#22c55e',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
    gradient: 'linear-gradient(135deg, #ae00d0, #7b5aff)',
};
export const pageStyle = { padding: 24, maxWidth: 1200 };
export const cardStyle = { background: tokens.cardColor, border: `1px solid ${tokens.borderDefault}`, borderRadius: 12, padding: 20, marginBottom: 16 };
export const headingStyle = { fontSize: 20, fontWeight: 700, color: tokens.textPrimary, marginBottom: 4 };
export const subheadingStyle = { fontSize: 13, color: tokens.textSecondary, marginBottom: 20 };
export const gridStyle = (cols) => ({ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16, marginBottom: 24 });
export function LoadingState({ label = 'Loading...' }) {
    return _jsx("div", { style: { padding: 40, textAlign: 'center', color: tokens.textTertiary }, children: label });
}
export function ErrorState({ message }) {
    return _jsx("div", { style: { ...cardStyle, borderColor: tokens.error, color: tokens.error }, children: message });
}
export function EmptyState({ title = 'No data', description = '' }) {
    return _jsxs("div", { style: { padding: 40, textAlign: 'center' }, children: [_jsx("div", { style: { fontWeight: 600, color: tokens.textSecondary }, children: title }), description && _jsx("div", { style: { fontSize: 13, color: tokens.textTertiary, marginTop: 4 }, children: description })] });
}
export function PageHeader({ title, description }) {
    return _jsxs("div", { style: { marginBottom: 24 }, children: [_jsx("h1", { style: headingStyle, children: title }), description && _jsx("p", { style: subheadingStyle, children: description })] });
}
