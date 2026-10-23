import React, { useState, useEffect } from 'react';
import { universityService } from '../../services/universityService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import {
  DELHI_DISTRICTS
} from '../../utils/constants';
import {
  Building,
  GraduationCap,
  Save,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Tag,
  FlaskConical,
  Award
} from 'lucide-react';

const PRESET_EXPERTISE_TAGS = [
  'AI/ML',
  'Computer Vision',
  'IoT',
  'Agriculture',
  'Water Management',
  'Healthcare Technology',
  'Education Technology',
  'Renewable Energy',
  'Urban Planning',
  'Environmental Engineering',
  'Accessibility',
  'Public Administration'
];

const UniversityProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [campus, setCampus] = useState('');
  const [district, setDistrict] = useState('');
  const [innovationCentre, setInnovationCentre] = useState('');
  const [incubationFacilities, setIncubationFacilities] = useState('');

  // Tag arrays & Presets
  const [presetTags, setPresetTags] = useState(PRESET_EXPERTISE_TAGS);
  const [expertise, setExpertise] = useState([]);
  const [customTag, setCustomTag] = useState('');
  const [departments, setDepartments] = useState([]);
  const [newDept, setNewDept] = useState('');
  const [researchAreas, setResearchAreas] = useState([]);
  const [newResearch, setNewResearch] = useState('');
  const [labs, setLabs] = useState([]);
  const [newLab, setNewLab] = useState('');

  // Faculty specializations
  const [faculty, setFaculty] = useState([]);
  const [newFacName, setNewFacName] = useState('');
  const [newFacDept, setNewFacDept] = useState('');
  const [newFacSpec, setNewFacSpec] = useState('');
  const [newFacEmail, setNewFacEmail] = useState('');

  const fetchProfile = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await universityService.getProfile();
      const u = res.data?.university || {};
      setProfile(u);
      setName(u.name || '');
      setCampus(u.campus || '');
      setDistrict(u.district || '');
      setInnovationCentre(u.innovationCentre || '');
      setIncubationFacilities(u.incubationFacilities || '');
      setExpertise(u.expertise || []);
      setDepartments(u.departments || []);
      setResearchAreas(u.researchAreas || []);
      setLabs(u.labsAndFacilities || []);
      setFaculty(u.facultySpecializations || []);
      if (res.data?.availableExpertiseTags && Array.isArray(res.data.availableExpertiseTags)) {
        setPresetTags(res.data.availableExpertiseTags);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to load university profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleToggleExpertise = (tag) => {
    if (expertise.includes(tag)) {
      setExpertise(expertise.filter((t) => t !== tag));
    } else {
      setExpertise([...expertise, tag]);
    }
  };

  const handleAddCustomTag = (e) => {
    e.preventDefault();
    if (!customTag.trim()) return;
    if (!expertise.includes(customTag.trim())) {
      setExpertise([...expertise, customTag.trim()]);
    }
    setCustomTag('');
  };

  const handleAddDepartment = (e) => {
    e.preventDefault();
    if (!newDept.trim()) return;
    if (!departments.includes(newDept.trim())) {
      setDepartments([...departments, newDept.trim()]);
    }
    setNewDept('');
  };

  const handleAddResearch = (e) => {
    e.preventDefault();
    if (!newResearch.trim()) return;
    if (!researchAreas.includes(newResearch.trim())) {
      setResearchAreas([...researchAreas, newResearch.trim()]);
    }
    setNewResearch('');
  };

  const handleAddLab = (e) => {
    e.preventDefault();
    if (!newLab.trim()) return;
    if (!labs.includes(newLab.trim())) {
      setLabs([...labs, newLab.trim()]);
    }
    setNewLab('');
  };

  const handleAddFaculty = (e) => {
    e.preventDefault();
    if (!newFacName.trim() || !newFacDept.trim() || !newFacSpec.trim()) return;
    setFaculty([
      ...faculty,
      {
        facultyName: newFacName.trim(),
        department: newFacDept.trim(),
        specialization: newFacSpec.trim(),
        email: newFacEmail.trim()
      }
    ]);
    setNewFacName('');
    setNewFacDept('');
    setNewFacSpec('');
    setNewFacEmail('');
  };

  const handleRemoveFaculty = (idx) => {
    setFaculty(faculty.filter((_, i) => i !== idx));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const payload = {
        name,
        campus,
        district,
        departments,
        researchAreas,
        expertise,
        labsAndFacilities: labs,
        innovationCentre,
        incubationFacilities,
        facultySpecializations: faculty
      };

      await universityService.updateProfile(payload);
      setSuccessMsg('University institutional profile and expertise tags updated successfully in GNCTD directory!');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to save university profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading institutional research profile..." />;
  }

  if (errorMsg && !profile) {
    return (
      <div className="py-8 font-serif max-w-5xl mx-auto">
        <ErrorState
          title="Unable to Load University Profile"
          message={errorMsg}
          onRetry={fetchProfile}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-serif max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gov-navy">
          University Institutional Profile & Expertise
        </h1>
        <p className="text-xs text-gov-text-secondary mt-0.5">
          Maintain your accredited academic campus details, participating departments, incubation facilities, and configurable technical expertise tags.
        </p>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Core Identity */}
        <Card accent="navy" title="Core Campus Details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label className="block font-bold text-gov-navy uppercase tracking-wider mb-1">
                University / Institution Legal Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full font-serif border border-gov-border rounded-xs px-3 py-2 focus:ring-1 focus:ring-gov-navy outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-gov-navy uppercase tracking-wider mb-1">
                Campus Location Address *
              </label>
              <input
                type="text"
                required
                value={campus}
                onChange={(e) => setCampus(e.target.value)}
                placeholder="e.g. Main Institutional Campus, Pusa Road, Delhi 110012"
                className="w-full font-serif border border-gov-border rounded-xs px-3 py-2 focus:ring-1 focus:ring-gov-navy outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-gov-navy uppercase tracking-wider mb-1">
                Delhi Revenue District *
              </label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full font-serif border border-gov-border rounded-xs px-3 py-2 bg-white focus:ring-1 focus:ring-gov-navy outline-none"
              >
                <option value="" disabled>Select Delhi Revenue District</option>
                {DELHI_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-gov-navy uppercase tracking-wider mb-1">
                Innovation Centre / Council Entity
              </label>
              <input
                type="text"
                value={innovationCentre}
                onChange={(e) => setInnovationCentre(e.target.value)}
                placeholder="e.g. University Innovation and Incubation Council"
                className="w-full font-serif border border-gov-border rounded-xs px-3 py-2 focus:ring-1 focus:ring-gov-navy outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-gov-navy uppercase tracking-wider mb-1">
                Incubation Facilities & Prototype Cells
              </label>
              <input
                type="text"
                value={incubationFacilities}
                onChange={(e) => setIncubationFacilities(e.target.value)}
                placeholder="e.g. Technology Business Incubator (TBI) & FabLab"
                className="w-full font-serif border border-gov-border rounded-xs px-3 py-2 focus:ring-1 focus:ring-gov-navy outline-none"
              />
            </div>
          </div>
        </Card>

        {/* 2. Configurable Expertise System */}
        <Card
          accent="gold"
          title="Institutional Domain Expertise System"
          subtitle="Select domain tags to match your university with relevant civic challenges in the Challenge Marketplace"
        >
          <div className="space-y-4 text-xs">
            {/* Preset Tags Grid */}
            <div>
              <span className="font-bold text-gov-navy block text-[10px] uppercase tracking-wider mb-2">
                Click to Toggle Standard Expertise Tags
              </span>
              <div className="flex flex-wrap gap-2">
                {presetTags.map((tag) => {
                  const selected = expertise.includes(tag);
                  return (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => handleToggleExpertise(tag)}
                      className={`px-3 py-1.5 rounded-xs border text-xs font-semibold cursor-pointer transition-colors ${
                        selected
                          ? 'bg-gov-maroon text-white border-gov-maroon shadow-xs'
                          : 'bg-gov-sand-50 text-gov-navy border-gov-border hover:bg-gov-sand-100'
                      }`}
                    >
                      {selected ? '✓ ' : '+ '}
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Tag Input */}
            <div className="pt-3 border-t border-gov-border">
              <span className="font-bold text-gov-navy block text-[10px] uppercase tracking-wider mb-1">
                Add Custom Technical Specialization Tag
              </span>
              <div className="flex items-center space-x-2 max-w-md">
                <input
                  type="text"
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  placeholder="e.g. Drone Photogrammetry, Hydrogen Fuel Cells"
                  className="flex-1 font-serif border border-gov-border rounded-xs px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-gov-navy"
                />
                <Button variant="outline" size="sm" type="button" onClick={handleAddCustomTag} icon={Plus}>
                  Add Tag
                </Button>
              </div>
            </div>

            {/* Active Selected Tags Roster */}
            <div className="pt-2">
              <span className="font-bold text-gov-navy block text-[10px] uppercase tracking-wider mb-1">
                Active Tags Registered in Directory ({expertise.length}):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {expertise.length === 0 ? (
                  <span className="text-[11px] text-gov-text-muted italic">No expertise tags selected yet</span>
                ) : (
                  expertise.map((exp, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-2 py-0.5 rounded-xs bg-indigo-50 text-indigo-900 border border-indigo-200 text-xs font-semibold"
                    >
                      <span>{exp}</span>
                      <button
                        type="button"
                        onClick={() => handleToggleExpertise(exp)}
                        className="ml-1.5 text-indigo-500 hover:text-indigo-800"
                      >
                        &times;
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* 3. Departments, Research Areas, and Labs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Departments */}
          <Card accent="none" title="Departments">
            <div className="space-y-3 text-xs">
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {departments.length === 0 ? (
                  <p className="text-[11px] text-gov-text-muted italic py-1">No departments registered yet</p>
                ) : (
                  departments.map((dept, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-1.5 bg-gov-sand-50 rounded-xs border border-gov-border text-[11px]"
                    >
                      <span className="truncate mr-2">{dept}</span>
                      <button
                        type="button"
                        onClick={() => setDepartments(departments.filter((_, i) => i !== idx))}
                        className="text-gray-400 hover:text-red-600"
                      >
                        &times;
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="flex items-center space-x-1 pt-1 border-t border-gov-border">
                <input
                  type="text"
                  value={newDept}
                  onChange={(e) => setNewDept(e.target.value)}
                  placeholder="New department..."
                  className="flex-1 font-serif border border-gov-border rounded-xs px-2 py-1 text-xs outline-none"
                />
                <Button variant="subtle" size="sm" type="button" onClick={handleAddDepartment}>
                  Add
                </Button>
              </div>
            </div>
          </Card>

          {/* Research Areas */}
          <Card accent="none" title="Research Areas">
            <div className="space-y-3 text-xs">
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {researchAreas.length === 0 ? (
                  <p className="text-[11px] text-gov-text-muted italic py-1">No research areas registered yet</p>
                ) : (
                  researchAreas.map((res, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-1.5 bg-gov-sand-50 rounded-xs border border-gov-border text-[11px]"
                    >
                      <span className="truncate mr-2">{res}</span>
                      <button
                        type="button"
                        onClick={() => setResearchAreas(researchAreas.filter((_, i) => i !== idx))}
                        className="text-gray-400 hover:text-red-600"
                      >
                        &times;
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="flex items-center space-x-1 pt-1 border-t border-gov-border">
                <input
                  type="text"
                  value={newResearch}
                  onChange={(e) => setNewResearch(e.target.value)}
                  placeholder="New research thrust..."
                  className="flex-1 font-serif border border-gov-border rounded-xs px-2 py-1 text-xs outline-none"
                />
                <Button variant="subtle" size="sm" type="button" onClick={handleAddResearch}>
                  Add
                </Button>
              </div>
            </div>
          </Card>

          {/* Labs & Facilities */}
          <Card accent="none" title="Labs & Facilities">
            <div className="space-y-3 text-xs">
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {labs.length === 0 ? (
                  <p className="text-[11px] text-gov-text-muted italic py-1">No lab facilities registered yet</p>
                ) : (
                  labs.map((lab, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-1.5 bg-gov-sand-50 rounded-xs border border-gov-border text-[11px]"
                    >
                      <span className="truncate mr-2">{lab}</span>
                      <button
                        type="button"
                        onClick={() => setLabs(labs.filter((_, i) => i !== idx))}
                        className="text-gray-400 hover:text-red-600"
                      >
                        &times;
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="flex items-center space-x-1 pt-1 border-t border-gov-border">
                <input
                  type="text"
                  value={newLab}
                  onChange={(e) => setNewLab(e.target.value)}
                  placeholder="New lab facility..."
                  className="flex-1 font-serif border border-gov-border rounded-xs px-2 py-1 text-xs outline-none"
                />
                <Button variant="subtle" size="sm" type="button" onClick={handleAddLab}>
                  Add
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* 4. Faculty Specializations */}
        <Card accent="maroon" title="Faculty Specializations & Academic Mentors">
          <div className="space-y-4 text-xs">
            {/* Table */}
            <div className="overflow-x-auto border border-gov-border rounded-xs">
              <table className="w-full text-left text-xs divide-y divide-gov-border">
                <thead>
                  <tr className="bg-gov-sand-100 text-gov-navy font-bold uppercase tracking-wider text-[10px]">
                    <th className="px-3 py-2">Faculty Member</th>
                    <th className="px-3 py-2">Department</th>
                    <th className="px-3 py-2">Specialization</th>
                    <th className="px-3 py-2">Official Email</th>
                    <th className="px-3 py-2 text-right">Remove</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gov-border bg-white">
                  {faculty.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-3 py-4 text-center text-gov-text-muted italic text-[11px]">
                        No faculty specializations listed. Add faculty mentors below.
                      </td>
                    </tr>
                  ) : (
                    faculty.map((f, idx) => (
                      <tr key={idx} className="hover:bg-gov-sand-50">
                        <td className="px-3 py-2 font-bold text-gov-navy">{f.facultyName || 'Not provided'}</td>
                        <td className="px-3 py-2 text-gov-text-secondary">{f.department || 'Not provided'}</td>
                        <td className="px-3 py-2 font-medium text-emerald-800">{f.specialization || 'Not provided'}</td>
                        <td className="px-3 py-2 text-gov-text-muted">{f.email || 'Not provided'}</td>
                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveFaculty(idx)}
                            className="text-gray-400 hover:text-red-600 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5 ml-auto" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Add Faculty Form */}
            <div className="p-3 bg-gov-sand-50 rounded-xs border border-gov-border space-y-2">
              <span className="font-bold text-gov-navy text-[11px] block uppercase">
                Add Faculty Mentor / Specialization
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <input
                  type="text"
                  value={newFacName}
                  onChange={(e) => setNewFacName(e.target.value)}
                  placeholder="Faculty Name (e.g. Dr. Alok Gupta)"
                  className="border border-gov-border rounded-xs px-2.5 py-1 text-xs bg-white"
                />
                <input
                  type="text"
                  value={newFacDept}
                  onChange={(e) => setNewFacDept(e.target.value)}
                  placeholder="Department * (Required)"
                  className="border border-gov-border rounded-xs px-2.5 py-1 text-xs bg-white"
                />
                <input
                  type="text"
                  value={newFacSpec}
                  onChange={(e) => setNewFacSpec(e.target.value)}
                  placeholder="Specialization (e.g. Solar Microgrids)"
                  className="border border-gov-border rounded-xs px-2.5 py-1 text-xs bg-white"
                />
                <input
                  type="email"
                  value={newFacEmail}
                  onChange={(e) => setNewFacEmail(e.target.value)}
                  placeholder="Faculty Email"
                  className="border border-gov-border rounded-xs px-2.5 py-1 text-xs bg-white"
                />
              </div>
              <div className="text-right">
                <Button variant="subtle" size="sm" type="button" onClick={handleAddFaculty} icon={Plus}>
                  Add Faculty to Roster
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Submit Bar */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gov-border">
          <Button
            variant="primary"
            size="md"
            type="submit"
            disabled={saving}
            icon={Save}
            className="bg-gov-maroon hover:bg-gov-maroon-dark text-white px-6"
          >
            {saving ? 'Saving Institutional Profile...' : 'Save University Profile & Expertise'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default UniversityProfilePage;
