import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Pages from './pages/Pages';
import OrdersPage from './pages/Orders';
import ProductsPage from './pages/Products';
import AppointmentsPage from './pages/Appointments';
import POSPage from './pages/POS';
import SettingsPage from './pages/Settings';
import ExtensionsPage from './pages/Extensions';
import TeamPage from './pages/Team';
import EditorLayout from './pages/editor/EditorLayout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="pages" element={<Pages />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="appointments" element={<AppointmentsPage />} />
          <Route path="pos" element={<POSPage />} />
          <Route path="team" element={<TeamPage />} />
          <Route path="extensions" element={<ExtensionsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="theme" element={<Navigate to="/editor/design" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
        <Route path="/theme" element={<Navigate to="/editor/design" replace />} />
        {/* Backward compatibility redirects */}
        <Route path="/editor/store-brand" element={<Navigate to="/editor/brand" replace />} />
        <Route path="/editor/design-experience" element={<Navigate to="/editor/design" replace />} />
        <Route path="/editor/seo-growth" element={<Navigate to="/editor/brand" replace />} />
        {/* Default /editor redirects to /editor/pages */}
        <Route path="/editor" element={<Navigate to="/editor/pages" replace />} />
        <Route path="/editor/:tab" element={<EditorLayout />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
