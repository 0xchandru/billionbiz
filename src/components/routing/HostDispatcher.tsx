import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { parseSubdomain, getPortalUrl } from '../../utils/subdomain';
import { useAuthStore } from '../../store/authStore';

// Layout & Route Guards
import AppLayout from '../layout/AppLayout';
import ProtectedRoute from '../layout/ProtectedRoute';

// 404 Not Found Page
import NotFoundPage from '../../pages/NotFoundPage';

// Marketing App (chandraprakash.codes / www)
import LandingPage from '../../pages/LandingPage';

// Auth Pages (Dedicated to admin.chandraprakash.codes)
import LoginPage from '../../pages/auth/LoginPage';
import RegisterPage from '../../pages/auth/RegisterPage';
import ForgotPasswordPage from '../../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../../pages/auth/ResetPasswordPage';
import VerifyEmailPage from '../../pages/auth/VerifyEmailPage';

// Merchant Admin App (admin.chandraprakash.codes)
import Dashboard from '../../pages/Dashboard';
import Pages from '../../pages/Pages';
import OrdersPage from '../../pages/Orders';
import ProductsPage from '../../pages/Products';
import AppointmentsPage from '../../pages/Appointments';
import PeoplePage from '../../pages/People';
import POSCountersPage from '../../pages/POSCounters';
import ExtensionsPage from '../../pages/Extensions';
import TeamPage from '../../pages/Team';
import SettingsPage from '../../pages/Settings';
import EditorLayout from '../../pages/editor/EditorLayout';

// Dedicated Subdomain Portals
import StaffPortalPage from '../../pages/StaffPortalPage';
import OpsPortalPage from '../../pages/OpsPortalPage';
import POSPage from '../../pages/POS';
import StorefrontPage from '../../pages/StorefrontPage';

/**
 * Clean silent redirect component for cross-origin domain hops
 */
const ExternalRedirect: React.FC<{ to: string }> = ({ to }) => {
  React.useEffect(() => {
    window.location.replace(to);
  }, [to]);

  return null;
};

/**
 * Strict Page-Based & Host-Dispatched Routing Architecture
 *
 * Rules:
 * - Admin Login & Admin Dashboard are ONLY accessible on the `admin` subdomain.
 * - On local/preview environments, routing is seamless with zero intermediate flashing screens.
 * - Marketing apex redirects /login to admin.chandraprakash.codes/login, and 404s on admin routes.
 * - Storefronts (*.stores) strictly serve store pages; admin login routes 404 here.
 */
