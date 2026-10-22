import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import { PORTAL_TITLE, ROLES, normalizeRoleKey } from '../utils/constants';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import { SamadhanSetuEmblem } from '../components/common/SamadhanSetuLogo';
import {
  Lock,
  Mail,
  AlertCircle,
  ArrowLeft,
  Key,
  Sparkles,
  Eye,
  EyeOff,
  HelpCircle,
  X,
  Users,
  ShieldCheck,
  GraduationCap,
  BookOpen,
  Lightbulb,
  Building2,
  CheckCircle2,
  LogOut
} from 'lucide-react';

const roleIconMap = {
  client: Users,
  admin: ShieldCheck,
  university: GraduationCap,
  faculty: BookOpen,
  student: Lightbulb,
  industry: Building2
};

const portalDetails = {
  client: {
    id: 'client',
    roleKey: 'CLIENT',
    title: 'Citizen & Civic Reporter Portal',
    badgeText: 'Civic Reporter',
    accentColor: '#7a1113',
    colorVariant: 'maroon',
    description: 'Report civic challenges, submit multimedia evidence, and track municipal grievance resolution.',
    demo: { role: 'CLIENT', label: 'Citizen (Sunita Sharma)', email: 'citizen@delhi.gov.in', pwd: 'Password123' }
  },
  admin: {
    id: 'admin',
    roleKey: 'ADMIN',
    title: 'State Administration & Government Portal',
    badgeText: 'Government Authority',
    accentColor: '#142a45',
    colorVariant: 'navy',
    description: 'Validate public challenges, coordinate universities, allocate municipal grants, and monitor pilot deployments.',
    demo: { role: 'ADMIN', label: 'State Administrator (Dr. Saxena IAS)', email: 'admin@delhi.gov.in', pwd: 'Password123' }
  },
  university: {
    id: 'university',
    roleKey: 'UNIVERSITY',
    title: 'University Dean & Academic Portal',
    badgeText: 'Academic Institution',
    accentColor: '#7a1113',
    colorVariant: 'maroon',
    description: 'Form student-faculty research cohorts, adopt validated challenges, and access public prototyping grants.',
    demo: { role: 'UNIVERSITY', label: 'DTU Dean of Academic Research', email: 'university@dtu.ac.in', pwd: 'Password123' }
  },
  faculty: {
    id: 'faculty',
    roleKey: 'FACULTY',
    title: 'Faculty Mentor & Academic Supervisor Portal',
    badgeText: 'Academic Supervisor',
    accentColor: '#7a1113',
    colorVariant: 'maroon',
    description: 'Supervise multidisciplinary student cohorts, approve project sprint deliverables, and certify state innovation credits.',
    demo: { role: 'FACULTY', label: 'Faculty Lead (Prof. Sharma)', email: 'faculty@dtu.ac.in', pwd: 'Password123' }
  },
  student: {
    id: 'student',
    roleKey: 'STUDENT',
    title: 'Student Innovator & Solution Dev Portal',
    badgeText: 'Solution Provider',
    accentColor: '#b45309',
    colorVariant: 'gold',
    description: 'Develop software and hardware prototypes, collaborate with mentors, and earn official state innovation credits.',
    demo: { role: 'STUDENT', label: 'Student Lead (NSUT Innovator)', email: 'student@nsut.ac.in', pwd: 'Password123' }
  },
  industry: {
    id: 'industry',
    roleKey: 'INDUSTRY',
    title: 'Industry & Ecosystem Partner Portal',
    badgeText: 'Ecosystem Partner',
    accentColor: '#142a45',
    colorVariant: 'navy',
    description: 'Sponsor civic prototypes with CSR grants, provide industrial mentorship, and deploy commercial field pilots.',
    demo: { role: 'INDUSTRY', label: 'Industry Partner (Tata Power)', email: 'industry@tatapower.com', pwd: 'Password123' }
  }
};

