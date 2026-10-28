import React, { useState, useEffect } from 'react';
import { projectService } from '../../services/projectService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import {
  GraduationCap,
  Plus,
  Trash2,
  Briefcase,
  Mail,
  Award,
  CheckCircle,
  X,
  RefreshCw,
  Layers
} from 'lucide-react';

const UniversityFacultyPage = () => {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add Faculty Modal
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [experience, setExperience] = useState('8 Years');
  const [expertiseTags, setExpertiseTags] = useState('');

  // Delete Faculty Confirmation Modal
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchFaculty = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await projectService.getFaculty();
      setFaculty(res.data?.faculty || []);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to load faculty mentor directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculty();
  }, []);

  const handleAddFaculty = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !department.trim() || !specialization.trim()) return;

    setSubmitting(true);
    setErrorMsg('');
    try {
      await projectService.addFaculty({
        name: name.trim(),
        email: email.trim(),
        department: department.trim(),
        specialization: specialization.trim(),
        experience: experience.trim(),
        expertise: expertiseTags.split(',').map((t) => t.trim()).filter(Boolean)
      });

      setActionSuccess(`Faculty mentor ${name} added successfully!`);
      setShowModal(false);
      setName('');
      setEmail('');
      setDepartment('');
      setSpecialization('');
      setExperience('8 Years');
      setExpertiseTags('');
      fetchFaculty();
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to add faculty mentor');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenRemoveModal = (id, facName) => {
    setDeleteError('');
    setConfirmDelete({ id, name: facName });
  };

  const handleConfirmRemove = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await projectService.removeFaculty(confirmDelete.id);
      setActionSuccess(`Faculty mentor ${confirmDelete.name || ''} removed from active roster.`);
      setConfirmDelete(null);
      fetchFaculty();
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      setDeleteError(err.response?.data?.message || err.message || 'Failed to remove faculty mentor');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 font-serif">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold text-gov-maroon uppercase tracking-wider mb-1 flex items-center space-x-1.5">
            <GraduationCap className="w-4 h-4 text-gov-maroon" />
            <span>Academic Faculty Mentorship Directory</span>
          </div>
          <h1 className="text-2xl font-bold text-gov-navy">
            Faculty Mentors & Supervisors ({faculty.length})
          </h1>
          <p className="text-xs text-gov-text-secondary mt-0.5">
            Accredited university principal investigators guiding multidisciplinary student cohorts on Delhi municipal solutions.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="subtle" size="sm" onClick={fetchFaculty} icon={RefreshCw}>
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowModal(true)}
            icon={Plus}
            className="bg-gov-maroon hover:bg-gov-maroon-dark text-white"
          >
            Add Faculty Mentor
          </Button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xs flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {errorMsg && faculty.length > 0 && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xs">
          {errorMsg}
        </div>
      )}

      {loading ? (
        <LoadingState message="Loading accredited faculty mentors & supervisory research areas..." />
      ) : errorMsg && faculty.length === 0 ? (
        <ErrorState
          title="Unable to Load Faculty Directory"
          message={errorMsg}
          onRetry={fetchFaculty}
        />
      ) : faculty.length === 0 ? (
        <Card accent="none" className="py-12 text-center text-xs text-gov-text-muted space-y-3">
          <p className="font-bold text-gov-navy text-sm">No Faculty Mentors Registered</p>
          <p className="max-w-md mx-auto text-[11px]">
            Add faculty members to supervise student cohorts and review sprint deliverables.
          </p>
          <Button variant="primary" size="sm" onClick={() => setShowModal(true)} icon={Plus}>
            Add First Faculty Mentor
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {faculty.map((f) => (
            <Card key={f._id} accent="navy" className="p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-gov-navy text-sm leading-snug">
                      {f.name || 'Not provided'}
                    </h3>
                    <div className="text-[11px] text-gov-maroon font-semibold">
                      {f.department || 'Not provided'}
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenRemoveModal(f._id, f.name)}
                    className="text-gray-300 hover:text-red-600 p-1 transition-colors"
                    title="Remove Faculty Mentor"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="p-2 bg-gov-sand-50 rounded-xs border border-gov-border text-xs space-y-1">
                  <div>
                    <span className="text-[10px] text-gov-text-muted uppercase font-bold block">
                      Core Specialization
                    </span>
                    <span className="text-gov-navy font-semibold text-[11px]">{f.specialization || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1 border-t border-gov-border">
                    <span>Experience: <strong>{f.experience || 'Not provided'}</strong></span>
                    <span className="flex items-center">
                      <Mail className="w-3 h-3 mr-1" />
                      {f.email || 'Not provided'}
                    </span>
                  </div>
                </div>

                {/* Expertise Chips */}
                {f.expertise && f.expertise.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {f.expertise.map((exp, idx) => (
                      <span
                        key={idx}
                        className="bg-indigo-50 text-indigo-900 border border-indigo-200 text-[10px] font-semibold px-1.5 py-0.2 rounded-xs"
                      >
                        {exp}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Assigned Projects */}
              <div className="pt-2 border-t border-gov-border text-[11px] text-gov-text-secondary space-y-1">
                <span className="font-bold text-gov-navy block">
                  Assigned Projects ({f.assignedProjects?.length || 0}):
                </span>
                {f.assignedProjects && f.assignedProjects.length > 0 ? (
                  <ul className="space-y-0.5">
                    {f.assignedProjects.map((p) => {
                      const pTitle = typeof p === 'object' && p.title ? p.title : (typeof p === 'string' ? p : 'Not provided');
                      const pKey = typeof p === 'object' && p._id ? p._id : p;
                      return (
                        <li
                          key={pKey}
                          className="text-[10px] text-gov-text-secondary flex items-center space-x-1.5 truncate"
                          title={pTitle}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-gov-maroon flex-shrink-0" />
                          <span className="truncate">{pTitle}</span>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <span className="text-[10px] text-gov-text-muted italic">None assigned</span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal: Add Faculty Mentor */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gov-border rounded-sm max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gov-border pb-3">
              <h3 className="font-bold text-gov-navy text-lg flex items-center space-x-2">
                <GraduationCap className="w-5 h-5 text-gov-maroon" />
                <span>Onboard Academic Faculty Mentor</span>
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddFaculty} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gov-navy uppercase tracking-wider mb-1">
                  Full Name & Title *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Prof. S. K. Sharma"
                  className="w-full font-serif border border-gov-border rounded-xs px-3 py-2 outline-none focus:ring-1 focus:ring-gov-navy"
                />
              </div>

              <div>
                <label className="block font-bold text-gov-navy uppercase tracking-wider mb-1">
                  Official Institutional Email *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. sksharma@dtu.ac.in"
                  className="w-full font-serif border border-gov-border rounded-xs px-3 py-2 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gov-navy uppercase tracking-wider mb-1">
                  Department *
                </label>
                <input
                  type="text"
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Department of Environmental Engineering"
                  className="w-full font-serif border border-gov-border rounded-xs px-3 py-2 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gov-navy uppercase tracking-wider mb-1">
                  Research Specialization *
                </label>
                <input
                  type="text"
                  required
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  placeholder="e.g. Biomethanation & Anaerobic Waste Digestion"
                  className="w-full font-serif border border-gov-border rounded-xs px-3 py-2 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gov-navy uppercase tracking-wider mb-1">
                    Academic Experience
                  </label>
                  <input
                    type="text"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    placeholder="e.g. 12 Years"
                    className="w-full font-serif border border-gov-border rounded-xs px-3 py-2 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gov-navy uppercase tracking-wider mb-1">
                    Expertise Tags (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={expertiseTags}
                    onChange={(e) => setExpertiseTags(e.target.value)}
                    placeholder="e.g. IoT, AI/ML, Clean Water"
                    className="w-full font-serif border border-gov-border rounded-xs px-3 py-2 outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-gov-border flex items-center justify-end space-x-2">
                <Button variant="ghost" size="sm" onClick={() => setShowModal(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={submitting} className="bg-gov-maroon text-white">
                  {submitting ? 'Registering...' : 'Add Mentor to Roster'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Faculty Removal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gov-border rounded-sm max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gov-border pb-3">
              <h3 className="font-bold text-gov-navy text-base flex items-center space-x-2">
                <Trash2 className="w-4 h-4 text-gov-maroon" />
                <span>Confirm Faculty Removal</span>
              </h3>
              <button
                onClick={() => { if (!deleting) setConfirmDelete(null); }}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gov-text-secondary leading-relaxed">
              Are you sure you want to remove <strong>{confirmDelete.name || 'this faculty mentor'}</strong> from the active mentoring roster? This will automatically unassign them from any currently supervised projects and teams.
            </p>

            {deleteError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xs">
                {deleteError}
              </div>
            )}

            <div className="pt-3 border-t border-gov-border flex items-center justify-end space-x-2 text-xs">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDelete(null)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmRemove}
                disabled={deleting}
                className="bg-gov-maroon text-white hover:bg-gov-maroon-dark"
              >
                {deleting ? 'Removing...' : 'Confirm Removal'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UniversityFacultyPage;
