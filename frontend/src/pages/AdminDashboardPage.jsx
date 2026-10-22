import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminService } from '../services/adminService';
import { useAuth } from '../hooks/useAuth';
import socketService from '../services/socket';
import MetricCard from '../components/common/MetricCard';
import ChartCard from '../components/common/ChartCard';
import StatusBadge from '../components/common/StatusBadge';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import AssignUniversityModal from '../components/admin/AssignUniversityModal';
import ChallengeDetailModal from '../components/admin/ChallengeDetailModal';

// Recharts components
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
  Legend
} from 'recharts';

import {
  FolderKanban,
  Clock,
  CheckCircle2,
  TrendingUp,
  Award,
  GraduationCap,
  Building2,
  Eye,
  Check,
  XCircle,
  Share2,
  RefreshCw,
  AlertCircle,
  Activity,
  User,
  ShieldCheck,
  Briefcase
} from 'lucide-react';

const STATUS_COLORS = {
  SUBMITTED: '#78716c',
  UNDER_REVIEW: '#d97706',
  VALIDATED: '#2563eb',
  ASSIGNED: '#4f46e5',
  IN_PROGRESS: '#ca8a04',
  SOLUTION_PROPOSED: '#9333ea',
  PILOT_TESTING: '#0891b2',
  RESOLVED: '#059669',
  REJECTED: '#e11d48',
  PROTOTYPE: '#0d9488',
  COMPLETED: '#059669'
};

const PRIORITY_COLORS = {
  CRITICAL: '#e11d48',
  HIGH: '#d97706',
  MEDIUM: '#2563eb',
  LOW: '#10b981'
};