const roleRedirectMap = {
  CLIENT: '/client',
  ADMIN: '/admin',
  UNIVERSITY: '/university',
  INDUSTRY: '/industry',
  FACULTY: '/faculty',
  STUDENT: '/student'
};

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAuthenticated, login, logout } = useAuth();

  // Read role from query param or default to client
  const roleQuery = searchParams.get('role');
  const activeRoleKey = normalizeRoleKey(roleQuery || 'client');
  const currentPortal = portalDetails[activeRoleKey] || portalDetails.client;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // When portal changes from tabs, update search params
  const handleSelectPortal = (portalId) => {
    setError('');
    setSearchParams({ role: portalId });
  };

  const handleLoginSuccess = (userRole) => {
    const defaultPath = roleRedirectMap[userRole?.toUpperCase()] || '/student';
    const fromPath = location.state?.from?.pathname;

    // Only honor fromPath if it belongs to this role's workspace
    if (fromPath && fromPath !== '/login' && fromPath.startsWith(defaultPath)) {
      navigate(fromPath, { replace: true });
    } else {
      navigate(defaultPath, { replace: true });
    }
  };

  const handleQuickLogin = async (demoAcc) => {
    setEmail(demoAcc.email);
    setPassword(demoAcc.pwd);
    setError('');
    setLoading(true);

    try {
      const res = await login({
        email: demoAcc.email,
        password: demoAcc.pwd,
        rememberMe: true,
        role: demoAcc.role
      });
      const userRole = res.data?.user?.role || demoAcc.role;
      const targetPath = roleRedirectMap[userRole?.toUpperCase()] || '/student';
      navigate(targetPath, { replace: true });
    } catch (err) {
      setError(err.message || 'Demo authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please provide both registered email and password.');
      return;
    }

    setLoading(true);

    try {
      const res = await login({
        email: email.trim().toLowerCase(),
        password,
        rememberMe,
        role: currentPortal.roleKey
      });
      const userRole = res.data?.user?.role;
      handleLoginSuccess(userRole);
    } catch (err) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const CurrentIcon = roleIconMap[currentPortal.id] || Users;

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto space-y-6">
      {/* Back and Header */}
      <div className="text-center">
        <Link
          to="/select-role"
          className="inline-flex items-center text-xs font-serif text-gov-maroon hover:underline mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Back to All Stakeholder Portals
        </Link>
        <div className="flex justify-center mb-3">
          <SamadhanSetuEmblem size={52} />
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-gov-navy">
          Stakeholder Portal Sign In
        </h2>
        <p className="text-xs font-serif text-gov-text-secondary mt-1">
          {PORTAL_TITLE} (समाधान सेतु) &bull; National & State Innovation Network
        </p>
      </div>

      {/* Stakeholder Portal Selector Tabs */}
      <div className="bg-white border border-gov-border rounded-sm p-2 shadow-gov-card">
        <div className="text-[11px] font-serif font-bold text-gov-navy uppercase tracking-wider mb-2 px-2">
          Select Portal Gateway:
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1.5">
          {Object.values(portalDetails).map((p) => {
            const Icon = roleIconMap[p.id] || Users;
            const isSelected = p.id === currentPortal.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectPortal(p.id)}
                className={`flex flex-col items-center justify-center p-2.5 rounded-sm border text-xs font-serif transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-gov-maroon text-white border-gov-maroon shadow-sm'
                    : 'bg-white hover:bg-gov-sand-50 text-gov-navy border-gov-border hover:border-gov-maroon'
                }`}
              >
                <Icon className={`w-4 h-4 mb-1 ${isSelected ? 'text-white' : 'text-gov-maroon'}`} />
                <span className="font-bold text-[11px] text-center leading-tight">
                  {p.badgeText}
                </span>
                <span className={`text-[9px] mt-0.5 ${isSelected ? 'text-amber-200' : 'text-gov-text-muted'}`}>
                  {p.roleKey}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Already Signed In Alert Banner */}
      {isAuthenticated && user && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-sm text-xs font-serif flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div>
            <div className="font-bold text-amber-900 flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600" />
              Currently Active Session: {user.name}
            </div>
            <div className="text-amber-800 text-[11px] mt-0.5">
              Role: <strong className="uppercase">{user.role}</strong> &bull; {user.email}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(roleRedirectMap[user.role?.toUpperCase()] || '/select-role')}
            >
              Go to My {user.role} Workspace
            </Button>
            <Button
              variant="subtle"
              size="sm"
              icon={LogOut}
              onClick={async () => {
                await logout();
              }}
            >
              Sign Out
            </Button>
          </div>
        </div>
      )}

      {/* 1-Click Quick Demo Sign In Bar */}
      <div className="bg-white border border-gov-border rounded-sm p-4 shadow-gov-card">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center space-x-2 text-xs font-serif text-gov-navy font-bold">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>1-Click Test Login for {currentPortal.badgeText}:</span>
          </div>
          <button
            type="button"
            onClick={() => handleQuickLogin(currentPortal.demo)}
            className="text-xs font-serif font-bold text-white bg-gov-maroon hover:bg-gov-maroon-dark px-3 py-1 rounded-sm shadow-xs cursor-pointer flex items-center"
          >
            Instant Demo Sign In &rarr;
          </button>
        </div>
        <p className="text-[11px] font-serif text-gov-text-secondary">
          Clicking "Instant Demo Sign In" will authenticate as verified demo user{' '}
          <strong className="text-gov-navy">{currentPortal.demo.label}</strong> ({currentPortal.demo.email}) and launch the portal immediately.
        </p>

        {/* Mini tabs for other roles */}
        <div className="mt-3 pt-3 border-t border-gov-border/60">
          <div className="text-[10px] font-serif uppercase tracking-wider text-gov-text-muted mb-1.5">
            Or test another stakeholder identity in 1 click:
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1.5">
            {Object.values(portalDetails).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  handleSelectPortal(p.id);
                  handleQuickLogin(p.demo);
                }}
                className={`p-1.5 text-left rounded-sm border text-[10px] font-serif cursor-pointer transition-all ${
                  p.id === currentPortal.id
                    ? 'border-gov-maroon bg-gov-sand-50 font-bold'
                    : 'border-gov-border hover:border-gov-maroon bg-white'
                }`}
              >
                <div className="truncate text-gov-navy font-semibold">{p.demo.label.split(' ')[0]}</div>
                <div className="text-[9px] text-gov-maroon truncate">{p.roleKey}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Sign-In Card */}
      <Card
        accent={currentPortal.colorVariant === 'navy' ? 'navy' : 'maroon'}
        title={`${currentPortal.title}`}
        subtitle={currentPortal.description}
      >
        {/* Active Portal Header Pill */}
        <div className="mb-4 pb-3 border-b border-gov-border flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div
              className="w-8 h-8 rounded-sm flex items-center justify-center text-white"
              style={{ backgroundColor: currentPortal.accentColor }}
            >
              <CurrentIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-serif font-bold text-gov-navy">
                Authenticating for: {currentPortal.badgeText} Gateway
              </div>
              <div className="text-[10px] font-serif text-gov-text-muted">
                Role Token: <strong className="text-gov-maroon">{currentPortal.roleKey}</strong>
              </div>
            </div>
          </div>
          <Badge variant={currentPortal.colorVariant === 'navy' ? 'navy' : currentPortal.colorVariant === 'gold' ? 'gold' : 'maroon'}>
            {currentPortal.badgeText}
          </Badge>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-serif rounded-sm flex items-start">
            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email input */}
          <div>
            <label className="block text-xs font-serif font-bold text-gov-navy uppercase tracking-wider mb-1">
              Registered Email Address *
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={`e.g., ${currentPortal.demo.email}`}
                className="w-full text-sm font-serif border border-gov-border rounded-sm pl-9 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-gov-maroon"
              />
              <Mail className="w-4 h-4 text-gov-text-muted absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Password input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-serif font-bold text-gov-navy uppercase tracking-wider">
                Account Password *
              </label>
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-xs font-serif text-gov-maroon hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full text-sm font-serif border border-gov-border rounded-sm pl-9 pr-9 py-2 focus:outline-none focus:ring-1 focus:ring-gov-maroon"
              />
              <Lock className="w-4 h-4 text-gov-text-muted absolute left-3 top-2.5" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gov-text-muted hover:text-gov-navy"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember me checkbox */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center space-x-2 text-xs font-serif text-gov-text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="accent-gov-maroon w-4 h-4 rounded-xs"
              />
              <span>Remember my session on this device</span>
            </label>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              fullWidth
              disabled={loading}
            >
              {loading ? 'Authenticating...' : `Sign In to ${currentPortal.badgeText} Portal`}
            </Button>
          </div>
        </form>

        {/* Contextual Register Link */}
        <div className="mt-6 pt-4 border-t border-gov-border flex flex-col sm:flex-row items-center justify-between text-xs font-serif text-gov-text-secondary gap-2">
          <span>New {currentPortal.badgeText} stakeholder?</span>
          <Link
            to={`/register?role=${currentPortal.id}`}
            className="text-gov-maroon font-bold hover:underline flex items-center"
          >
            Register for {currentPortal.badgeText} Portal &rarr;
          </Link>
        </div>
      </Card>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gov-border rounded-sm max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-gov-border pb-2">
              <h3 className="text-base font-serif font-bold text-gov-navy flex items-center">
                <HelpCircle className="w-4 h-4 mr-2 text-gov-maroon" />
                Account Credential Recovery
              </h3>
              <button
                onClick={() => setShowForgotModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs font-serif text-gov-text-secondary leading-relaxed">
              Under public sector security regulations, institutional credentials (Universities, Faculty, Government, and Industry) are verified through administrative coordinators.
            </p>

            <div className="p-3 bg-gov-sand-50 border border-gov-border rounded-sm text-xs font-serif space-y-1">
              <div><strong>Default Demo Password:</strong> <code className="bg-white px-1.5 py-0.5 rounded border border-gray-300 text-gov-maroon font-mono">Password123</code></div>
              <div><strong>Citizen Helpline:</strong> Dial 1800-11-DELHI or email <span className="text-gov-maroon">support.innovation@delhi.gov.in</span></div>
            </div>

            <div className="text-right pt-2">
              <Button variant="primary" size="sm" onClick={() => setShowForgotModal(false)}>
                Understood, Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
