import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  GraduationCap,
  Building2,
  Briefcase,
  BarChart3,
  MapPin,
  Bell,
  Settings,
  ShieldAlert,
  Share2,
  Users
} from 'lucide-react';

const adminNavItems = [
  { label: 'Dashboard', path: '/admin', icon: LayoutDashboard, end: true },
  { label: 'Challenges', path: '/admin/challenges', icon: FolderKanban },
  { label: 'Validation Queue', path: '/admin/validation-queue', icon: CheckSquare, badge: 'SLA' },
  { label: 'Smart Routing', path: '/admin/assignments', icon: Share2 },
  { label: 'Projects', path: '/admin/projects', icon: Briefcase },
  { label: 'Universities', path: '/admin/universities', icon: GraduationCap },
  { label: 'Industry Partners', path: '/admin/industry-partners', icon: Building2 },
  { label: 'User & Roles', path: '/admin/users', icon: Users },
  { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
  { label: 'Geographic Map', path: '/admin/map', icon: MapPin },
  { label: 'Notifications', path: '/admin/notifications', icon: Bell },
  { label: 'Settings & Profile', path: '/admin/settings', icon: Settings }
];

const AdminSidebar = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gov-border flex flex-col justify-between transition-transform duration-200 ease-in-out font-serif ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Navigation Items */}
        <div className="p-4 space-y-1 overflow-y-auto">
          <div className="px-3 py-2 text-[10px] font-bold text-gov-navy uppercase tracking-widest flex items-center justify-between">
            <span>State Admin Console</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>

          <nav className="space-y-1">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 text-xs rounded-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-gov-navy text-white font-semibold shadow-xs'
                        : 'text-gov-text-secondary hover:bg-gov-sand-100 hover:text-gov-navy'
                    }`
                  }
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-xs bg-amber-100 text-amber-900 font-bold">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Security & Oversight Notice */}
        <div className="p-4 border-t border-gov-border bg-gov-sand-50/70">
          <div className="p-3 bg-white border border-gov-border rounded-xs text-[11px] space-y-1">
            <div className="flex items-center space-x-1.5 text-gov-navy font-bold">
              <ShieldAlert className="w-3.5 h-3.5 text-gov-maroon" />
              <span>System Audit Log</span>
            </div>
            <p className="text-gov-text-muted text-[10px] leading-snug">
              Every status validation, rejection, and university allocation is cryptographically logged with administrative timestamp.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
