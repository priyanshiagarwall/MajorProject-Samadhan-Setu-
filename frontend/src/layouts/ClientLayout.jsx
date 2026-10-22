import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import Footer from '../components/common/Footer';
import { Home, ChevronRight, ArrowLeft } from 'lucide-react';

const ClientLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const getBreadcrumbTitle = () => {
    const path = location.pathname;
    if (path === '/client') return 'Overview';
    if (path.startsWith('/client/challenges/') && path !== '/client/challenges') return 'Challenge Detail';
    if (path === '/client/challenges') return 'My Challenges';
    if (path === '/client/submit') return 'Submit a Challenge';
    if (path === '/client/saved') return 'Saved Challenges';
    if (path === '/client/notifications') return 'Notifications';
    if (path === '/client/profile') return 'Profile';
    if (path === '/client/help') return 'Help & Support';
    return 'Citizen Portal';
  };

  return (
    <div className="min-h-screen flex flex-col bg-gov-sand-50 text-gov-text-primary font-serif">
      <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      {/* Sub-header Breadcrumb Strip */}
      <div className="bg-white border-b border-gov-border px-4 sm:px-6 py-2.5 flex items-center justify-between text-xs">
        <nav className="flex items-center space-x-2 text-gov-text-muted">
          <Link to="/select-role" className="hover:text-gov-maroon flex items-center">
            <Home className="w-3.5 h-3.5 mr-1" />
            Portal
          </Link>
          <ChevronRight className="w-3 h-3 text-gray-400" />
          <Link to="/client" className="hover:text-gov-maroon font-medium">
            Citizen Dashboard
          </Link>
          <ChevronRight className="w-3 h-3 text-gray-400" />
          <span className="text-gov-maroon font-semibold">{getBreadcrumbTitle()}</span>
        </nav>

        <Link
          to="/select-role"
          className="text-gov-maroon hover:underline flex items-center text-[11px] font-semibold"
        >
          <ArrowLeft className="w-3 h-3 mr-1" />
          Switch Role
        </Link>
      </div>

      {/* Body: Sidebar + Main Content */}
      <div className="flex-1 flex overflow-hidden max-w-7xl w-full mx-auto">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default ClientLayout;
