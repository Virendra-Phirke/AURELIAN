import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import { authClient } from './lib/auth';
import { ThemeProvider } from './lib/theme';
import { Skeleton, StatCardSkeleton } from './components/ui/skeleton';

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

function ProtectedRoute({ children, adminOnly = false, blockAdmin = false }: { children: React.ReactNode, adminOnly?: boolean, blockAdmin?: boolean }) {
  const { data, isPending } = authClient.useSession();
  const sessionData = data as any;
  const location = useLocation();
  
  if (isPending) {
    if (location.pathname.startsWith('/admin')) {
      return (
        <div className="p-4 sm:p-8 space-y-6 animate-in fade-in duration-300 max-w-7xl mx-auto w-full">
          <div className="space-y-2">
            <Skeleton className="w-56 h-7 rounded-md" />
            <Skeleton className="w-40 h-4 rounded-full" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
          <Skeleton className="w-full h-36 rounded-2xl" />
        </div>
      );
    }
    if (location.pathname.startsWith('/booking')) {
      return (
        <div className="max-w-6xl mx-auto space-y-5 animate-in fade-in duration-300">
          <div className="space-y-2">
            <Skeleton className="w-48 h-6 rounded-md" />
            <Skeleton className="w-32 h-4 rounded-full" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Skeleton className="w-full h-24 rounded-2xl" />
            <Skeleton className="w-full h-24 rounded-2xl" />
            <Skeleton className="w-full h-24 rounded-2xl" />
          </div>
          <Skeleton className="w-full h-64 rounded-2xl" />
        </div>
      );
    }
    return (
      <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="w-48 h-6 rounded-md" />
            <Skeleton className="w-32 h-3 rounded-full" />
          </div>
          <Skeleton className="w-24 h-9 rounded-xl" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
        <Skeleton className="w-full h-44 rounded-2xl" />
      </div>
    );
  }
  if (!sessionData?.user) return <Navigate to="/login" replace />;
  if (adminOnly && sessionData.user.role !== "ADMIN") return <Navigate to="/dashboard" replace />;
  if (blockAdmin && sessionData.user.role === "ADMIN") return <Navigate to="/admin" replace />;
  
  return <>{children}</>;
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
          <Route path="/" element={<Layout />}>
            <Route index element={<Landing />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="reset-password" element={<ResetPassword />} />
            
            {/* Legal Governance Routes */}
            <Route path="privacy-policy" element={<LegalPortal />} />
            <Route path="privacy" element={<LegalPortal />} />
            <Route path="terms" element={<LegalPortal />} />
            <Route path="terms-of-service" element={<LegalPortal />} />
            <Route path="terms-and-conditions" element={<LegalPortal />} />
            <Route path="cancellation-policy" element={<LegalPortal />} />
            
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
    </ThemeProvider>
  );
}
