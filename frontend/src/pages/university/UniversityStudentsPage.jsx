import React, { useState, useEffect } from 'react';
import { projectService } from '../../services/projectService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import {
  Users,
  Plus,
  Trash2,
  Mail,
  Users2,
  CheckCircle,
  X,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

const UniversityStudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add Student Modal
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('3rd Year B.Tech');
  const [skills, setSkills] = useState('');
  const [expertise, setExpertise] = useState('');

  // Remove Student in-app confirmation modal
  const [removingStudent, setRemovingStudent] = useState(null);
  const [removing, setRemoving] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchStudents = async () => {
    setLoading(true);
    setError(null);
    setErrorMsg('');
    try {
      const res = await projectService.getStudents();
      setStudents(res.data?.students || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load student innovators directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !department.trim()) return;

    setSubmitting(true);
    setErrorMsg('');
    try {
      await projectService.addStudent({
        name: name.trim(),
        email: email.trim(),
        department: department.trim(),
        year: year.trim(),
        skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
        expertise: expertise.split(',').map((e) => e.trim()).filter(Boolean)
      });

      setActionSuccess(`Student innovator ${name} registered successfully!`);
      setShowModal(false);
      setName('');
      setEmail('');
      setDepartment('');
      setYear('3rd Year B.Tech');
      setSkills('');
      setExpertise('');
      fetchStudents();
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to add student');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmRemove = async () => {
    if (!removingStudent) return;

    setRemoving(true);
    setErrorMsg('');
    try {
      await projectService.removeStudent(removingStudent._id);
      setActionSuccess(`Student ${removingStudent.name} removed from active roster.`);
      setRemovingStudent(null);
      fetchStudents();
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to remove student');
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="space-y-6 font-serif">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold text-gov-maroon uppercase tracking-wider mb-1 flex items-center space-x-1.5">
            <Users className="w-4 h-4 text-gov-maroon" />
            <span>Student Innovator & Developer Directory</span>
          </div>
          <h1 className="text-2xl font-bold text-gov-navy">
            Student Innovators ({students.length})
          </h1>
          <p className="text-xs text-gov-text-secondary mt-0.5">
            Undergraduate and postgraduate student engineers registered for multidisciplinary municipal innovation teams.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="subtle" size="sm" onClick={fetchStudents} icon={RefreshCw}>
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowModal(true)}
            icon={Plus}
            className="bg-gov-maroon hover:bg-gov-maroon-dark text-white"
          >
            Add Student Profile
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
        <LoadingState message="Loading student innovators & technical competencies..." />
      ) : error ? (
        <ErrorState
          title="Failed to Load Student Directory"
          message={error}
          onRetry={fetchStudents}
          retryLabel="Retry Loading Students"
        />
      ) : students.length === 0 ? (
        <Card accent="none" className="py-12 text-center text-xs text-gov-text-muted space-y-3">
          <p className="font-bold text-gov-navy text-sm">No Students Registered</p>
          <p className="max-w-md mx-auto text-[11px]">
            Onboard student engineers with their departmental skills and year to assign them to innovation cohorts.
          </p>
          <Button variant="primary" size="sm" onClick={() => setShowModal(true)} icon={Plus}>
            Add First Student
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {students.map((s) => (
            <Card key={s._id} accent="navy" className="p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-gov-navy text-sm leading-snug">
                      {s.name || 'Not provided'}
                    </h3>
                    <div className="text-[11px] text-gov-maroon font-semibold">
                      {s.department || 'Not provided'}
                    </div>
                  </div>
                  <button
                    onClick={() => setRemovingStudent(s)}
                    className="text-gray-300 hover:text-red-600 p-1 rounded-xs transition-colors"
                    title="Remove Student Profile"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="p-2 bg-gov-sand-50 rounded-xs border border-gov-border text-xs space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-gray-500">Year:</span>
                    <span className="font-bold text-gov-navy">{s.year || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1 border-t border-gov-border">
                    <span className="flex items-center truncate">
                      <Mail className="w-3 h-3 mr-1 flex-shrink-0" />
                      {s.email || 'Not provided'}
                    </span>
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-gov-text-muted block mb-1">
                    Technical Skills
                  </span>
                  {s.skills && s.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {s.skills.map((sk, idx) => (
                        <span
                          key={idx}
                          className="bg-emerald-50 text-emerald-900 border border-emerald-200 text-[10px] font-medium px-1.5 py-0.2 rounded-xs"
                        >
                          {sk}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400 italic text-[10px]">Not provided</span>
                  )}
                </div>
              </div>

              {/* Team Assignment */}
              <div className="pt-2 border-t border-gov-border text-[11px]">
                {s.assignedTeam ? (
                  <span className="text-indigo-900 font-bold flex items-center">
                    <Users2 className="w-3.5 h-3.5 mr-1 text-indigo-600 flex-shrink-0" />
                    <span className="truncate" title={s.assignedTeam.name}>
                      Team: {s.assignedTeam.name || 'Not provided'}
                    </span>
                  </span>
                ) : (
                  <span className="text-gray-400 italic">Available for Cohort</span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal: Add Student Profile */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gov-border rounded-sm max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gov-border pb-3">
              <h3 className="font-bold text-gov-navy text-lg flex items-center space-x-2">
                <Users className="w-5 h-5 text-gov-maroon" />
                <span>Onboard Student Innovator</span>
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddStudent} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gov-navy uppercase tracking-wider mb-1">
                  Full Student Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Aarav Malhotra"
                  className="w-full font-serif border border-gov-border rounded-xs px-3 py-2 outline-none focus:ring-1 focus:ring-gov-navy"
                />
              </div>

              <div>
                <label className="block font-bold text-gov-navy uppercase tracking-wider mb-1">
                  Student Institutional Email *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. aarav.malhotra@dtu.ac.in"
                  className="w-full font-serif border border-gov-border rounded-xs px-3 py-2 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gov-navy uppercase tracking-wider mb-1">
                    Department *
                  </label>
                  <input
                    type="text"
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Computer Science"
                    className="w-full font-serif border border-gov-border rounded-xs px-3 py-2 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gov-navy uppercase tracking-wider mb-1">
                    Academic Year *
                  </label>
                  <input
                    type="text"
                    required
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="e.g. 3rd Year B.Tech"
                    className="w-full font-serif border border-gov-border rounded-xs px-3 py-2 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gov-navy uppercase tracking-wider mb-1">
                  Technical Skills (Comma-separated)
                </label>
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="e.g. Python, TensorFlow, React, FastAPI, LoRaWAN"
                  className="w-full font-serif border border-gov-border rounded-xs px-3 py-2 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gov-navy uppercase tracking-wider mb-1">
                  Domain Expertise (Comma-separated)
                </label>
                <input
                  type="text"
                  value={expertise}
                  onChange={(e) => setExpertise(e.target.value)}
                  placeholder="e.g. AI/ML, Backend, Hardware, Research"
                  className="w-full font-serif border border-gov-border rounded-xs px-3 py-2 outline-none"
                />
              </div>

              <div className="pt-3 border-t border-gov-border flex items-center justify-end space-x-2">
                <Button variant="ghost" size="sm" onClick={() => setShowModal(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={submitting} className="bg-gov-maroon text-white">
                  {submitting ? 'Registering...' : 'Add Student Profile'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-App Confirmation Modal: Remove Student */}
      {removingStudent && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gov-border rounded-sm max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-2 text-rose-700 border-b border-gov-border pb-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <h3 className="font-bold text-gov-navy text-base">
                Remove Student &quot;{removingStudent.name}&quot;?
              </h3>
            </div>

            <p className="text-xs text-gov-text-secondary leading-relaxed">
              Are you sure you want to remove <strong>{removingStudent.name}</strong> from the active student directory? If this student is currently assigned to a multidisciplinary cohort, they will be removed from team membership.
            </p>

            <div className="pt-2 flex items-center justify-end space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRemovingStudent(null)}
                disabled={removing}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmRemove}
                disabled={removing}
                className="bg-rose-700 hover:bg-rose-800 text-white"
              >
                {removing ? 'Removing...' : 'Remove Student'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UniversityStudentsPage;
