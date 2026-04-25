import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layout';
import Page0 from './pages/builder-lifecycle-sentinel-readiness';
import Page1 from './pages/check-details';
import Page2 from './pages/artifact-inventory';
import Page3 from './pages/evidence-log';
function App() {
    return (_jsx(BrowserRouter, { children: _jsx(DashboardLayout, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/builder-lifecycle-sentinel/readiness", element: _jsx(Page0, {}) }), _jsx(Route, { path: "/builder-lifecycle-sentinel/checks", element: _jsx(Page1, {}) }), _jsx(Route, { path: "/builder-lifecycle-sentinel/artifacts", element: _jsx(Page2, {}) }), _jsx(Route, { path: "/builder-lifecycle-sentinel/evidence", element: _jsx(Page3, {}) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/builder-lifecycle-sentinel/readiness", replace: true }) })] }) }) }));
}
createRoot(document.getElementById('root')).render(_jsx(App, {}));
