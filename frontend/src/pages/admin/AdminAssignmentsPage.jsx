import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingState from '../../components/common/LoadingState';
import {
  Share2,
  Sparkles,
  GraduationCap,
  Building2,
  Users,
  CheckCircle2,
  ArrowRight,
  Brain,
  Calendar,
  AlertCircle,
  FileCheck,
  Search,
  RefreshCw
} from 'lucide-react';

const AdminAssignmentsPage = () => {
  const [searchParams] = useSearchParams();
  const preselectedChallengeId = searchParams.get('challengeId');

  const [challenges, setChallenges] = useState([]);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [options, setOptions] = useState({
    universities: [],
    departments: [],
    faculties: [],
    teams: [],
    industries: []
  });

  const [loadingList, setLoadingList] = useState(true);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Assignment Form State
  const [formData, setFormData] = useState({
    universityId: '',
    department: '',
    facultyId: '',
    facultyLeadName: '',
    studentTeamId: '',
    industryId: '',
    projectTitle: '',
    deadline: '',
    notes: '',
    createProject: true
  });

  // Load Validated Challenges and Dropdown Options
  const loadInitialData = async () => {
    setLoadingList(true);
    try {
      const [challengesRes, optsRes] = await Promise.all([
        adminService.getChallenges({ status: 'VALIDATED', limit: 50 }),
        adminService.getAssignmentOptions()
      ]);

      const list = challengesRes.data?.challenges || [];
      setChallenges(list);
      setOptions(optsRes.data || { universities: [], departments: [], faculties: [], teams: [], industries: [] });

      // If preselected in query param or first challenge
      const target = preselectedChallengeId
        ? list.find((c) => c._id === preselectedChallengeId) || list[0]
        : list[0];

      if (target) {
        selectChallenge(target);
      }
    } catch (err) {
      console.error('Failed to load assignment data:', err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [preselectedChallengeId]);

  const selectChallenge = async (challenge) => {
    setSelectedChallenge(challenge);
    setSuccessMessage('');
    setFormData({
      universityId: challenge.assignedUniversity?._id || challenge.assignedUniversity || '',
      department: challenge.assignedDepartment || '',
      facultyId: challenge.assignedFaculty?._id || challenge.assignedFaculty || '',
      facultyLeadName: challenge.facultyLead?.name || '',
      studentTeamId: challenge.assignedStudentTeam?._id || challenge.assignedStudentTeam || '',
      industryId: challenge.assignedIndustry?._id || challenge.assignedIndustry || '',
      projectTitle: challenge.title ? `${challenge.title} - Engineering Solution Project` : '',
      deadline: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
      notes: '',
      createProject: true
    });

    // Load AI recommendations for this challenge
    setLoadingRecs(true);
    try {
      const recRes = await adminService.getRecommendations(challenge._id);
      setRecommendations(recRes.data?.recommendations || []);
    } catch (err) {
      console.error('Failed to load AI recommendations:', err);
      setRecommendations([]);
    } finally {
      setLoadingRecs(false);
    }
  };

  const handleApplyRecommendation = (rec) => {
    const uniId = rec.universityId || rec._id;
    setFormData((prev) => ({
      ...prev,
      universityId: uniId,
      department: rec.matchedDepartment || prev.department || 'Computer Science & Engineering',
      notes: `Allocated based on AI recommendation (Score: ${Math.round((rec.score || 0.85) * 100)}% compatibility). ${rec.reason || ''}`
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!selectedChallenge) return;
    if (!formData.universityId) {
      alert('Please select an accredited University institution');
      return;
    }

    setAssigning(true);
    setSuccessMessage('');
    try {
      const res = await adminService.assignUniversity(selectedChallenge._id, formData);
      setSuccessMessage(
        `Challenge [${selectedChallenge.code || 'CHALLENGE'}] successfully assigned! An active innovation project was initialized in MongoDB.`
      );
      // Reload challenge list
      const challengesRes = await adminService.getChallenges({ status: 'VALIDATED', limit: 50 });
      setChallenges(challengesRes.data?.challenges || []);
    } catch (err) {
      alert(err.message || 'Failed to complete assignment');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="space-y-6 font-serif">
      {/* Top Banner */}
      <div className="bg-white border border-gov-border rounded-xs p-6 shadow-gov-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-gov-navy font-bold uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            <span>Intelligent Institutional Routing & Co-sponsorship</span>
          </div>
          <h1 className="text-2xl font-bold text-gov-navy">
            Smart Routing & Challenge Assignment Center
          </h1>
          <p className="text-xs text-gov-text-secondary mt-1 max-w-3xl leading-relaxed">
            Direct validated civic problem statements to specialized university departments, faculty mentors, student innovator teams, and industry co-sponsors with AI recommendation assistance.
          </p>
        </div>

        <div className="flex items-center space-x-3 flex-shrink-0">
          <Button variant="subtle" size="sm" onClick={loadInitialData} icon={RefreshCw}>
            Refresh Queue
          </Button>
          <Link to="/admin/projects">
            <Button variant="primary" size="sm">
              View Active Projects
            </Button>
          </Link>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-serif rounded-xs flex items-center space-x-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {loadingList ? (
        <LoadingState message="Loading validated challenge queue and institutional directories..." />
      ) : challenges.length === 0 ? (
        <Card accent="none" className="p-12 text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
          <h3 className="text-base font-bold text-gov-navy">No Challenges Awaiting Assignment</h3>
          <p className="text-xs text-gov-text-secondary max-w-md mx-auto">
            All validated community challenges have already been routed to participating universities or no challenges are in VALIDATED status.
          </p>
          <div className="pt-2">
            <Link to="/admin/validation-queue">
              <Button variant="primary" size="sm">
                Go to Validation Queue
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Challenge Queue (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-gov-navy">
                Validated Challenges ({challenges.length})
              </span>
            </div>

            <div className="space-y-2 max-h-[700px] overflow-y-auto pr-1">
              {challenges.map((c) => {
                const isSelected = selectedChallenge?._id === c._id;
                return (
                  <div
                    key={c._id}
                    onClick={() => selectChallenge(c)}
                    className={`p-4 border rounded-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'border-gov-navy bg-gov-sand-50 shadow-sm'
                        : 'border-gov-border bg-white hover:border-gov-navy/50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-mono font-bold text-gov-maroon">
                        {c.code || `DEL-${c._id.slice(-4).toUpperCase()}`}
                      </span>
                      <span className="font-medium text-gov-text-muted">{c.district}</span>
                    </div>

                    <h4 className="text-xs font-bold text-gov-navy line-clamp-2 leading-snug">
                      {c.title}
                    </h4>

                    <div className="flex items-center space-x-2 mt-2">
                      <Badge variant="navy">{c.category}</Badge>
                      <span className="text-[10px] text-gov-text-muted">
                        Priority: <strong>{c.priority || 'Medium'}</strong>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: AI Recommendations & Assignment Form (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {selectedChallenge && (
              <>
                {/* Active Challenge Summary Card */}
                <Card accent="navy" className="p-5">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-gov-maroon">
                        {selectedChallenge.code || 'CHALLENGE'}
                      </span>
                      <StatusBadge status={selectedChallenge.status} />
                      <Badge variant="navy">{selectedChallenge.category}</Badge>
                    </div>

                    <h2 className="text-base font-bold text-gov-navy">
                      {selectedChallenge.title}
                    </h2>

                    <p className="text-xs text-gov-text-secondary leading-relaxed">
                      {selectedChallenge.description}
                    </p>

                    {selectedChallenge.expectedOutcome && (
                      <div className="pt-2 text-xs border-t border-gov-border text-gov-text-muted">
                        Expected Outcome: <em>{selectedChallenge.expectedOutcome}</em>
                      </div>
                    )}
                  </div>
                </Card>

                {/* AI-Powered Smart Routing Recommendations */}
                <Card
                  accent="amber"
                  title="AI-Assisted University Recommendations"
                  subtitle="Machine learning domain alignment based on research faculty, university departments, and problem category"
                  headerAction={
                    <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-xs flex items-center space-x-1">
                      <Sparkles className="w-3 h-3 text-amber-700" />
                      <span>SentenceTransformers Matched</span>
                    </span>
                  }
                >
                  {loadingRecs ? (
                    <LoadingState message="Calculating AI compatibility scores across Delhi universities..." />
                  ) : recommendations.length === 0 ? (
                    <div className="text-xs text-gov-text-muted py-2">
                      No automated matching scored above threshold. You can manually assign any registered university below.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recommendations.slice(0, 3).map((rec, idx) => {
                        const scorePercent = Math.round((rec.score || (0.95 - idx * 0.08)) * 100);
                        return (
                          <div
                            key={idx}
                            className="p-3 border border-gov-border rounded-xs bg-gov-sand-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <GraduationCap className="w-4 h-4 text-gov-navy flex-shrink-0" />
                                <span className="font-bold text-gov-navy text-sm">
                                  {rec.universityName || rec.name || 'Accredited Institution'}
                                </span>
                                <span className="font-mono font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded-xs text-[10px]">
                                  {scorePercent}% Fit
                                </span>
                              </div>
                              <p className="text-gov-text-secondary text-[11px] leading-snug">
                                {rec.reason || `Strong academic synergy in ${selectedChallenge.category} research and lab facilities.`}
                              </p>
                            </div>

                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleApplyRecommendation(rec)}
                              className="flex-shrink-0"
                            >
                              Apply to Form
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>

                {/* Final Administrative Assignment Form */}
                <Card
                  accent="navy"
                  title="Official Allocation & Project Setup"
                  subtitle="Submit official administrative routing decision to create project and dispatch institutional notifications"
                >
                  <form onSubmit={handleFormSubmit} className="space-y-4 text-xs font-serif">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* University Selection */}
                      <div>
                        <label className="block text-gov-navy font-bold mb-1">
                          Accredited University Institution <span className="text-rose-600">*</span>
                        </label>
                        <select
                          required
                          value={formData.universityId}
                          onChange={(e) => setFormData({ ...formData, universityId: e.target.value })}
                          className="w-full border border-gov-border rounded-xs px-3 py-2 bg-white text-gov-navy focus:outline-none focus:border-gov-navy"
                        >
                          <option value="">-- Select University --</option>
                          {options.universities.map((u) => (
                            <option key={u._id} value={u._id}>
                              {u.name} ({u.district || 'Delhi'})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Department Selection */}
                      <div>
                        <label className="block text-gov-navy font-bold mb-1">
                          Lead Academic Department
                        </label>
                        <select
                          value={formData.department}
                          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                          className="w-full border border-gov-border rounded-xs px-3 py-2 bg-white text-gov-navy focus:outline-none focus:border-gov-navy"
                        >
                          <option value="">-- Select Department --</option>
                          {options.departments.map((d, i) => (
                            <option key={i} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Faculty Mentor */}
                      <div>
                        <label className="block text-gov-navy font-bold mb-1">
                          Supervising Faculty Mentor
                        </label>
                        <select
                          value={formData.facultyId}
                          onChange={(e) => setFormData({ ...formData, facultyId: e.target.value })}
                          className="w-full border border-gov-border rounded-xs px-3 py-2 bg-white text-gov-navy focus:outline-none focus:border-gov-navy"
                        >
                          <option value="">-- Optional: Assign Faculty Mentor --</option>
                          {options.faculties.map((f) => (
                            <option key={f._id} value={f._id}>
                              {f.user?.name || f.name} - {f.department || 'Faculty'}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Student Team */}
                      <div>
                        <label className="block text-gov-navy font-bold mb-1">
                          Designated Student Team
                        </label>
                        <select
                          value={formData.studentTeamId}
                          onChange={(e) => setFormData({ ...formData, studentTeamId: e.target.value })}
                          className="w-full border border-gov-border rounded-xs px-3 py-2 bg-white text-gov-navy focus:outline-none focus:border-gov-navy"
                        >
                          <option value="">-- Optional: Designate Student Cohort --</option>
                          {options.teams.map((t) => (
                            <option key={t._id} value={t._id}>
                              {t.name} ({t.university?.name || 'University'})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Industry Co-Sponsor */}
                      <div>
                        <label className="block text-gov-navy font-bold mb-1">
                          Industry / Startup Co-Sponsor
                        </label>
                        <select
                          value={formData.industryId}
                          onChange={(e) => setFormData({ ...formData, industryId: e.target.value })}
                          className="w-full border border-gov-border rounded-xs px-3 py-2 bg-white text-gov-navy focus:outline-none focus:border-gov-navy"
                        >
                          <option value="">-- Optional: Link Industry Partner --</option>
                          {options.industries.map((ind) => (
                            <option key={ind._id} value={ind._id}>
                              {ind.name} ({ind.organization || 'Corporate Partner'})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Estimated Deadline */}
                      <div>
                        <label className="block text-gov-navy font-bold mb-1">
                          Target Deployment Deadline
                        </label>
                        <input
                          type="date"
                          value={formData.deadline}
                          onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                          className="w-full border border-gov-border rounded-xs px-3 py-2 text-xs focus:outline-none focus:border-gov-navy"
                        />
                      </div>
                    </div>

                    {/* Project Title */}
                    <div>
                      <label className="block text-gov-navy font-bold mb-1">
                        Active Project Title
                      </label>
                      <input
                        type="text"
                        value={formData.projectTitle}
                        onChange={(e) => setFormData({ ...formData, projectTitle: e.target.value })}
                        placeholder="Project title for engineering workspace..."
                        className="w-full border border-gov-border rounded-xs px-3 py-2 text-xs focus:outline-none focus:border-gov-navy"
                      />
                    </div>

                    {/* Official Assignment Directives */}
                    <div>
                      <label className="block text-gov-navy font-bold mb-1">
                        Administrative Directives & Field Instructions
                      </label>
                      <textarea
                        rows="3"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Specific mandate from Delhi State Innovation Council, technical expectations, or ward coordination guidelines..."
                        className="w-full border border-gov-border rounded-xs p-3 text-xs focus:outline-none focus:border-gov-navy"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gov-border">
                      <div className="text-[11px] text-gov-text-muted">
                        Submitting will update challenge status to <strong>ASSIGNED</strong> and notify institutional leads.
                      </div>

                      <Button
                        type="submit"
                        variant="primary"
                        size="md"
                        disabled={assigning}
                        icon={FileCheck}
                      >
                        {assigning ? 'Routing & Provisioning...' : 'Confirm & Formally Assign'}
                      </Button>
                    </div>
                  </form>
                </Card>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAssignmentsPage;
