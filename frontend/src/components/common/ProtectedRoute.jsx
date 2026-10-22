import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gov-sand-50 p-4">
        <div className="bg-white border border-gov-border rounded-sm p-8 shadow-gov-card text-center max-w-sm w-full">
          <div className="w-10 h-10 border-3 border-gov-maroon border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-base font-serif font-bold text-gov-navy mb-1">
            Verifying Authentication
          </h3>
          <p className="text-xs font-serif text-gov-text-muted">
            Checking stakeholder session credentials with Delhi state registry...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    let targetRole = '';
    const p = location.pathname;
    if (p.startsWith('/client')) targetRole = 'client';
    else if (p.startsWith('/admin')) targetRole = 'admin';
    else if (p.startsWith('/university')) targetRole = 'university';
    else if (p.startsWith('/faculty')) targetRole = 'faculty';
    else if (p.startsWith('/student')) targetRole = 'student';
    else if (p.startsWith('/industry')) targetRole = 'industry';

    const loginUrl = targetRole ? `/login?role=${targetRole}` : '/login';
    // Redirect unauthenticated visitor to login, preserving intended destination
    return <Navigate to={loginUrl} state={{ from: location }} replace />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
