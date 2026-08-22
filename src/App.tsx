import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Booking from './pages/Booking';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Admin from './pages/Admin';
import Landing from './pages/Landing';
import { authClient } from './lib/auth';
import { ThemeProvider } from './lib/theme';
import { Skeleton, StatCardSkeleton } from './components/ui/skeleton';

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
            <Skeleton className="w-80 h-4 rounded-md" />
          </div>
          <div className="space-y-3">
            <Skeleton className="w-full h-16 rounded-2xl" />
            <Skeleton className="w-full h-16 rounded-2xl" />
            <Skeleton className="w-full h-16 rounded-2xl" />
          </div>
        </div>
      );
    }
    return (
      <div className="max-w-7xl mx-auto space-y-5 animate-in fade-in duration-300">
        <Skeleton className="w-full h-24 rounded-2xl" />
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
  return (
    <ThemeProvider defaultTheme="dark" storageKey="aurelian-ui-theme">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Landing />} />
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
    </ThemeProvider>
  );
}
