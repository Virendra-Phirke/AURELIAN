import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import { ThemeProvider } from './lib/theme';
import { Analytics } from '@vercel/analytics/react';

// Decoupled App Chrome and Route Guards (Zero Better-Auth overhead on landing)
const Layout = lazy(() => import('./components/Layout'));
const ProtectedRoute = lazy(() => import('./components/ProtectedRoute'));

// Lazy-loaded routes for instant initial landing page FCP/LCP
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Booking = lazy(() => import('./pages/Booking'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));
const Admin = lazy(() => import('./pages/Admin'));
const LegalPortal = lazy(() => import('./pages/LegalPortal'));

function RouteLoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-[var(--color-bg)]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin" />
        <span className="text-xs font-sans tracking-widest text-[var(--color-muted-text)] uppercase">
          Aurelian Sanctuary
        </span>
      </div>
    </div>
  );
}

export default function App() {
  useEffect(() => {
    // If loaded inside an OAuth popup window, signal the opener and close immediately
    if (window.opener && window.opener !== window) {
      try {
        window.opener.postMessage({ type: 'oauth_popup_done' }, window.location.origin);
      } catch {}
      // Close popup after a tiny delay to let the message propagate
      setTimeout(() => window.close(), 100);
      return;
    }
  }, []);

  return (
    <ThemeProvider defaultTheme="dark" storageKey="aurelian-ui-theme">
      <Suspense fallback={<RouteLoadingFallback />}>
        <Routes>
          {/* Landing page is completely standalone — zero Layout / Sidebar / Auth bundle overhead */}
          <Route path="/" element={<Landing />} />
          
          {/* Legal Governance Routes */}
          <Route path="privacy-policy" element={<LegalPortal />} />
          <Route path="privacy" element={<LegalPortal />} />
          <Route path="terms" element={<LegalPortal />} />
          <Route path="terms-of-service" element={<LegalPortal />} />
          <Route path="terms-and-conditions" element={<LegalPortal />} />
          <Route path="cancellation-policy" element={<LegalPortal />} />
          
          {/* Auth & Protected App Routes wrapped in Layout */}
          <Route element={<Layout />}>
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="reset-password" element={<ResetPassword />} />
            
            <Route path="booking" element={
              <ProtectedRoute blockAdmin={true}>
                <Booking />
              </ProtectedRoute>
            } />
            
            <Route path="dashboard" element={
              <ProtectedRoute blockAdmin={true}>
                <Dashboard />
              </ProtectedRoute>
            } />
            
            <Route path="settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
            
            <Route path="admin" element={
              <ProtectedRoute adminOnly={true}>
                <Admin />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
      </Suspense>
      <Analytics />
    </ThemeProvider>
  );
}
