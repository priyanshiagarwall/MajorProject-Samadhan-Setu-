import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingState from '../../components/common/LoadingState';
import MetricCard from '../../components/common/MetricCard';
import {
  Briefcase,
  RefreshCw,
  Search,
  Filter,
  GraduationCap,
  Building2,
  Calendar,
  Clock,
  ArrowRight,
  TrendingUp,
  Award,
  CheckCircle2,
  SlidersHorizontal,
  X,
  FileCheck
} from 'lucide-react';

const PROJECT_STAGES = [
  { value: 'ALL', label: 'All Stages' },
  { value: 'VALIDATION', label: 'Validation' },
  { value: 'ASSIGNMENT', label: 'Assignment' },
  { value: 'SOLUTION_PROPOSAL', label: 'Solution Proposal' },
  { value: 'PROTOTYPE', label: 'Prototype' },
  { value: 'PILOT_TESTING', label: 'Pilot Testing' },
  { value: 'IMPLEMENTATION', label: 'Implementation' },
  { value: 'IMPACT_EVALUATION', label: 'Impact Evaluation' },
  { value: 'COMPLETED', label: 'Completed' }
];

const STAGE_COLORS = {
  VALIDATION: 'bg-stone-100 text-stone-800 border-stone-300',
  ASSIGNMENT: 'bg-blue-100 text-blue-900 border-blue-300',
  SOLUTION_PROPOSAL: 'bg-purple-100 text-purple-900 border-purple-300',
  PROTOTYPE: 'bg-amber-100 text-amber-900 border-amber-300',
  PILOT_TESTING: 'bg-cyan-100 text-cyan-900 border-cyan-300',
  IMPLEMENTATION: 'bg-indigo-100 text-indigo-900 border-indigo-300',
  IMPACT_EVALUATION: 'bg-teal-100 text-teal-900 border-teal-300',
  COMPLETED: 'bg-emerald-100 text-emerald-900 border-emerald-300'
};

