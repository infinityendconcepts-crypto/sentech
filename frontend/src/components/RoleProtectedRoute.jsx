import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ShieldOff } from 'lucide-react';

/**
 * RoleProtectedRoute - Wraps routes that require a specific role.
 * @prop {string} requiredRole - "admin" | "student" (defaults to any authenticated)
 * @prop {string} redirectTo   - where to redirect on failure (default: /dashboard)
 */
const RoleProtectedRoute = ({ requiredRole = 'admin', redirectTo = '/dashboard' }) => {
  const { user, loading, isAdmin, isHead } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (requiredRole === 'admin' && !isAdmin && !isHead) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
          <ShieldOff className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Access Denied</h2>
        <p className="text-slate-500 text-sm max-w-sm text-center">
          You don't have permission to view this page. Contact your administrator if you believe this is an error.
        </p>
        <a href="/dashboard" className="mt-2 text-primary underline text-sm">Go to Dashboard</a>
      </div>
    );
  }

  return <Outlet />;
};

export default RoleProtectedRoute;
