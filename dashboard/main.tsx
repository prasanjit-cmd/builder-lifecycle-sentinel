import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layout';
import Page0 from './pages/builder-lifecycle-sentinel-readiness';
import Page1 from './pages/check-details';
import Page2 from './pages/artifact-inventory';
import Page3 from './pages/evidence-log';

function App() {
  return (
    <BrowserRouter>
      <DashboardLayout>
        <Routes>
          <Route path="/builder-lifecycle-sentinel/readiness" element={<Page0 />} />
          <Route path="/builder-lifecycle-sentinel/checks" element={<Page1 />} />
          <Route path="/builder-lifecycle-sentinel/artifacts" element={<Page2 />} />
          <Route path="/builder-lifecycle-sentinel/evidence" element={<Page3 />} />
          <Route path="*" element={<Navigate to="/builder-lifecycle-sentinel/readiness" replace />} />
        </Routes>
      </DashboardLayout>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
