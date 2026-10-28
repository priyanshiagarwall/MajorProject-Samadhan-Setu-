import React, { useState, useEffect } from 'react';
import { projectService } from '../../services/projectService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import {
  Users2,
  Plus,
  Trash2,
  GraduationCap,
  Briefcase,
  CheckCircle,
  X,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

const ROLE_OPTIONS = [
  'Team Lead',
  'Frontend',
  'Backend',
  'AI/ML',
  'Research',
  'Hardware',
  'Documentation',
  'Testing'
];

const UniversityTeamsPage = () => {
  const [teams, setTeams] = useState([]);
  const [projects, setProjects] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [studentList, setStudentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Create Team Modal
  const [showModal, setShowModal] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedMentor, setSelectedMentor] = useState('');
  const [members, setMembers] = useState([]); // [{ student: id, role: string }]

  // Disband confirmation modal
  const [disbandingTeam, setDisbandingTeam] = useState(null);
  const [disbanding, setDisbanding] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setErrorMsg('');
    try {
      const [teamsRes, projRes, facRes, stuRes] = await Promise.all([
        projectService.getTeams(),
        projectService.getProjects(),
        projectService.getFaculty(),
        projectService.getStudents()
      ]);
      setTeams(teamsRes.data?.teams || []);
      setProjects(projRes.data?.projects || []);
      setFacultyList(facRes.data?.faculty || []);
      setStudentList(stuRes.data?.students || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load university teams and student cohorts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = () => {
    setShowModal(true);
    setErrorMsg('');
    // Pick first candidate that is unassigned
    const available = studentList.filter((s) => !s.assignedTeam);
    if (available.length > 0) {
      setMembers([{ student: available[0]._id, role: 'Team Lead' }]);
    } else if (studentList.length > 0) {
      setMembers([{ student: studentList[0]._id, role: 'Team Lead' }]);
    } else {
      setMembers([]);
    }
  };

  const handleAddMemberRow = () => {
    if (studentList.length === 0) return;
    const currentSelected = members.map((m) => m.student);
    const candidate =
      studentList.find((s) => !s.assignedTeam && !currentSelected.includes(s._id)) ||
      studentList.find((s) => !currentSelected.includes(s._id)) ||
      studentList[0];
    setMembers([...members, { student: candidate._id, role: 'Research' }]);
  };

  const handleMemberChange = (idx, field, value) => {
    const updated = [...members];
    updated[idx][field] = value;
    setMembers(updated);
  };

  const handleRemoveMemberRow = (idx) => {
    setMembers(members.filter((_, i) => i !== idx));
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!teamName.trim()) return;

    // Client-side duplicate check
    const studentIds = members.map((m) => m.student);
    if (new Set(studentIds).size !== studentIds.length) {
      setErrorMsg('Duplicate students selected in team members list. Each student can only be added once.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      await projectService.createTeam({
        name: teamName.trim(),
        project: selectedProject || undefined,
        facultyMentor: selectedMentor || undefined,
        members
      });

      setActionSuccess(`Multidisciplinary team "${teamName}" created and assigned!`);
      setShowModal(false);
      setTeamName('');
      setSelectedProject('');
      setSelectedMentor('');
      setMembers([]);
      fetchData();
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create team');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDisband = async () => {
    if (!disbandingTeam) return;
    setDisbanding(true);
    setErrorMsg('');
    try {
      await projectService.deleteTeam(disbandingTeam._id);
      setActionSuccess(`Team "${disbandingTeam.name}" disbanded successfully.`);
      setDisbandingTeam(null);
      fetchData();
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to disband team');
    } finally {
      setDisbanding(false);
    }
  };

  return (
    <div className="space-y-6 font-serif">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold text-gov-maroon uppercase tracking-wider mb-1 flex items-center space-x-1.5">
            <Users2 className="w-4 h-4 text-gov-maroon" />
            <span>Multidisciplinary Student Cohorts</span>
          </div>
          <h1 className="text-2xl font-bold text-gov-navy">
            Student Innovation Teams ({teams.length})
          </h1>
          <p className="text-xs text-gov-text-secondary mt-0.5">
            Form cross-departmental teams combining engineering, biotechnology, and data science innovators for assigned municipal projects.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="subtle" size="sm" onClick={fetchData} icon={RefreshCw}>
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenModal}
            icon={Plus}
            className="bg-gov-maroon hover:bg-gov-maroon-dark text-white"
          >
            Form New Team
          </Button>
        </div>
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

      {loading ? (
        <LoadingState message="Loading multidisciplinary student teams..." />
      ) : error ? (
        <ErrorState
          title="Failed to Load Teams"
          message={error}
          onRetry={fetchData}
          retryLabel="Retry Loading Teams"
        />
      ) : teams.length === 0 ? (
        <Card accent="none" className="py-12 text-center text-xs text-gov-text-muted space-y-3">
          <p className="font-bold text-gov-navy text-sm">No Student Teams Formed Yet</p>
          <p className="max-w-md mx-auto text-[11px]">
            Assemble cross-functional teams with hardware, software, AI/ML, and research roles linked to university innovation projects.
          </p>
          <Button variant="primary" size="sm" onClick={handleOpenModal} icon={Plus}>
            Form First Team
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {teams.map((t) => (
            <Card key={t._id} accent="maroon" className="p-5 space-y-4">
              <div className="flex items-start justify-between border-b border-gov-border pb-3">
                <div>
                  <h3 className="font-bold text-gov-navy text-base leading-snug">
                    {t.name || 'Not provided'}
                  </h3>
                  <div className="text-[11px] text-gov-text-muted mt-0.5 flex items-center space-x-2">
                    {t.project ? (
                      <span className="font-semibold text-gov-maroon flex items-center">
                        <Briefcase className="w-3.5 h-3.5 mr-1" />
                        Project: {t.project.title || 'Not provided'}
                      </span>
                    ) : (
                      <span>Project: Not provided</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Badge variant="navy">
                    {t.members?.length || 0} Members
                  </Badge>
                  <button
                    type="button"
                    onClick={() => setDisbandingTeam(t)}
                    className="text-gray-400 hover:text-red-600 p-1 rounded-xs transition-colors"
                    title="Disband Team"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Faculty Mentor */}
              {t.facultyMentor && (
                <div className="p-2.5 bg-gov-sand-50 rounded-xs border border-gov-border flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <GraduationCap className="w-4 h-4 text-gov-maroon" />
                    <div>
                      <span className="font-bold text-gov-navy">{t.facultyMentor.name || 'Not provided'}</span>
                      <span className="text-gray-500 text-[10px] ml-1">
                        ({t.facultyMentor.department || 'Not provided'})
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase text-gov-maroon bg-white px-1.5 py-0.5 rounded-xs border border-gov-border">
                    Supervising Mentor
                  </span>
                </div>
              )}

              {/* Members Table */}
              <div className="space-y-1.5">
                <span className="font-bold text-gov-navy uppercase text-[10px] block tracking-wider">
                  Multidisciplinary Innovator Roster
                </span>
                <div className="divide-y divide-gov-border border border-gov-border rounded-xs bg-white text-xs">
                  {(t.members || []).map((m, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between hover:bg-gov-sand-50">
                      <div>
                        <div className="font-bold text-gov-navy">
                          {m.student?.name || 'Not provided'}
                        </div>
                        <div className="text-[10px] text-gray-500">
                          {m.student?.department || 'Not provided'} &bull; {m.student?.year || 'Not provided'}
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-xs uppercase ${
                        m.role === 'Team Lead' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                        m.role === 'AI/ML' ? 'bg-indigo-100 text-indigo-900' :
                        m.role === 'Hardware' ? 'bg-emerald-100 text-emerald-900' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {m.role || 'Research'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal: Form Multidisciplinary Team */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gov-border rounded-sm max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gov-border pb-3">
              <h3 className="font-bold text-gov-navy text-lg flex items-center space-x-2">
                <Users2 className="w-5 h-5 text-gov-maroon" />
                <span>Form Multidisciplinary Student Team</span>
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTeam} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gov-navy uppercase tracking-wider mb-1">
                  Team Name *
                </label>
                <input
                  type="text"
                  required
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g. BioMethan-X Research Cohort"
                  className="w-full font-serif border border-gov-border rounded-xs px-3 py-2 outline-none focus:ring-1 focus:ring-gov-navy"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gov-navy uppercase tracking-wider mb-1">
                    Assigned Innovation Project
                  </label>
                  <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="w-full font-serif border border-gov-border rounded-xs px-3 py-2 bg-white outline-none"
                  >
                    <option value="">-- Optional: Link to Project --</option>
                    {projects.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
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
                    <option value="">-- Optional: Assign Mentor --</option>
                    {facultyList.map((f) => (
                      <option key={f._id} value={f._id}>
                        {f.name} ({f.department})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Members Configuration */}
              <div className="space-y-2 pt-2 border-t border-gov-border">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gov-navy uppercase text-[10px] tracking-wider">
                    Student Members & Designated Roles ({members.length})
                  </span>
                  <Button
                    variant="subtle"
                    size="sm"
                    type="button"
                    onClick={handleAddMemberRow}
                    icon={Plus}
                    disabled={studentList.length === 0}
                  >
                    Add Member
                  </Button>
                </div>

                {studentList.length === 0 ? (
                  <div className="p-4 text-center text-gov-text-muted bg-gov-sand-50 border border-gov-border rounded-xs">
                    No registered students found. Please onboard students in the Students directory before forming teams.
                  </div>
                ) : members.length === 0 ? (
                  <div className="p-4 text-center text-gov-text-muted bg-gov-sand-50 border border-gov-border rounded-xs">
                    No students added yet. Click &quot;Add Member&quot; above to assign innovators.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {members.map((m, idx) => {
                      const otherSelectedIds = members
                        .filter((_, i) => i !== idx)
                        .map((other) => other.student);

                      return (
                        <div key={idx} className="p-2.5 bg-gov-sand-50 rounded-xs border border-gov-border flex items-center space-x-2">
                          <select
                            value={m.student}
                            onChange={(e) => handleMemberChange(idx, 'student', e.target.value)}
                            className="flex-1 font-serif border border-gov-border rounded-xs px-2 py-1 text-xs bg-white"
                          >
                            {studentList.map((s) => {
                              const isAlreadySelected = otherSelectedIds.includes(s._id);
                              return (
                                <option
                                  key={s._id}
                                  value={s._id}
                                  disabled={isAlreadySelected}
                                >
                                  {s.name} ({s.department} - {s.year})
                                  {s.assignedTeam ? ' [Currently Assigned]' : ''}
                                  {isAlreadySelected ? ' (Already Selected)' : ''}
                                </option>
                              );
                            })}
                          </select>

                          <select
                            value={m.role}
                            onChange={(e) => handleMemberChange(idx, 'role', e.target.value)}
                            className="w-36 font-serif border border-gov-border rounded-xs px-2 py-1 text-xs bg-white font-semibold"
                          >
                            {ROLE_OPTIONS.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>

                          <button
                            type="button"
                            onClick={() => handleRemoveMemberRow(idx)}
                            className="text-gray-400 hover:text-red-600 p-1"
                            title="Remove Row"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-gov-border flex items-center justify-end space-x-2">
                <Button variant="ghost" size="sm" onClick={() => setShowModal(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  disabled={submitting || members.length === 0}
                  className="bg-gov-maroon text-white"
                >
                  {submitting ? 'Creating Team...' : 'Form Team & Assign Roles'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-App Confirmation Modal: Disband Team */}
      {disbandingTeam && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gov-border rounded-sm max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-2 text-rose-700 border-b border-gov-border pb-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <h3 className="font-bold text-gov-navy text-base">
                Disband Team &quot;{disbandingTeam.name}&quot;?
              </h3>
            </div>

            <p className="text-xs text-gov-text-secondary leading-relaxed">
              Are you sure you want to disband this team? Associated project links and student assignments will be safely unlinked. This action cannot be undone.
            </p>

            <div className="pt-2 flex items-center justify-end space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDisbandingTeam(null)}
                disabled={disbanding}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmDisband}
                disabled={disbanding}
                className="bg-rose-700 hover:bg-rose-800 text-white"
              >
                {disbanding ? 'Disbanding...' : 'Disband Team'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UniversityTeamsPage;