const AdminProjectsPage = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('ALL');
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });

  // Update Stage Modal
  const [editingProject, setEditingProject] = useState(null);
  const [newStage, setNewStage] = useState('');
  const [newProgress, setNewProgress] = useState(0);
  const [stageNotes, setStageNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchProjects = async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        search: search.trim() || undefined,
        stage: stageFilter !== 'ALL' ? stageFilter : undefined
      };
      const res = await adminService.getProjects(params);
      setProjects(res.data?.projects || []);
      setPagination(res.data?.pagination || { total: 0, page: 1, totalPages: 1 });
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects(1);
  }, [stageFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProjects(1);
  };

  const openUpdateModal = (project) => {
    setEditingProject(project);
    setNewStage(project.status || 'ASSIGNMENT');
    setNewProgress(project.overallProgress || 0);
    setStageNotes('');
  };

  const handleStageSubmit = async (e) => {
    e.preventDefault();
    if (!editingProject) return;
    setUpdating(true);
    try {
      await adminService.updateProjectStage(editingProject._id, {
        stage: newStage,
        progress: Number(newProgress),
        notes: stageNotes.trim()
      });
      setEditingProject(null);
      fetchProjects(pagination.page);
    } catch (err) {
      alert(err.message || 'Failed to update project stage');
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '--';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const totalProjects = pagination.total || projects.length;
  const inProgressCount = projects.filter((p) => ['PROTOTYPE', 'PILOT_TESTING', 'IMPLEMENTATION'].includes(p.status)).length;
  const completedCount = projects.filter((p) => p.status === 'COMPLETED').length;

  return (
    <div className="space-y-6 font-serif">
      {/* Top Header */}
      <div className="bg-white border border-gov-border rounded-xs p-6 shadow-gov-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-gov-navy font-bold uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Multi-Institutional Portfolio Management</span>
          </div>
          <h1 className="text-2xl font-bold text-gov-navy">
            Societal Innovation Projects Registry
          </h1>
          <p className="text-xs text-gov-text-secondary mt-1 max-w-3xl leading-relaxed">
            Track academic engineering prototypes, bench testing, municipal field deployments, and citizen impact verification across Delhi.
          </p>
        </div>

        <div className="flex items-center space-x-3 flex-shrink-0">
          <Button variant="subtle" size="sm" onClick={() => fetchProjects(pagination.page)} icon={RefreshCw}>
            Sync Projects
          </Button>
          <Link to="/admin/assignments">
            <Button variant="primary" size="sm">
              New Assignment
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Total Projects"
          value={totalProjects}
          subtitle="Formally assigned initiatives"
          icon={Briefcase}
          accent="navy"
        />
        <MetricCard
          title="Active Development"
          value={inProgressCount}
          subtitle="Prototyping & field pilots"
          icon={TrendingUp}
          accent="amber"
        />
        <MetricCard
          title="Deployed Solutions"
          value={completedCount}
          subtitle="Completed civic projects"
          icon={Award}
          accent="emerald"
        />
      </div>

      {/* Filter and Search Bar */}
      <Card accent="none" className="p-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <form onSubmit={handleSearch} className="flex-1 flex items-center space-x-2 w-full">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gov-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by project name, challenge ID, code, or keyword..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-gov-border rounded-xs focus:outline-none focus:border-gov-navy"
              />
            </div>
            <Button variant="primary" size="sm" type="submit">
              Search
            </Button>
          </form>

          <div className="flex items-center space-x-2 w-full md:w-auto">
            <SlidersHorizontal className="w-4 h-4 text-gov-text-muted flex-shrink-0" />
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="text-xs border border-gov-border rounded-xs px-3 py-2 bg-white text-gov-navy focus:outline-none focus:border-gov-navy w-full md:w-auto"
            >
              {PROJECT_STAGES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Project Listings */}
      {loading ? (
        <LoadingState message="Retrieving societal innovation projects from MongoDB..." />
      ) : projects.length === 0 ? (
        <Card accent="none" className="p-12 text-center space-y-3">
          <Briefcase className="w-12 h-12 text-gov-text-muted mx-auto opacity-50" />
          <h3 className="text-base font-bold text-gov-navy">No Innovation Projects Found</h3>
          <p className="text-xs text-gov-text-secondary max-w-md mx-auto">
            {stageFilter !== 'ALL'
              ? `No projects currently in stage "${stageFilter}". Try changing the filter.`
              : 'Validated challenges can be assigned to universities to automatically generate active projects.'}
          </p>
          <div className="pt-2">
            <Link to="/admin/assignments">
              <Button variant="primary" size="sm">
                Assign a Challenge Now
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {projects.map((p) => {
            const stageLabel = (p.status || 'ASSIGNMENT').replace(/_/g, ' ');
            const stageBadgeStyle = STAGE_COLORS[p.status] || 'bg-stone-100 text-stone-800';

            return (
              <Card key={p._id} accent="navy" className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Left Column: Project Overview */}
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-gov-maroon px-2 py-0.5 bg-gov-sand-100 rounded-xs">
                        {p.code || `PRJ-${p._id.slice(-5).toUpperCase()}`}
                      </span>

                      {p.challengeId && (
                        <span className="text-xs font-mono text-gov-navy font-semibold">
                          Linked: [{p.challengeId.code || p.challengeId.title?.slice(0, 20)}]
                        </span>
                      )}

                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-xs border ${stageBadgeStyle}`}>
                        Stage: {stageLabel}
                      </span>

                      {p.challengeId?.category && (
                        <Badge variant="navy">{p.challengeId.category}</Badge>
                      )}
                    </div>

                    <h2 className="text-lg font-bold text-gov-navy leading-snug hover:text-gov-maroon transition-colors">
                      {p.title}
                    </h2>

                    <p className="text-xs text-gov-text-secondary leading-relaxed line-clamp-2">
                      {p.proposedSolution || p.description}
                    </p>

                    {/* Stakeholder Info Tags */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-2 text-xs text-gov-text-secondary">
                      <div className="flex items-center space-x-1.5 truncate">
                        <GraduationCap className="w-3.5 h-3.5 text-gov-navy flex-shrink-0" />
                        <span className="truncate">
                          Uni: <strong>{p.universityId?.name || 'Higher Ed Partner'}</strong>
                        </span>
                      </div>

                      <div className="flex items-center space-x-1.5 truncate">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        <span className="truncate">
                          Mentor: <strong>{p.mentor?.user?.name || p.mentor?.name || 'Faculty Lead'}</strong>
                        </span>
                      </div>

                      <div className="flex items-center space-x-1.5 truncate">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                        <span className="truncate">
                          Team: <strong>{p.team?.name || 'Student Innovators'}</strong>
                        </span>
                      </div>

                      <div className="flex items-center space-x-1.5 truncate">
                        <Building2 className="w-3.5 h-3.5 text-gov-maroon flex-shrink-0" />
                        <span className="truncate">
                          Industry: <strong>{p.industryPartners?.[0]?.name || 'Municipal / None'}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Deadline and Updated Info */}
                    <div className="flex items-center space-x-4 text-[11px] text-gov-text-muted pt-1">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>Deadline: {formatDate(p.deadline)}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>Last Update: {formatDate(p.updatedAt)}</span>
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Progress & Actions */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between lg:justify-center gap-4 border-t lg:border-t-0 lg:border-l border-gov-border pt-4 lg:pt-0 lg:pl-6 min-w-[200px]">
                    <div className="w-full space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-gov-navy">Overall Progress</span>
                        <span className="font-mono font-bold text-gov-maroon">{p.overallProgress || 0}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-gov-sand-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 transition-all duration-300"
                          style={{ width: `${Math.min(100, Math.max(5, p.overallProgress || 0))}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 w-full">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => openUpdateModal(p)}
                        className="flex-1"
                      >
                        Update Stage
                      </Button>

                      <Link to={`/admin/projects/${p._id}`} className="flex-shrink-0">
                        <Button variant="subtle" size="sm" icon={ArrowRight} title="Open Workspace">
                          Workspace
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-gov-text-secondary pt-4">
          <span>
            Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} projects)
          </span>
          <div className="flex items-center space-x-2">
            <Button
              variant="subtle"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => fetchProjects(pagination.page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="subtle"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchProjects(pagination.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Modal: Administrative Stage & Progress Update */}
      {editingProject && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gov-border rounded-xs max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-gov-border pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-gov-maroon">
                  {editingProject.code || 'PROJECT'}
                </span>
                <h3 className="text-base font-bold text-gov-navy">
                  Update Stage & Milestones
                </h3>
              </div>
              <button
                onClick={() => setEditingProject(null)}
                className="text-gov-text-muted hover:text-gov-navy text-lg p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStageSubmit} className="space-y-4 text-xs font-serif">
              <div>
                <label className="block text-gov-navy font-bold mb-1">
                  Project Lifecycle Stage
                </label>
                <select
                  value={newStage}
                  onChange={(e) => setNewStage(e.target.value)}
                  className="w-full border border-gov-border rounded-xs px-3 py-2 bg-white text-gov-navy focus:outline-none focus:border-gov-navy"
                >
                  {PROJECT_STAGES.filter((s) => s.value !== 'ALL').map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-gov-navy font-bold">
                    Completion Progress: {newProgress}%
                  </label>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={newProgress}
                  onChange={(e) => setNewProgress(e.target.value)}
                  className="w-full accent-gov-navy cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-gov-navy font-bold mb-1">
                  Administrative Milestone / Progress Notes
                </label>
                <textarea
                  rows="3"
                  value={stageNotes}
                  onChange={(e) => setStageNotes(e.target.value)}
                  placeholder="Record council inspection notes, bench verification outcomes, or deployment tranche approvals..."
                  className="w-full border border-gov-border rounded-xs p-3 text-xs focus:outline-none focus:border-gov-navy"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gov-border">
                <Button
                  type="button"
                  variant="subtle"
                  size="sm"
                  onClick={() => setEditingProject(null)}
                  disabled={updating}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={updating}
                  icon={FileCheck}
                >
                  {updating ? 'Saving Changes...' : 'Save & Broadcast Update'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProjectsPage;
