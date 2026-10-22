import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { projectService } from '../../services/projectService';
import { universityService } from '../../services/universityService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import {
  Briefcase,
  Plus,
  Compass,
  GraduationCap,
  Users2,
  FileText,
  CheckCircle,
  Clock,
  Send,
  X,
  RefreshCw,
  Eye,
  Calendar,
  IndianRupee,
  Layers
} from 'lucide-react';

const ACTIVE_PROJECT_STAGES = [
  'CHALLENGE_ACCEPTED',
  'PROJECT_CREATED',
  'PROPOSAL_SUBMITTED',
  'APPROVED',
  'RESEARCH',
  'PROTOTYPE',
  'TESTING',
  'PILOT',
  'VALIDATION',
  'DEPLOYMENT'
];

const STATUS_CONFIG = {
  // Canonical 11-stage project lifecycle
  CHALLENGE_ACCEPTED: { label: 'Challenge Accepted', color: 'bg-stone-100 text-stone-700 border-stone-300' },
  PROJECT_CREATED: { label: 'Project Created', color: 'bg-stone-100 text-stone-700 border-stone-300' },
  PROPOSAL_SUBMITTED: { label: 'Proposal Submitted', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  APPROVED: { label: 'Council Approved', color: 'bg-blue-100 text-blue-800 border-blue-300 font-bold' },
  RESEARCH: { label: 'Academic Research', color: 'bg-indigo-100 text-indigo-900 border-indigo-300' },
  PROTOTYPE: { label: 'Prototype Fabrication', color: 'bg-purple-100 text-purple-800 border-purple-300 font-bold' },
  TESTING: { label: 'Benchtop Testing', color: 'bg-cyan-100 text-cyan-800 border-cyan-300 font-bold' },
  PILOT: { label: 'Live Ward Pilot', color: 'bg-orange-100 text-orange-800 border-orange-300 font-bold' },
  VALIDATION: { label: 'Municipal Validation', color: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold' },
  DEPLOYMENT: { label: 'Ward Deployment', color: 'bg-teal-100 text-teal-800 border-teal-300 font-bold' },
  COMPLETED: { label: 'Completed', color: 'bg-emerald-100 text-emerald-900 border-emerald-400 font-bold' },

  // Legacy fallbacks
  TEAM_FORMED: { label: 'Team Formed', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  UNDER_REVIEW: { label: 'Under Review', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  DEVELOPMENT: { label: 'In Development', color: 'bg-indigo-100 text-indigo-900 border-indigo-300 font-bold' }
};

const UniversityProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [assignedChallenges, setAssignedChallenges] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [proposalProject, setProposalProject] = useState(null);
  const [viewProject, setViewProject] = useState(null);

  // Create Project Form State
  const [selectedChallengeId, setSelectedChallengeId] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [proposedSolution, setProposedSolution] = useState('');
  const [objectives, setObjectives] = useState('');
  const [technologies, setTechnologies] = useState('');
  const [timeline, setTimeline] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [budgetBreakdown, setBudgetBreakdown] = useState('');
  const [teamRequirements, setTeamRequirements] = useState('');
  const [selectedMentor, setSelectedMentor] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'active' | 'completed'

  // Proposal Form State
  const [methodology, setMethodology] = useState('');
  const [expectedImpact, setExpectedImpact] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [projRes, chalRes, facRes] = await Promise.all([
        projectService.getProjects(),
        universityService.getChallenges(),
        projectService.getFaculty()
      ]);
      setProjects(projRes.data?.projects || []);
      setAssignedChallenges(chalRes.data?.assignedChallenges || []);
      setFacultyList(facRes.data?.faculty || []);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load university project workspace');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChallengeSelect = (cId) => {
    setSelectedChallengeId(cId);
    const target = assignedChallenges.find((c) => c._id === cId);
    if (target) {
      setProjectTitle(`Prototype: ${target.title}`);
      setProblemStatement(target.description || '');
      setProposedSolution('');
      setObjectives('');
      setTechnologies(Array.isArray(target.tags) ? target.tags.join(', ') : '');
      if (target.facultyLead?.name) {
        const matchingFac = facultyList.find((f) => f.name.includes(target.facultyLead.name));
        if (matchingFac) setSelectedMentor(matchingFac._id);
      }
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!selectedChallengeId || !projectTitle || !proposedSolution) return;

    setSubmitting(true);
    setErrorMsg('');
    try {
      const payload = {
        challengeId: selectedChallengeId,
        title: projectTitle,
        description: problemStatement,
        proposedSolution,
        objectives: objectives.split('\n').map((o) => o.trim()).filter(Boolean),
        technologies: technologies.split(',').map((t) => t.trim()).filter(Boolean),
        timeline,
        budget: {
          estimatedAmount: Number(budgetAmount) || 0,
          breakdown: budgetBreakdown
        },
        teamRequirements,
        mentor: selectedMentor || undefined
      };

      await projectService.createProject(payload);
      setActionSuccess('Innovation project initiated successfully! Status: PROJECT_CREATED');
      setShowCreateModal(false);
      resetCreateForm();
      fetchData();
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitProposal = async (e) => {
    e.preventDefault();
    if (!proposalProject) return;
    if (!methodology.trim() || !expectedImpact.trim()) {
      setErrorMsg('Both technical methodology and expected societal impact are required.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      await projectService.submitProposal(proposalProject._id, {
        problemUnderstanding: proposalProject.description,
        proposedSolution: proposalProject.proposedSolution,
        methodology: methodology.trim(),
        technology: proposalProject.technologies,
        timeline: proposalProject.timeline,
        expectedImpact: expectedImpact.trim()
      });

      setActionSuccess(`Formal proposal for "${proposalProject.title}" submitted to GNCTD! Status: PROPOSAL_SUBMITTED`);
      setProposalProject(null);
      setMethodology('');
      setExpectedImpact('');
      fetchData();
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to submit proposal');
    } finally {
      setSubmitting(false);
    }
  };

  const resetCreateForm = () => {
    setSelectedChallengeId('');
    setProjectTitle('');
    setProblemStatement('');
    setProposedSolution('');
    setObjectives('');
    setTechnologies('');
    setBudgetAmount('');
    setBudgetBreakdown('');
    setTeamRequirements('');
    setSelectedMentor('');
  };

  if (loading) {
    return <LoadingState message="Loading university innovation projects & research milestones..." />;
  }

  if (errorMsg && projects.length === 0) {
    return (
      <ErrorState
        title="Projects Workspace Connection Error"
        message={errorMsg}
        onRetry={fetchData}
        retryLabel="Retry Connection"
      />
    );
  }

  const activeCount = projects.filter((p) => ACTIVE_PROJECT_STAGES.includes(p.status)).length;
  const completedCount = projects.filter((p) => p.status === 'COMPLETED').length;

  const filteredProjects = projects.filter((p) => {
    if (activeTab === 'active') return ACTIVE_PROJECT_STAGES.includes(p.status);
    if (activeTab === 'completed') return p.status === 'COMPLETED';
    return true;
  });

  return (
    <div className="space-y-6 font-serif">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold text-gov-maroon uppercase tracking-wider mb-1 flex items-center space-x-1.5">
            <Briefcase className="w-4 h-4 text-gov-maroon" />
            <span>Academic Research Projects Hub</span>
          </div>
          <h1 className="text-2xl font-bold text-gov-navy">
            University Innovation Projects ({projects.length})
          </h1>
          <p className="text-xs text-gov-text-secondary mt-0.5">
            Manage student-faculty innovation cohorts, link accepted civic challenges, form multidisciplinary teams, and track proposal approvals.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="subtle" size="sm" onClick={fetchData} icon={RefreshCw}>
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowCreateModal(true)}
            icon={Plus}
            className="bg-gov-maroon hover:bg-gov-maroon-dark text-white"
          >
            Create New Project
          </Button>
        </div>
      </div>

      {/* Filter Tabs (All, Active, Completed) */}
      <div className="flex items-center space-x-2 border-b border-gov-border pb-3 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-xs font-semibold transition-colors ${
            activeTab === 'all'
              ? 'bg-gov-navy text-white shadow-xs'
              : 'bg-white border border-gov-border text-gov-text-secondary hover:text-gov-navy hover:bg-gov-sand-50'
          }`}
        >
          All ({projects.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('active')}
          className={`px-3 py-1.5 rounded-xs font-semibold transition-colors ${
            activeTab === 'active'
              ? 'bg-gov-navy text-white shadow-xs'
              : 'bg-white border border-gov-border text-gov-text-secondary hover:text-gov-navy hover:bg-gov-sand-50'
          }`}
        >
          Active ({activeCount})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('completed')}
          className={`px-3 py-1.5 rounded-xs font-semibold transition-colors ${
            activeTab === 'completed'
              ? 'bg-gov-navy text-white shadow-xs'
              : 'bg-white border border-gov-border text-gov-text-secondary hover:text-gov-navy hover:bg-gov-sand-50'
          }`}
        >
          Completed ({completedCount})
        </button>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xs flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xs">
          {errorMsg}
        </div>
      )}

      {/* Projects Table & Lifecycle Matrix */}
      {filteredProjects.length === 0 ? (
        <Card accent="none" className="py-12 text-center text-xs text-gov-text-muted space-y-3">
          <p className="text-sm font-bold text-gov-navy">
            {activeTab === 'completed'
              ? 'No Completed Projects Found'
              : activeTab === 'active'
              ? 'No Active Projects Found'
              : 'No Innovation Projects Created Yet'}
          </p>
          <p className="max-w-md mx-auto text-[11px]">
            {activeTab === 'all'
              ? 'Once your university accepts a challenge from the Marketplace, click below to initiate an engineering prototype project.'
              : 'No projects match the selected status filter.'}
          </p>
          {activeTab === 'all' && (
            <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)} icon={Plus}>
              Create First Project
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto border border-gov-border rounded-xs bg-white shadow-xs">
            <table className="w-full text-left text-xs divide-y divide-gov-border">
              <thead>
                <tr className="bg-gov-sand-100 text-gov-navy font-bold uppercase tracking-wider text-[10px]">
                  <th className="px-3 py-3">Project Title & Originating Challenge</th>
                  <th className="px-3 py-3 whitespace-nowrap">Status</th>
                  <th className="px-3 py-3 whitespace-nowrap">Faculty Mentor</th>
                  <th className="px-3 py-3 whitespace-nowrap">Multidisciplinary Team</th>
                  <th className="px-3 py-3 whitespace-nowrap">Timeline & Budget</th>
                  <th className="px-3 py-3 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gov-border">
                {filteredProjects.map((p) => {
                  const statusInfo = STATUS_CONFIG[p.status] || { label: p.status || 'Unknown', color: 'bg-gray-100 text-gray-700 border-gray-300' };
                  return (
                    <tr key={p._id} className="hover:bg-gov-sand-50 transition-colors">
                      {/* Title & Challenge */}
                      <td className="px-3 py-3 min-w-[240px]">
                        <div className="font-bold text-gov-navy text-sm leading-snug">{p.title}</div>
                        <div className="flex items-center space-x-2 text-[11px] text-gov-text-muted mt-1">
                          {p.challengeId ? (
                            <span className="font-mono text-gov-maroon font-bold bg-gov-sand-50 px-1 py-0.2 rounded-xs border border-gov-border">
                              Challenge [{p.challengeId.code}]: {p.challengeId.category}
                            </span>
                          ) : (
                            <span>Challenge unlinked</span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-xs border ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Faculty Mentor */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        {p.mentor ? (
                          <div className="text-[11px]">
                            <div className="font-bold text-gov-navy">{p.mentor.name}</div>
                            <div className="text-gray-500 text-[10px]">{p.mentor.department}</div>
                          </div>
                        ) : (
                          <span className="text-amber-700 italic text-[11px]">Pending Mentor</span>
                        )}
                      </td>

                      {/* Team */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        {p.team ? (
                          <div className="text-[11px]">
                            <div className="font-bold text-indigo-900 flex items-center space-x-1">
                              <Users2 className="w-3.5 h-3.5 text-indigo-600" />
                              <span>{p.team.name}</span>
                            </div>
                            <div className="text-gray-500 text-[10px]">
                              {p.team.members?.length || 0} student innovator(s)
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-[11px]">Team not formed</span>
                        )}
                      </td>

                      {/* Timeline & Budget */}
                      <td className="px-3 py-3 whitespace-nowrap text-[11px] text-gov-text-secondary">
                        <div>{p.timeline || 'Not provided'}</div>
                        <div className="font-bold text-emerald-800">
                          {p.budget?.estimatedAmount !== undefined && p.budget?.estimatedAmount !== null && p.budget.estimatedAmount > 0
                            ? `₹${Number(p.budget.estimatedAmount).toLocaleString('en-IN')}`
                            : 'Not specified'}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-3 whitespace-nowrap text-right space-x-1">
                        <Link to={`/university/projects/${p._id}`}>
                          <Button
                            variant="subtle"
                            size="sm"
                            icon={Eye}
                            title="Open Project Lifecycle Workspace"
                          >
                            Workspace
                          </Button>
                        </Link>

                        {p.status === 'PROJECT_CREATED' || p.status === 'TEAM_FORMED' ? (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              setProposalProject(p);
                              setMethodology('');
                              setExpectedImpact('');
                            }}
                            icon={Send}
                            className="bg-gov-maroon hover:bg-gov-maroon-dark text-white"
                          >
                            Submit Proposal
                          </Button>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-xs border border-emerald-200">
                            Proposal {p.proposal?.approvalStatus || 'Pending'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 1. Modal: Create Project */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gov-border rounded-sm max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gov-border pb-3">
              <h3 className="font-bold text-gov-navy text-lg flex items-center space-x-2">
                <Briefcase className="w-5 h-5 text-gov-maroon" />
                <span>Initiate University Innovation Project</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateProject} className="space-y-4 text-xs">
              {/* Select Accepted Challenge */}
              <div>
                <label className="block font-bold text-gov-navy uppercase tracking-wider mb-1">
                  Originating Accepted Challenge *
                </label>
                <select
                  required
                  value={selectedChallengeId}
                  onChange={(e) => handleChallengeSelect(e.target.value)}
                  className="w-full font-serif border border-gov-border rounded-xs px-3 py-2 bg-white outline-none focus:ring-1 focus:ring-gov-navy"
                >
                  <option value="">-- Select from institutional accepted challenges --</option>
                  {assignedChallenges.map((c) => (
                    <option key={c._id} value={c._id}>
                      [{c.code}] {c.title} ({c.district})
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block font-bold text-gov-navy uppercase tracking-wider mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="e.g. Decentralized Wet Waste Biomethanation Pilot Reactor"
                  className="w-full font-serif border border-gov-border rounded-xs px-3 py-2 outline-none focus:ring-1 focus:ring-gov-navy"
                />
              </div>

              {/* Proposed Solution */}
              <div>
                <label className="block font-bold text-gov-navy uppercase tracking-wider mb-1">
                  Proposed Technological Solution *
                </label>
                <textarea
                  rows={3}
                  required
                  value={proposedSolution}
                  onChange={(e) => setProposedSolution(e.target.value)}
                  placeholder="Describe your engineering approach, system architecture, and prototype implementation..."
                  className="w-full font-serif border border-gov-border rounded-xs p-2 outline-none focus:ring-1 focus:ring-gov-navy"
                />
              </div>

              {/* Objectives */}
              <div>
                <label className="block font-bold text-gov-navy uppercase tracking-wider mb-1">
                  Core Project Objectives (One per line)
                </label>
                <textarea
                  rows={3}
                  value={objectives}
                  onChange={(e) => setObjectives(e.target.value)}
                  placeholder="1. Design telemetry board&#10;2. Calibrate sensor matrix&#10;3. Conduct ward field trials"
                  className="w-full font-serif border border-gov-border rounded-xs p-2 outline-none focus:ring-1 focus:ring-gov-navy"
                />
              </div>

              {/* 2-col Grid: Technologies & Faculty Mentor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gov-navy uppercase tracking-wider mb-1">
                    Technologies (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={technologies}
                    onChange={(e) => setTechnologies(e.target.value)}
                    placeholder="e.g. IoT, LoRaWAN, Python, Solar Microgrid"
                    className="w-full font-serif border border-gov-border rounded-xs px-3 py-2 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gov-navy uppercase tracking-wider mb-1">
                    Supervising Faculty Mentor
                  </label>
                  <select
                    value={selectedMentor}
                    onChange={(e) => setSelectedMentor(e.target.value)}
                    className="w-full font-serif border border-gov-border rounded-xs px-3 py-2 bg-white outline-none"
                  >
                    <option value="">-- Optional: Assign Lead Faculty --</option>
                    {facultyList.map((f) => (
                      <option key={f._id} value={f._id}>
                        {f.name} ({f.department})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Budget & Timeline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gov-navy uppercase tracking-wider mb-1">
                    Estimated Timeline
                  </label>
                  <input
                    type="text"
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value)}
                    placeholder="e.g. 6 Months (Sep 2026 - Feb 2027)"
                    className="w-full font-serif border border-gov-border rounded-xs px-3 py-2 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gov-navy uppercase tracking-wider mb-1">
                    Estimated Budget (INR)
                  </label>
                  <input
                    type="number"
                    value={budgetAmount}
                    onChange={(e) => setBudgetAmount(e.target.value)}
                    placeholder="e.g. 1500000"
                    className="w-full font-serif border border-gov-border rounded-xs px-3 py-2 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gov-navy uppercase tracking-wider mb-1">
                  Team Composition Requirements
                </label>
                <input
                  type="text"
                  value={teamRequirements}
                  onChange={(e) => setTeamRequirements(e.target.value)}
                  placeholder="e.g. 2 Embedded Engineers, 1 AI/ML Researcher, 1 Environmental Specialist"
                  className="w-full font-serif border border-gov-border rounded-xs px-3 py-2 outline-none"
                />
              </div>

              <div className="pt-3 border-t border-gov-border flex items-center justify-end space-x-2">
                <Button variant="ghost" size="sm" onClick={() => setShowCreateModal(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={submitting} className="bg-gov-maroon text-white">
                  {submitting ? 'Creating Project...' : 'Create Project'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal: Submit Proposal */}
      {proposalProject && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gov-border rounded-sm max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gov-border pb-3">
              <h3 className="font-bold text-gov-navy text-base flex items-center space-x-2">
                <Send className="w-4 h-4 text-gov-maroon" />
                <span>Submit Formal Technical Solution Proposal</span>
              </h3>
              <button
                onClick={() => setProposalProject(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2.5 bg-gov-sand-50 rounded-xs border border-gov-border text-xs">
              <div className="font-bold text-gov-navy">{proposalProject.title}</div>
              <div className="text-gov-text-muted text-[11px] mt-0.5">
                Timeline: {proposalProject.timeline || 'Not provided'} &bull; Budget:{' '}
                {proposalProject.budget?.estimatedAmount !== undefined &&
                proposalProject.budget?.estimatedAmount !== null &&
                proposalProject.budget.estimatedAmount > 0
                  ? `₹${Number(proposalProject.budget.estimatedAmount).toLocaleString('en-IN')}`
                  : 'Not specified'}
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmitProposal} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gov-navy uppercase tracking-wider mb-1">
                  Technical Methodology & Lab Validation Strategy *
                </label>
                <textarea
                  rows={3}
                  required
                  value={methodology}
                  onChange={(e) => setMethodology(e.target.value)}
                  placeholder="Outline scientific methodology, hardware fabrication milestones, and calibration standards..."
                  className="w-full font-serif border border-gov-border rounded-xs p-2 outline-none focus:ring-1 focus:ring-gov-navy"
                />
              </div>

              <div>
                <label className="block font-bold text-gov-navy uppercase tracking-wider mb-1">
                  Expected Societal & Municipal Impact *
                </label>
                <textarea
                  rows={2}
                  required
                  value={expectedImpact}
                  onChange={(e) => setExpectedImpact(e.target.value)}
                  placeholder="Quantify citizen relief, environmental savings, or municipal operational improvements..."
                  className="w-full font-serif border border-gov-border rounded-xs p-2 outline-none focus:ring-1 focus:ring-gov-navy"
                />
              </div>

              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xs text-[11px] text-amber-900">
                <strong>Innovation Council Notice:</strong> Once submitted, this proposal enters formal government review for development grants and pilot deployment permits.
              </div>

              <div className="pt-3 border-t border-gov-border flex items-center justify-end space-x-2">
                <Button variant="ghost" size="sm" onClick={() => setProposalProject(null)} disabled={submitting}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={submitting} className="bg-gov-maroon text-white">
                  {submitting ? 'Submitting...' : 'Submit Formal Proposal'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Modal: View Project Details & Milestones */}
      {viewProject && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gov-border rounded-sm max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gov-border pb-3">
              <div>
                <span className="font-mono text-gov-maroon text-xs font-bold">
                  {viewProject.challengeId ? `Challenge [${viewProject.challengeId.code}]` : 'Project Details'}
                </span>
                <h3 className="font-bold text-gov-navy text-lg leading-snug">
                  {viewProject.title}
                </h3>
              </div>
              <button
                onClick={() => setViewProject(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-gov-sand-50 rounded-xs border border-gov-border space-y-1">
                <span className="font-bold text-gov-navy uppercase text-[10px] block">
                  Proposed Solution Architecture
                </span>
                <p className="text-gov-text-secondary whitespace-pre-line leading-relaxed">
                  {viewProject.proposedSolution}
                </p>
              </div>

              {/* Technologies */}
              <div>
                <span className="font-bold text-gov-navy uppercase text-[10px] block mb-1">
                  Technology Stack
                </span>
                <div className="flex flex-wrap gap-1">
                  {(viewProject.technologies || []).map((t, idx) => (
                    <span key={idx} className="bg-indigo-50 text-indigo-900 border border-indigo-200 px-2 py-0.5 rounded-xs font-semibold text-[11px]">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Milestones */}
              <div>
                <span className="font-bold text-gov-navy uppercase text-[10px] block mb-2">
                  Sprint Milestones & Deliverables ({viewProject.milestones?.length || 0})
                </span>
                <div className="space-y-2">
                  {(viewProject.milestones || []).map((m, idx) => (
                    <div key={idx} className="p-2.5 bg-white border border-gov-border rounded-xs flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-gov-navy">{m.title}</div>
                        <div className="text-gov-text-muted text-[11px]">
                          {Array.isArray(m.deliverables) && m.deliverables.length > 0
                            ? m.deliverables.join(', ')
                            : m.description || 'Not provided'}
                        </div>
                      </div>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-xs ${
                        m.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                        m.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-800' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {m.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Proposal info */}
              {viewProject.proposal?.approvalStatus && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xs space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-emerald-900 uppercase">
                      Formal Proposal ({viewProject.proposal.approvalStatus})
                    </span>
                    <span className="text-emerald-700 font-semibold">
                      Submitted on {new Date(viewProject.proposal.submittedAt).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                  <p className="text-emerald-900 text-xs">
                    {viewProject.proposal.methodology}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-gov-border text-right">
              <Button variant="subtle" size="sm" onClick={() => setViewProject(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UniversityProjectsPage;
