/**
 * Protected Route Component
 * Route guard that requires authentication
 * Shows loading spinner while checking auth, redirects to login if not authenticated
 * Renders children if authenticated
 */

import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * ProtectedRoute Component
 * Usage: <ProtectedRoute><Dashboard /></ProtectedRoute>
 * Behavior:
 *   - While loading: Show spinner (prevent flash of login page)
 *   - Not authenticated: Redirect to /login
 *   - Authenticated: Render children
 */
export function ProtectedRoute({ children }: ProtectedRouteProps): React.ReactElement {
  const { isAuthenticated, loading } = useAuth();

  // Show loading spinner while checking initial auth state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <div className="inline-flex animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-slate-300 text-sm">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Not authenticated: redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Authenticated: render protected content
  return <>{children}</>;
}