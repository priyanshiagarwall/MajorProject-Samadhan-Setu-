import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PORTAL_TITLE, GOVT_NAME } from '../../utils/constants';
import { useAuth } from '../../hooks/useAuth';
import NotificationDropdown from './NotificationDropdown';
import Button from './Button';
import SamadhanSetuLogo from './SamadhanSetuLogo';
import { LogOut, Menu } from 'lucide-react';

const Header = ({ onToggleSidebar, portalSubtitle = 'Citizen Problem-to-Solution Gateway' }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-gov-border sticky top-0 z-40 shadow-xs font-serif">
      {/* Top Delhi Govt Official Strip */}
      <div className="bg-gov-navy text-white text-[11px] py-1 px-4 sm:px-6 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span>{GOVT_NAME} &bull; {PORTAL_TITLE} (समाधान सेतु)</span>
        </div>
        <div className="text-gray-300 text-[10px]">
          National Capital Territory of Delhi
        </div>
      </div>

      {/* Main Header Container */}
      <div className="px-4 sm:px-6 py-3 flex items-center justify-between">
        {/* Left: Mobile Drawer Toggle & Portal Branding */}
        <div className="flex items-center space-x-3">
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="md:hidden p-2 text-gov-navy hover:bg-gov-sand-100 rounded-sm border border-gov-border cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <SamadhanSetuLogo
            size="sm"
            subtitle={portalSubtitle}
            to="/client"
          />
        </div>

        {/* Right: Notifications, User Profile, Logout */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Notifications Icon with Dropdown */}
          <NotificationDropdown />

          {/* User Profile Pill */}
          <Link
            to="/client/profile"
            className="flex items-center space-x-2 p-1.5 rounded-sm hover:bg-gov-sand-50 transition-colors border border-transparent hover:border-gov-border"
            title="View Citizen Profile"
          >
            <img
              src={
                user?.profileImage ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Citizen')}&background=7a1113&color=fff&font-size=0.4`
              }
              alt={user?.name || 'Citizen'}
              className="w-7 h-7 rounded-sm border border-gov-border object-cover"
            />
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-gov-navy leading-tight truncate max-w-[130px]">
                {user?.name || 'Citizen'}
              </div>
              <div className="text-[10px] text-gov-maroon font-semibold">
                {user?.district || 'Delhi Citizen'}
              </div>
            </div>
          </Link>

          {/* Logout Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            icon={LogOut}
            className="text-gov-navy hover:text-gov-maroon"
          >
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
