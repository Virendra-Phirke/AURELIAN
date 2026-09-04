import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authClient } from '../lib/auth';
import { Skeleton, StatCardSkeleton } from './ui/skeleton';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  blockAdmin?: boolean;
}

export function ProtectedRoute({
  children,
  adminOnly = false,
  blockAdmin = false,
}: ProtectedRouteProps) {
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
  if (adminOnly && sessionData.user.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;
  if (blockAdmin && sessionData.user.role === 'ADMIN') return <Navigate to="/admin" replace />;

  return <>{children}</>;
}

export default ProtectedRoute;
