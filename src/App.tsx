import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import SubdomainHomeResolver from './components/routing/SubdomainHomeResolver';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';
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
import StorefrontPage from './pages/StorefrontPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 1. Dynamic Root Resolver (Subdomain-aware: admin, accounts, pos, staff, ops, stores, root) */}
        <Route path="/" element={<SubdomainHomeResolver />} />

        {/* 2. Public Authentication & Identity Routes (accounts.chandraprakash.codes) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />

        {/* 3. Direct Customer Storefront Route */}
        <Route path="/store/:slug" element={<StorefrontPage />} />

        {/* 4. Protected Merchant Workspace (admin.chandraprakash.codes) */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/pages" element={<Pages />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/appointments" element={<AppointmentsPage />} />
            <Route path="/team" element={<TeamPage />} />
            <Route path="/extensions" element={<ExtensionsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/theme" element={<Navigate to="/editor/design" replace />} />
          </Route>

          {/* 5. Dedicated Cashier POS Portal (pos.chandraprakash.codes) */}
          <Route path="/pos" element={<POSPage />} />

          {/* 6. Native Store Editor */}
          <Route path="/editor/store-brand" element={<Navigate to="/editor/brand" replace />} />
          <Route path="/editor/design-experience" element={<Navigate to="/editor/design" replace />} />
          <Route path="/editor/seo-growth" element={<Navigate to="/editor/brand" replace />} />
          <Route path="/editor" element={<Navigate to="/editor/pages" replace />} />
          <Route path="/editor/:tab" element={<EditorLayout />} />
        </Route>

        {/* 7. Fallback: Re-evaluates via SubdomainHomeResolver */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