export const HostDispatcher: React.FC = () => {
  const subInfo = parseSubdomain();
  const { isAuthenticated } = useAuthStore();

  // 1. PUBLIC MARKETING WEBSITE (chandraprakash.codes / www)
  if (subInfo.type === 'root') {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        {/* Auth entrypoints redirect cleanly to the official admin subdomain */}
        <Route path="/login" element={<ExternalRedirect to={getPortalUrl('admin', '/login')} />} />
        <Route path="/register" element={<ExternalRedirect to={getPortalUrl('admin', '/register')} />} />
        <Route path="/forgot-password" element={<ExternalRedirect to={getPortalUrl('admin', '/forgot-password')} />} />

        {/* Admin workspace routes are strictly NOT accessible on marketing apex -> 404 */}
        <Route
          path="/dashboard"
          element={<NotFoundPage message="Merchant Admin is only available on admin.chandraprakash.codes" />}
        />
        <Route
          path="/orders"
          element={<NotFoundPage message="Merchant Admin is only available on admin.chandraprakash.codes" />}
        />
        <Route
          path="/products"
          element={<NotFoundPage message="Merchant Admin is only available on admin.chandraprakash.codes" />}
        />
        <Route
          path="/appointments"
          element={<NotFoundPage message="Merchant Admin is only available on admin.chandraprakash.codes" />}
        />
        <Route
          path="/people"
          element={<NotFoundPage message="Merchant Admin is only available on admin.chandraprakash.codes" />}
        />
        <Route
          path="/pos-counters"
          element={<NotFoundPage message="Merchant Admin is only available on admin.chandraprakash.codes" />}
        />
        <Route
          path="/extensions"
          element={<NotFoundPage message="Merchant Admin is only available on admin.chandraprakash.codes" />}
        />
        <Route
          path="/team"
          element={<NotFoundPage message="Merchant Admin is only available on admin.chandraprakash.codes" />}
        />
        <Route
          path="/settings"
          element={<NotFoundPage message="Merchant Admin is only available on admin.chandraprakash.codes" />}
        />
        <Route
          path="/editor/*"
          element={<NotFoundPage message="Store Editor is only available on admin.chandraprakash.codes" />}
        />

        {/* Any unknown route on marketing apex */}
        <Route path="*" element={<NotFoundPage message="The page you are looking for does not exist on this site." />} />
      </Routes>
    );
  }

  // 2. CENTRAL ACCOUNTS / IDENTITY -> Redirects cleanly to official Admin login
  if (subInfo.type === 'accounts') {
    return (
      <Routes>
        <Route path="*" element={<ExternalRedirect to={getPortalUrl('admin', '/login')} />} />
      </Routes>
    );
  }

  // 3. DEDICATED CASHIER POS PORTAL (pos.chandraprakash.codes)
  if (subInfo.type === 'pos') {
    return (
      <Routes>
        {/* Admin routes are NOT accessible on POS counter domain */}
        <Route
          path="/dashboard"
          element={<NotFoundPage message="Admin dashboard is not available on the POS portal. Visit admin.chandraprakash.codes." />}
        />
        <Route
          path="/settings"
          element={<NotFoundPage message="Admin settings are not available on the POS portal. Visit admin.chandraprakash.codes." />}
        />
        <Route
          path="*"
          element={
            isAuthenticated ? (
              <POSPage />
            ) : (
              <ExternalRedirect
                to={getPortalUrl('admin', `/login?returnUrl=${encodeURIComponent(window.location.href)}`)}
              />
            )
          }
        />
      </Routes>
    );
  }

  // 4. DEDICATED STAFF WORK PORTAL (staff.chandraprakash.codes)
  if (subInfo.type === 'staff') {
    return (
      <Routes>
        {/* Admin routes are NOT accessible on Staff portal */}
        <Route
          path="/dashboard"
          element={<NotFoundPage message="Admin dashboard is not available on the Staff portal. Visit admin.chandraprakash.codes." />}
        />
        <Route
          path="/settings"
          element={<NotFoundPage message="Admin settings are not available on the Staff portal. Visit admin.chandraprakash.codes." />}
        />
        <Route
          path="*"
          element={
            isAuthenticated ? (
              <StaffPortalPage />
            ) : (
              <ExternalRedirect
                to={getPortalUrl('admin', `/login?returnUrl=${encodeURIComponent(window.location.href)}`)}
              />
            )
          }
        />
      </Routes>
    );
  }

  // 5. RESTRICTED INTERNAL PLATFORM OPERATIONS (ops.chandraprakash.codes)
  if (subInfo.type === 'ops') {
    return (
      <Routes>
        <Route
          path="/dashboard"
          element={<NotFoundPage message="Merchant dashboard is not available on the internal Ops portal." />}
        />
        <Route path="*" element={<OpsPortalPage />} />
      </Routes>
    );
  }

  // 6. NATIVE MERCHANT STOREFRONT RUNTIME (*.stores.chandraprakash.codes)
  if (subInfo.type === 'store') {
    return (
      <Routes>
        {/* Admin login & dashboard are STRICTLY NOT accessible on customer storefronts -> 404 */}
        <Route
          path="/login"
          element={<NotFoundPage message="Admin login is not available on customer storefronts. Please visit admin.chandraprakash.codes." />}
        />
        <Route
          path="/register"
          element={<NotFoundPage message="Store registration is only available on admin.chandraprakash.codes." />}
        />
        <Route
          path="/dashboard"
          element={<NotFoundPage message="Merchant dashboard is only available on admin.chandraprakash.codes." />}
        />
        <Route
          path="/admin"
          element={<NotFoundPage message="Merchant administration is only available on admin.chandraprakash.codes." />}
        />
        <Route
          path="/settings"
          element={<NotFoundPage message="Merchant settings are only available on admin.chandraprakash.codes." />}
        />

        {/* All valid customer storefront traffic */}
        <Route path="*" element={<StorefrontPage slug={subInfo.storeSlug} />} />
      </Routes>
    );
  }

  // 7. MERCHANT ADMIN WORKSPACE (admin.chandraprakash.codes)
  // This is the ONLY subdomain where the Admin Login page and Merchant Admin exist!
  return (
    <Routes>
      {/* Admin Login & Registration Routes (Exclusively on admin subdomain) */}
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
        }
      />
      <Route
        path="/register"
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />
        }
      />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />

      {/* Root of admin: redirect to dashboard if authenticated, else login */}
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Protected Merchant Administration Workspace */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/appointments" element={<AppointmentsPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/people" element={<PeoplePage />} />
          <Route path="/pages" element={<Pages />} />
          <Route path="/pos-counters" element={<POSCountersPage />} />
          <Route path="/extensions" element={<ExtensionsPage />} />
          <Route path="/team" element={<TeamPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/theme" element={<Navigate to="/editor/design" replace />} />
        </Route>

        {/* Native Online Store Editor */}
        <Route path="/editor/store-brand" element={<Navigate to="/editor/brand" replace />} />
        <Route path="/editor/design-experience" element={<Navigate to="/editor/design" replace />} />
        <Route path="/editor/seo-growth" element={<Navigate to="/editor/brand" replace />} />
        <Route path="/editor" element={<Navigate to="/editor/pages" replace />} />
        <Route path="/editor/:tab" element={<EditorLayout />} />

        {/* Embedded POS Preview in Admin */}
        <Route path="/pos" element={<Navigate to="/pos-counters" replace />} />
      </Route>

      {/* Store preview route inside admin */}
      <Route path="/store/:slug" element={<StorefrontPage />} />

      {/* Admin 404 fallback */}
      <Route path="*" element={<NotFoundPage message="The requested page was not found in the Merchant Admin workspace." />} />
    </Routes>
  );
};

export default HostDispatcher;
