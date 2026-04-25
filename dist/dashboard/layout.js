import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { tokens } from './components/ui';
const navItems = [
    { href: '/builder-lifecycle-sentinel/readiness', label: 'Builder Lifecycle Sentinel Readiness' },
    { href: '/builder-lifecycle-sentinel/checks', label: 'Check Details' },
    { href: '/builder-lifecycle-sentinel/artifacts', label: 'Artifact Inventory' },
    { href: '/builder-lifecycle-sentinel/evidence', label: 'Evidence Log' },
];
export default function DashboardLayout({ children }) {
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
    return (_jsxs("div", { style: { minHeight: '100vh', display: 'grid', gridTemplateColumns: '240px 1fr', background: tokens.background, fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif' }, children: [_jsxs("aside", { style: { background: tokens.sidebarBg, borderRight: `1px solid ${tokens.borderDefault}`, padding: 20 }, children: [_jsxs("div", { style: { padding: '8px 10px 20px' }, children: [_jsx("div", { style: { width: 44, height: 44, borderRadius: 12, background: tokens.gradient, marginBottom: 14 } }), _jsx("div", { style: { fontSize: 18, fontWeight: 700, color: tokens.textPrimary }, children: "Mission Control" }), _jsx("div", { style: { color: tokens.textSecondary, fontSize: 14, marginTop: 4 }, children: "Agent operations" })] }), _jsx("nav", { style: { display: 'flex', flexDirection: 'column', gap: 6 }, children: navItems.map((item) => {
                            const active = currentPath === item.href || currentPath.startsWith(item.href + '/');
                            return (_jsx("a", { href: item.href, style: { display: 'block', padding: '11px 12px', borderRadius: 10, color: active ? tokens.primary : tokens.textSecondary, background: active ? 'rgba(174,0,208,0.08)' : 'transparent', textDecoration: 'none', fontSize: 14, fontWeight: active ? 600 : 400 }, children: item.label }, item.href));
                        }) })] }), _jsx("main", { style: { padding: 0, overflow: 'auto' }, children: children })] }));
}