const PIE_COLORS = ['#7a1113', '#142a45', '#b45309', '#059669', '#4f46e5', '#9333ea', '#0891b2', '#e11d48'];

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [dashboardData, setDashboardData] = useState(null);
  const [recentChallenges, setRecentChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [assigningChallenge, setAssigningChallenge] = useState(null);

  const loadDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const [dashRes, challengesRes] = await Promise.all([
        adminService.getDashboard(),
        adminService.getChallenges({ page: 1, limit: 6, sortBy: 'createdAt', sortOrder: 'desc' })
      ]);

      setDashboardData(dashRes.data || {});
      setRecentChallenges(challengesRes.data?.challenges || []);
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
      setError(err.message || 'Failed to retrieve government state data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();

    // Socket.IO real-time sync
    const socket = socketService.connect(user?._id || user?.id);
    if (socket) {
      const handleReload = () => loadDashboard();
      socket.on('challenge:submitted', handleReload);
      socket.on('challenge:analyzed', handleReload);
      socket.on('challenge:updated', handleReload);
      socket.on('challenge:assigned', handleReload);
      socket.on('project:updated', handleReload);
      socket.on('project:created', handleReload);

      return () => {
        socket.off('challenge:submitted', handleReload);
        socket.off('challenge:analyzed', handleReload);
        socket.off('challenge:updated', handleReload);
        socket.off('challenge:assigned', handleReload);
        socket.off('project:updated', handleReload);
        socket.off('project:created', handleReload);
      };
    }
  }, [user]);

  // Quick Action: Validate Challenge
  const handleValidate = async (challenge) => {
    try {
      await adminService.reviewChallenge(challenge._id, {
        action: 'VALIDATED',
        reason: 'Verified and approved by Delhi State Administration'
      });
      loadDashboard();
    } catch (err) {
      alert(err.message || 'Failed to validate challenge');
    }
  };

  // Quick Action: Reject Challenge
  const handleReject = async (challenge) => {
    const reason = window.prompt(
      'Please specify official rejection reason for citizen audit records:',
      'Duplicate submission or out of state jurisdiction.'
    );
    if (!reason) return;

    try {
      await adminService.reviewChallenge(challenge._id, {
        action: 'REJECTED',
        reason
      });
      loadDashboard();
    } catch (err) {
      alert(err.message || 'Failed to reject challenge');
    }
  };

  if (loading && !dashboardData) {
    return <LoadingState message="Connecting to Delhi State Innovation Registry & calculating live analytics..." />;
  }

  if (error && !dashboardData?.metrics) {
    return (
      <div className="py-12">
        <ErrorState
          title="State Innovation Registry Unavailable"
          message={error}
          onRetry={loadDashboard}
          retryLabel="Retry Dashboard Connection"
        />
      </div>
    );
  }

  const metrics = dashboardData?.metrics || {};
  const trends = dashboardData?.trends || [];
  const categoryData = dashboardData?.challengesByCategory || [];
  const priorityData = dashboardData?.priorityDistribution || [];
  const projectStatusData = dashboardData?.projectStatus || [];
  const recentActivity = dashboardData?.recentActivity || [];

  const formatDate = (dateString) => {
    if (!dateString) return '--';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    const diff = (new Date() - new Date(dateString)) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="space-y-6 font-serif">
      {/* Top Welcome & Operational Banner */}
      <div className="bg-white border border-gov-border rounded-xs p-6 shadow-gov-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-serif text-gov-navy font-bold uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>GNCTD State Administration &bull; {user?.name || 'Dr. Vivek Saxena'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gov-navy leading-tight">
            Government Oversight & Challenge Allocation Console
          </h1>
          <p className="text-xs font-serif text-gov-text-secondary mt-1 max-w-3xl leading-relaxed">
            Monitor community problem statements across Delhi, screen validation pipelines, coordinate academic university labs, and track municipal field deployments in real time.
          </p>
        </div>

        <div className="flex items-center space-x-3 flex-shrink-0">
          <Button variant="subtle" size="sm" onClick={loadDashboard} icon={RefreshCw}>
            Sync Metrics
          </Button>
          <Link to="/admin/validation-queue">
            <Button variant="primary" size="sm">
              Review Queue ({metrics.pendingValidation || 0})
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-serif rounded-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="subtle" size="sm" onClick={loadDashboard}>
            Retry
          </Button>
        </div>
      )}

      {/* 7 Required Metric Cards (per Section 1 Specs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        <MetricCard
          title="Total Challenges"
          value={metrics.totalChallenges || 0}
          subtitle="Delhi community submissions"
          icon={FolderKanban}
          accent="navy"
          onClick={() => navigate('/admin/challenges')}
        />

        <MetricCard
          title="Pending Validation"
          value={metrics.pendingValidation || 0}
          subtitle="Awaiting administrative review"
          icon={Clock}
          accent="maroon"
          badgeText="Queue"
          onClick={() => navigate('/admin/validation-queue')}
        />

        <MetricCard
          title="Validated Challenges"
          value={metrics.validatedChallenges || 0}
          subtitle="Approved for allocation"
          icon={CheckCircle2}
          accent="blue"
          onClick={() => navigate('/admin/challenges?status=VALIDATED')}
        />

        <MetricCard
          title="Active Projects"
          value={metrics.activeProjects || 0}
          subtitle="Engineering prototypes"
          icon={TrendingUp}
          accent="indigo"
          onClick={() => navigate('/admin/projects')}
        />

        <MetricCard
          title="Completed Projects"
          value={metrics.completedProjects || 0}
          subtitle="Field deployed solutions"
          icon={Award}
          accent="emerald"
          onClick={() => navigate('/admin/projects?stage=COMPLETED')}
        />

        <MetricCard
          title="Universities"
          value={metrics.universities || 0}
          subtitle="Partner research institutions"
          icon={GraduationCap}
          accent="purple"
          onClick={() => navigate('/admin/universities')}
        />

        <MetricCard
          title="Industry Partners"
          value={metrics.industryPartners || 0}
          subtitle="Corporate & startup co-sponsors"
          icon={Building2}
          accent="cyan"
          onClick={() => navigate('/admin/industry-partners')}
        />
      </div>

      {/* 4 Recharts Analytics Grid (per Section 1 Specs) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Challenge Trends */}
        <ChartCard
          accent="maroon"
          title="Challenge Trends (Past 6 Months)"
          subtitle="Trajectory of citizen challenge submissions across Delhi"
          badge="Live Monthly Submissions"
        >
          {trends && trends.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={trends} margin={{ top: 10, right: 15, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7a1113" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#7a1113" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="shortMonth" tick={{ fontSize: 11, fontFamily: 'Georgia' }} />
                <YAxis tick={{ fontSize: 11, fontFamily: 'Georgia' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #cbd5e1',
                    fontFamily: 'Georgia',
                    fontSize: 12
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="Submissions"
                  stroke="#7a1113"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCount)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs font-serif text-gov-text-muted">No trend data available</p>
          )}
        </ChartCard>

        {/* Chart 2: Challenges by Category */}
        <ChartCard
          accent="navy"
          title="Challenges by Category"
          subtitle="Distribution of civic problem areas in Delhi"
          badge="Category Breakdown"
        >
          {categoryData && categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={categoryData} layout="vertical" margin={{ top: 10, right: 20, left: 60, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                <XAxis type="number" tick={{ fontSize: 11, fontFamily: 'Georgia' }} allowDecimals={false} />
                <YAxis type="category" dataKey="category" tick={{ fontSize: 10, fontFamily: 'Georgia' }} width={120} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #cbd5e1',
                    fontFamily: 'Georgia',
                    fontSize: 12
                  }}
                />
                <Bar dataKey="count" name="Challenges" fill="#142a45" radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs font-serif text-gov-text-muted">No category data recorded</p>
          )}
        </ChartCard>

        {/* Chart 3: Challenge Priority Distribution */}
        <ChartCard
          accent="amber"
          title="Challenge Priority Distribution"
          subtitle="Civic severity & urgency classification"
          badge="Priority Levels"
        >
          {priorityData && priorityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={priorityData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="priority" tick={{ fontSize: 11, fontFamily: 'Georgia' }} />
                <YAxis tick={{ fontSize: 11, fontFamily: 'Georgia' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #cbd5e1',
                    fontFamily: 'Georgia',
                    fontSize: 12
                  }}
                />
                <Bar dataKey="count" name="Challenges" fill="#b45309" radius={[2, 2, 0, 0]}>
                  {priorityData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PRIORITY_COLORS[entry.priority] || PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs font-serif text-gov-text-muted">No priority records found</p>
          )}
        </ChartCard>

        {/* Chart 4: Project Status */}
        <ChartCard
          accent="emerald"
          title="Active Projects by Lifecycle Stage"
          subtitle="Prototyping, testing, and deployment stages"
          badge="Project Status"
        >
          {projectStatusData && projectStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={projectStatusData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis
                  dataKey="status"
                  angle={-25}
                  textAnchor="end"
                  tick={{ fontSize: 10, fontFamily: 'Georgia' }}
                />
                <YAxis tick={{ fontSize: 11, fontFamily: 'Georgia' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #cbd5e1',
                    fontFamily: 'Georgia',
                    fontSize: 12
                  }}
                />
                <Bar dataKey="count" name="Projects" fill="#059669" radius={[2, 2, 0, 0]}>
                  {projectStatusData.map((entry, index) => (
                    <Cell
                      key={`proj-${index}`}
                      fill={STATUS_COLORS[entry.status] || '#059669'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-gov-text-muted">
              <Briefcase className="w-8 h-8 text-gov-text-muted mb-2 opacity-50" />
              <p className="text-xs font-serif">Validated challenges will populate project lifecycle stages here once assigned to university cohorts.</p>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Recent Activity Section (per Section 1 Specs) */}
      <Card
        accent="navy"
        title="Recent State Administrative Activity"
        subtitle="Chronological audit records of validations, university assignments, and council decisions"
        headerAction={
          <span className="text-[10px] text-gov-text-muted uppercase tracking-wider flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Audit Trail Verified</span>
          </span>
        }
      >
        {recentActivity && recentActivity.length > 0 ? (
          <div className="divide-y divide-gov-border">
            {recentActivity.map((act) => (
              <div key={act._id} className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
                <div className="flex items-start space-x-3">
                  <div className="w-7 h-7 rounded-full bg-gov-sand-100 flex items-center justify-center text-gov-navy flex-shrink-0 mt-0.5">
                    <Activity className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-gov-navy">{act.userName || act.user?.name || 'Council Admin'}</span>
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-xs bg-gov-sand-200 text-gov-navy">
                        {act.userRole || act.user?.role || 'ADMIN'}
                      </span>
                      <span className="text-gov-text-muted text-[11px]">&bull; {act.action}</span>
                    </div>

                    <p className="text-xs text-gov-text-secondary mt-0.5 leading-snug">
                      {act.challenge && (
                        <strong className="text-gov-maroon mr-1">
                          [{act.challenge.code || 'CHALLENGE'}]:
                        </strong>
                      )}
                      {act.comment || 'Administrative action logged to council records.'}
                    </p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0 text-[11px] text-gov-text-muted font-mono">
                  {formatTimeAgo(act.timestamp)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs font-serif text-gov-text-muted py-4">No recent administrative activities logged yet.</p>
        )}
      </Card>

      {/* Recent Submissions Table with Action Controls */}
      <Card
        accent="navy"
        title="Recent Citizen Challenge Submissions"
        subtitle="Review community statements, screen AI intelligence, validate feasibility, or assign university labs"
        headerAction={
          <Link to="/admin/challenges">
            <Button variant="subtle" size="sm">
              View All ({metrics.totalChallenges || 0})
            </Button>
          </Link>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-serif divide-y divide-gov-border">
            <thead>
              <tr className="bg-gov-sand-100 text-gov-navy font-bold uppercase tracking-wider text-[11px]">
                <th className="px-3 py-3 whitespace-nowrap">Challenge ID</th>
                <th className="px-3 py-3 min-w-[200px]">Title</th>
                <th className="px-3 py-3 whitespace-nowrap">Category</th>
                <th className="px-3 py-3 whitespace-nowrap">District</th>
                <th className="px-3 py-3 whitespace-nowrap">Submitted By</th>
                <th className="px-3 py-3 whitespace-nowrap">Date</th>
                <th className="px-3 py-3 whitespace-nowrap">Priority</th>
                <th className="px-3 py-3 whitespace-nowrap">Status</th>
                <th className="px-3 py-3 text-right whitespace-nowrap min-w-[200px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gov-border bg-white">
              {recentChallenges.map((c) => {
                const isPending = ['SUBMITTED', 'UNDER_REVIEW'].includes(c.status?.toUpperCase());

                return (
                  <tr key={c._id} className="hover:bg-gov-sand-50 transition-colors">
                    <td className="px-3 py-3 font-mono font-bold text-gov-maroon whitespace-nowrap">
                      {c.code || `DEL-${c._id.slice(-4).toUpperCase()}`}
                    </td>

                    <td className="px-3 py-3">
                      <div className="font-bold text-gov-navy line-clamp-1 hover:text-gov-maroon">
                        {c.title}
                      </div>
                      {c.location?.landmark && (
                        <div className="text-[10px] text-gov-text-muted truncate">
                          Near {c.location.landmark}
                        </div>
                      )}
                    </td>

                    <td className="px-3 py-3 whitespace-nowrap text-gov-text-secondary">
                      {c.category}
                    </td>

                    <td className="px-3 py-3 whitespace-nowrap font-medium text-gov-navy">
                      {c.district}
                    </td>

                    <td className="px-3 py-3 whitespace-nowrap text-gov-text-secondary">
                      <div>{c.submittedBy?.name || 'Citizen'}</div>
                      <div className="text-[10px] text-gov-text-muted truncate max-w-[120px]">
                        {c.submittedBy?.organization || 'Resident'}
                      </div>
                    </td>

                    <td className="px-3 py-3 whitespace-nowrap text-gov-text-muted">
                      {formatDate(c.createdAt)}
                    </td>

                    <td className="px-3 py-3 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-xs ${
                          c.priority === 'critical'
                            ? 'bg-red-100 text-red-800'
                            : c.priority === 'high'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-stone-100 text-stone-700'
                        }`}
                      >
                        {c.priority || 'Medium'}
                      </span>
                    </td>

                    <td className="px-3 py-3 whitespace-nowrap">
                      <StatusBadge status={c.status} />
                    </td>

                    {/* Actions: View, Validate, Reject, Assign */}
                    <td className="px-3 py-3 text-right whitespace-nowrap space-x-1">
                      <Button
                        variant="subtle"
                        size="sm"
                        onClick={() => setSelectedChallenge(c)}
                        title="View Full Submission"
                        icon={Eye}
                      >
                        View
                      </Button>

                      {isPending && (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleValidate(c)}
                            title="Validate Challenge"
                            className="bg-emerald-700 hover:bg-emerald-800"
                            icon={Check}
                          >
                            Validate
                          </Button>

                          <Button
                            variant="subtle"
                            size="sm"
                            onClick={() => handleReject(c)}
                            title="Reject Challenge"
                            className="text-rose-700 hover:bg-rose-50"
                            icon={XCircle}
                          >
                            Reject
                          </Button>
                        </>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAssigningChallenge(c)}
                        title="Assign to University"
                        icon={Share2}
                      >
                        Assign
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* View Detail Modal */}
      {selectedChallenge && (
        <ChallengeDetailModal
          challenge={selectedChallenge}
          onClose={() => setSelectedChallenge(null)}
          onValidate={handleValidate}
          onReject={handleReject}
          onAssign={(c) => setAssigningChallenge(c)}
        />
      )}

      {/* Assign University Modal */}
      {assigningChallenge && (
        <AssignUniversityModal
          challenge={assigningChallenge}
          onClose={() => setAssigningChallenge(null)}
          onSuccess={() => loadDashboard()}
        />
      )}
    </div>
  );
};

export default AdminDashboardPage;
