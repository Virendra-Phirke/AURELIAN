import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Booking from './pages/Booking';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Admin from './pages/Admin';
import { authClient } from './lib/auth';
import { ThemeProvider } from './lib/theme';

function ProtectedRoute({ children, adminOnly = false, blockAdmin = false }: { children: React.ReactNode, adminOnly?: boolean, blockAdmin?: boolean }) {
  const { data, isPending } = authClient.useSession();
  const sessionData = data as any;
  
  if (isPending) return <div className="p-8 text-center text-[var(--color-secondary-text)]">Loading...</div>;
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
          <Route index element={<Navigate to="/booking" replace />} />
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
