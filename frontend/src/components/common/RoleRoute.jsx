import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Card from './Card';
import Button from './Button';
import Badge from './Badge';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';

const roleDashboardMap = {
  CLIENT: '/client',
  ADMIN: '/admin',
  UNIVERSITY: '/university',
  INDUSTRY: '/industry',
  STUDENT: '/student'
};

const RoleRoute = ({ allowedRoles = [], children }) => {
  const { user, logout } = useAuth();

  const userRole = (user?.role || '').toUpperCase();
  const normalizedAllowed = allowedRoles.map((r) => r.toUpperCase());

  const hasAccess = normalizedAllowed.includes(userRole);

  if (!hasAccess) {
    const userTargetDashboard = roleDashboardMap[userRole] || '/select-role';

    return (
      <div className="py-16 px-4 max-w-lg mx-auto">
        <Card accent="maroon" className="text-center p-8">
          <div className="w-14 h-14 bg-gov-maroon-surface text-gov-maroon rounded-full flex items-center justify-center mx-auto mb-4 border border-gov-maroon-border">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <Badge variant="maroon" className="mb-2">
            Access Restricted &bull; State Security Policy
          </Badge>

          <h2 className="text-xl font-serif font-bold text-gov-navy mb-2">
            Unauthorized Stakeholder Access
          </h2>

          <p className="text-xs font-serif text-gov-text-secondary leading-relaxed mb-6">
            Your authenticated account role is <strong className="text-gov-maroon uppercase">{userRole}</strong>.
            This portal module is strictly designated for: <strong>{normalizedAllowed.join(' / ')}</strong>.
          </p>

          <div className="pt-4 border-t border-gov-border flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to={userTargetDashboard} className="w-full sm:w-auto">
              <Button variant="primary" size="sm" fullWidth icon={Home}>
                My Dashboard ({userRole})
              </Button>
            </Link>
            <button
              type="button"
              onClick={async () => {
                await logout();
                window.location.href = `/login?role=${normalizedAllowed[0].toLowerCase()}`;
              }}
              className="w-full sm:w-auto px-3 py-1.5 text-xs font-serif font-bold text-gov-maroon hover:bg-gov-sand-100 rounded-sm border border-gov-border cursor-pointer transition-colors"
            >
              Sign In as {normalizedAllowed[0]} &rarr;
            </button>
            <Link to="/select-role" className="w-full sm:w-auto">
              <Button variant="subtle" size="sm" fullWidth icon={ArrowLeft}>
                Switch Portal
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return children ? children : <Outlet />;
};

export default RoleRoute;
