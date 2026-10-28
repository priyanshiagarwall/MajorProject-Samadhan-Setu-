import React, { useState, useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import socketService from '../services/socket';
import Badge from '../components/common/Badge';
import SamadhanSetuLogo from '../components/common/SamadhanSetuLogo';
import {
  LayoutDashboard,
  Target,
  Briefcase,
  Users,
  Flag,
  GraduationCap,
  FileText,
  FlaskConical,
  Building2,
  Award,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Home
} from 'lucide-react';

const SIDEBAR_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/student' },
  { id: 'challenges', label: 'My Challenges', icon: Target, path: '/student/challenges' },
  { id: 'projects', label: 'My Projects', icon: Briefcase, path: '/student/projects' },
  { id: 'team', label: 'My Team', icon: Users, path: '/student/team' },
  { id: 'milestones', label: 'Milestones', icon: Flag, path: '/student/milestones' },
  { id: 'mentor', label: 'Faculty Mentor', icon: GraduationCap, path: '/student/mentor' },
  { id: 'documents', label: 'Documents', icon: FileText, path: '/student/documents' },
  { id: 'prototype', label: 'Prototype & Testing', icon: FlaskConical, path: '/student/prototype' },
  { id: 'industry', label: 'Industry Collaboration', icon: Building2, path: '/student/industry' },
  { id: 'achievements', label: 'Innovation & Achievements', icon: Award, path: '/student/achievements' },
  { id: 'profile', label: 'Profile', icon: User, path: '/student/profile' }
];

const BOTTOM_ITEMS = [
  { id: 'settings', label: 'Settings', icon: Settings, path: '/student/settings' },
  { id: 'logout', label: 'Logout', icon: LogOut, action: 'logout' }
];

const StudentLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!user) return;
    const userId = user._id || user.id;
    socketService.connect(userId);
  }, [user]);

  const handleLogout = async () => {
    await logout();
  };

  const isActive = (path) =>
    path === '/student' ? location.pathname === '/student' : location.pathname.startsWith(path);

  const SidebarContent = ({ isCollapsed }) => (
    <div className="flex flex-col h-full">
      {/* Logo / Brand */}
      <div className="p-3.5 border-b border-gov-border bg-white flex items-center justify-start min-h-[64px]">
        <SamadhanSetuLogo
          size="sm"
          isCollapsed={isCollapsed}
          subtitle="Student Innovator Portal"
          to="/student"
        />
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <li key={item.id}>
                <Link
                  to={item.path}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-sm text-xs font-serif transition-colors ${
                    active
                      ? 'bg-gov-maroon text-white font-semibold'
                      : 'text-gov-navy hover:bg-gov-sand-100'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {!isCollapsed && (
                    <span className="flex-1">
                      {item.label}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Items */}
      <div className="border-t border-gov-border bg-white p-3">
        <ul className="space-y-1">
          {BOTTOM_ITEMS.map((item) => {
            const Icon = item.icon;
            if (item.action === 'logout') {
              return (
                <li key={item.id}>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-sm text-xs font-serif text-gov-maroon hover:bg-gov-sand-100 transition-colors"
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {!isCollapsed && <span>{item.label}</span>}
                  </button>
                </li>
              );
            }
            return (
              <li key={item.id}>
                <Link
                  to={item.path}
                  className="flex items-center space-x-3 px-3 py-2.5 rounded-sm text-xs font-serif text-gov-navy hover:bg-gov-sand-100 transition-colors"
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-gov-sand-50 font-serif">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 bg-white border-r border-gov-border transition-all duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${sidebarCollapsed ? 'w-16' : 'w-64'}`}
      >
        <SidebarContent isCollapsed={sidebarCollapsed} />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gov-border shadow-gov">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3">
            <div className="flex items-center justify-between">
              {/* Left: Mobile Toggle + Breadcrumb */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2 text-gov-navy hover:bg-gov-sand-100 rounded-sm"
                >
                  {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>

                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="hidden lg:block p-2 text-gov-navy hover:bg-gov-sand-100 rounded-sm"
                >
                  <Menu className="w-5 h-5" />
                </button>

                {/* Breadcrumb */}
                <nav className="hidden sm:flex items-center space-x-2 text-xs font-serif text-gov-text-secondary">
                  <Link to="/select-role" className="hover:text-gov-maroon flex items-center">
                    <Home className="w-3.5 h-3.5 mr-1" />
                    Role Selection
                  </Link>
                  <ChevronRight className="w-3 h-3 text-gray-400" />
                  <span className="text-gov-maroon font-semibold">Student Innovator</span>
                </nav>
              </div>

              {/* Right: Profile */}
              <div className="flex items-center space-x-4">
                {/* Profile */}
                <div className="flex items-center space-x-3">
                  <div className="hidden sm:block text-right">
                    <div className="text-xs font-serif font-bold text-gov-navy">
                      {user?.name || 'Student'}
                    </div>
                    <div className="text-[10px] text-gov-text-secondary">Student Innovator</div>
                  </div>
                  <div className="w-9 h-9 bg-gov-maroon-surface text-gov-maroon rounded-sm flex items-center justify-center font-bold text-sm border border-gov-maroon-border">
                    {user?.name?.charAt(0).toUpperCase() || 'S'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default StudentLayout;
