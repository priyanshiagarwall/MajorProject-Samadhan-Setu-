import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { PORTAL_TITLE, GOVT_NAME, NAV_LINKS } from '../../utils/constants';
import { useAuth } from '../../hooks/useAuth';
import Button from './Button';
import Badge from './Badge';
import SamadhanSetuLogo from './SamadhanSetuLogo';
import { Menu, X, User, LogOut, ShieldCheck, ChevronDown } from 'lucide-react';

const roleDashboardMap = {
  CLIENT: '/client',
  ADMIN: '/admin',
  UNIVERSITY: '/university',
  INDUSTRY: '/industry',
  STUDENT: '/student'
};

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const userRole = (user?.role || '').toUpperCase();
  const targetDashboard = roleDashboardMap[userRole] || '/client';

  return (
    <header className="w-full bg-white border-b border-gov-border sticky top-0 z-50">
      {/* Top Government Service Banner */}
      <div className="bg-gov-navy text-white text-xs py-1.5 px-4 sm:px-8 border-b border-gov-navy-dark">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="tracking-wide">{GOVT_NAME}</span>
            <span className="hidden sm:inline text-gov-navy-border">|</span>
            <span className="hidden sm:inline text-gray-300">Public Sector Innovation Initiative</span>
          </div>
          <div className="flex items-center space-x-4 text-gray-300">
            <span className="hidden md:inline">Language: English / हिन्दी</span>
            <span>National Capital Region</span>
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between">
        {/* Brand / Logo */}
        <SamadhanSetuLogo
          size="md"
          subtitle="Societal Innovation & Research Collaboration Framework"
          to="/select-role"
        />

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-4 xl:space-x-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`text-xs xl:text-sm font-serif font-medium whitespace-nowrap transition-colors hover:text-gov-maroon ${
                location.pathname === link.path
                  ? 'text-gov-maroon border-b-2 border-gov-maroon pb-0.5'
                  : 'text-gov-text-secondary'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Auth Actions */}
        <div className="hidden sm:flex items-center space-x-3">
          {isAuthenticated && user ? (
            <div className="flex items-center space-x-3">
              <div className="text-right border-r border-gov-border pr-3">
                <div className="text-xs font-serif font-bold text-gov-navy truncate max-w-[170px]">
                  {user.name}
                </div>
                <div className="flex items-center justify-end space-x-1">
                  <Badge variant={userRole === 'ADMIN' ? 'navy' : 'maroon'} className="text-[10px] py-0">
                    {userRole}
                  </Badge>
                </div>
              </div>

              <Button
                variant="subtle"
                size="sm"
                onClick={() => navigate(targetDashboard)}
                icon={User}
              >
                Dashboard
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                icon={LogOut}
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Button
                variant="subtle"
                size="sm"
                onClick={() => navigate('/login')}
              >
                Login
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/register')}
              >
                Register
              </Button>
            </div>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden p-2 rounded-sm text-gov-navy hover:bg-gov-sand-100 border border-gov-border"
          aria-label="Toggle navigation menu"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-gov-border bg-white px-4 py-4 space-y-3">
          <nav className="flex flex-col space-y-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`text-sm font-serif px-2 py-1.5 rounded-sm ${
                  location.pathname === link.path
                    ? 'bg-gov-maroon-surface text-gov-maroon font-semibold'
                    : 'text-gov-text-secondary hover:bg-gov-sand-100'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="pt-3 border-t border-gov-border flex flex-col space-y-2">
            {isAuthenticated && user ? (
              <>
                <div className="p-2 bg-gov-sand-50 rounded text-xs font-serif">
                  <div className="font-bold text-gov-navy">{user.name}</div>
                  <div className="text-gov-maroon font-semibold">{userRole} Account</div>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  fullWidth
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    navigate(targetDashboard);
                  }}
                >
                  My Dashboard ({userRole})
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  fullWidth
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogout();
                  }}
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="subtle"
                  size="sm"
                  fullWidth
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    navigate('/login');
                  }}
                >
                  Login
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  fullWidth
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    navigate('/register');
                  }}
                >
                  Register
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
