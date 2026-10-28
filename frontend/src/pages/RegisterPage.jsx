import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { PORTAL_TITLE, normalizeRoleKey } from '../utils/constants';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import { SamadhanSetuEmblem } from '../components/common/SamadhanSetuLogo';
import {
  User,
  Mail,
  Lock,
  Building,
  Phone,
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  MapPin,
  CheckCircle2,
  Users,
  ShieldCheck,
  GraduationCap,
  BookOpen,
  Lightbulb,
  Building2,
  Key,
  GraduationCap as AcademicCap,
  Sparkles
} from 'lucide-react';

const roleIconMap = {
  CLIENT: Users,
  ADMIN: ShieldCheck,
  UNIVERSITY: GraduationCap,
  FACULTY: BookOpen,
  STUDENT: Lightbulb,
  INDUSTRY: Building2
};

const allRegistrationRoles = [
  {
    id: 'client',
    roleKey: 'CLIENT',
    label: 'Citizen / Client',
    badgeText: 'Civic Reporter',
    description: 'Report local community challenges and submit evidence',
    accentColor: '#7a1113',
    colorVariant: 'maroon'
  },
  {
    id: 'student',
    roleKey: 'STUDENT',
    label: 'Student Innovator',
    badgeText: 'Solution Provider',
    description: 'Develop societal solutions, build prototypes & earn credits',
    accentColor: '#b45309',
    colorVariant: 'gold'
  },
  {
    id: 'faculty',
    roleKey: 'FACULTY',
    label: 'Faculty Mentor',
    badgeText: 'Academic Supervisor',
    description: 'Supervise research cohorts & certify milestone credits',
    accentColor: '#7a1113',
    colorVariant: 'maroon'
  },
  {
    id: 'university',
    roleKey: 'UNIVERSITY',
    label: 'University Dean / Admin',
    badgeText: 'Academic Institution',
    description: 'Coordinate university cohorts and adopt public challenges',
    accentColor: '#7a1113',
    colorVariant: 'maroon'
  },
  {
    id: 'industry',
    roleKey: 'INDUSTRY',
    label: 'Industry / Startup Partner',
    badgeText: 'Ecosystem Partner',
    description: 'Fund, mentor, sponsor, and scale field innovations',
    accentColor: '#142a45',
    colorVariant: 'navy'
  },
  {
    id: 'admin',
    roleKey: 'ADMIN',
    label: 'Government Authority / Admin',
    badgeText: 'Administrator',
    description: 'State government and municipal administrative oversight',
    accentColor: '#142a45',
    colorVariant: 'navy'
  }
];

const delhiDistricts = [
  'Central Delhi',
  'East Delhi',
  'New Delhi',
  'North Delhi',
  'North East Delhi',
  'North West Delhi',
  'Shahdara',
  'South Delhi',
  'South East Delhi',
  'South West Delhi',
  'West Delhi'
];

const RegisterPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { register } = useAuth();

  // Normalize initial role from query
  const roleParam = searchParams.get('role');
  const normalizedKey = normalizeRoleKey(roleParam || 'client');
  const matchedRole = allRegistrationRoles.find((r) => r.id === normalizedKey) || allRegistrationRoles[0];

  const [selectedRole, setSelectedRole] = useState(matchedRole);

  // Common inputs
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [organization, setOrganization] = useState('');
  const [district, setDistrict] = useState('Central Delhi');
  const [terms, setTerms] = useState(false);

  // Role-specific inputs
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('3rd Year B.Tech');
  const [studentId, setStudentId] = useState('');
  const [skills, setSkills] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [experience, setExperience] = useState('5+ Years');
  const [organizationType, setOrganizationType] = useState('Industry');
  const [industrySector, setIndustrySector] = useState('Clean Energy, Smart Grids & Utilities');
  const [website, setWebsite] = useState('');
  const [campus, setCampus] = useState('');
  const [adminCode, setAdminCode] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading] = useState(false);

  // Sync state if query parameter changes
  useEffect(() => {
    if (roleParam) {
      const key = normalizeRoleKey(roleParam);
      const target = allRegistrationRoles.find((r) => r.id === key);
      if (target && target.id !== selectedRole.id) {
        setSelectedRole(target);
      }
    }
  }, [roleParam]);

  const handleRoleSelect = (roleObj) => {
    setSelectedRole(roleObj);
    setSearchParams({ role: roleObj.id });
    setFieldErrors({});
    setGeneralError('');
  };

  const validateForm = () => {
    const errors = {};

    if (!name.trim()) {
      errors.name = 'Full legal name is required.';
    } else if (name.trim().length < 3) {
      errors.name = 'Name must be at least 3 characters.';
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!emailRegex.test(email.trim())) {
      errors.email = 'Please enter a valid email address (e.g. name@domain.in).';
    }

    if (!phone.trim()) {
      errors.phone = 'Contact phone number is required.';
    } else if (!/^[0-9+\-\s]{8,15}$/.test(phone.trim())) {
      errors.phone = 'Please enter a valid contact phone number (8-15 digits).';
    }

    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters long.';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Confirmation password is required.';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (['UNIVERSITY', 'FACULTY', 'STUDENT', 'INDUSTRY'].includes(role) && !organization.trim()) {
      errors.organization = `Organization / Institution is required for ${role} registration.`;
    }

    if (!terms) {
      errors.terms = 'You must agree to the portal terms and Delhi digital public goods standards.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
        confirmPassword,
        role: selectedRole.roleKey,
        organization: organization.trim() || (selectedRole.roleKey === 'ADMIN' ? 'Delhi State Administration' : ''),
        district,
        terms,
        // Role-specific
        department: department.trim(),
        year,
        studentId: studentId.trim(),
        skills: skills ? skills.split(',').map((s) => s.trim()) : undefined,
        specialization: specialization.trim(),
        experience: experience.trim(),
        organizationType,
        industrySector: industrySector.trim(),
        website: website.trim(),
        campus: campus.trim(),
        adminCode: adminCode.trim()
      };

      await register(payload);

      // Role-based destination workspace mapping
      const redirectMap = {
        CLIENT: '/client',
        ADMIN: '/admin',
        UNIVERSITY: '/university',
        INDUSTRY: '/industry',
        STUDENT: '/student'
      };

      navigate(redirectMap[selectedRole.roleKey] || '/client', { replace: true });
    } catch (err) {
      setGeneralError(err.message || 'Registration failed. Please review the provided details.');
    } finally {
      setLoading(false);
    }
  };

  const CurrentRoleIcon = roleIconMap[selectedRole.roleKey] || Users;

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <Link
          to="/select-role"
          className="inline-flex items-center text-xs font-serif text-gov-maroon hover:underline mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Back to Portal Role Selection
        </Link>
        <div className="flex justify-center mb-3">
          <SamadhanSetuEmblem size={52} />
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-gov-navy">
          Stakeholder Account Onboarding
        </h2>
        <p className="text-xs font-serif text-gov-text-secondary mt-1">
          {PORTAL_TITLE} (समाधान सेतु) &bull; National & State Innovation Network
        </p>
      </div>

      {/* Stakeholder Role Selector Tab Grid */}
      <div className="bg-white border border-gov-border rounded-sm p-3 shadow-gov-card">
        <div className="text-[11px] font-serif font-bold text-gov-navy uppercase tracking-wider mb-2">
          Choose Your Stakeholder Registration Portal:
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {allRegistrationRoles.map((r) => {
            const Icon = roleIconMap[r.roleKey] || Users;
            const isSelected = r.id === selectedRole.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => handleRoleSelect(r)}
                className={`flex flex-col items-center justify-center p-2.5 rounded-sm border text-xs font-serif transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-gov-maroon text-white border-gov-maroon shadow-sm'
                    : 'bg-white hover:bg-gov-sand-50 text-gov-navy border-gov-border hover:border-gov-maroon'
                }`}
              >
                <Icon className={`w-4 h-4 mb-1 ${isSelected ? 'text-white' : 'text-gov-maroon'}`} />
                <span className="font-bold text-[11px] text-center leading-tight">
                  {r.badgeText}
                </span>
                <span className={`text-[9px] mt-0.5 ${isSelected ? 'text-amber-200' : 'text-gov-text-muted'}`}>
                  {r.roleKey}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Registration Card */}
      <Card
        accent={selectedRole.colorVariant === 'navy' ? 'navy' : 'maroon'}
        title={`Register for ${selectedRole.label} Portal`}
        subtitle={selectedRole.description}
      >
        {/* Active Portal Header Banner */}
        <div className="mb-5 pb-3 border-b border-gov-border flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div
              className="w-9 h-9 rounded-sm flex items-center justify-center text-white shadow-sm"
              style={{ backgroundColor: selectedRole.accentColor }}
            >
              <CurrentRoleIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-serif font-bold text-gov-navy">
                Creating: {selectedRole.label} Account
              </div>
              <div className="text-[11px] font-serif text-gov-text-muted">
                Authorized Role: <strong className="text-gov-maroon">{selectedRole.roleKey}</strong>
              </div>
            </div>
          </div>
          <Badge variant={selectedRole.colorVariant === 'navy' ? 'navy' : selectedRole.colorVariant === 'gold' ? 'gold' : 'maroon'}>
            {selectedRole.badgeText}
          </Badge>
        </div>

        {generalError && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-serif rounded-sm flex items-start">
            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
            <span>{generalError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-serif font-bold text-gov-navy uppercase tracking-wider mb-1">
              Full Legal Name *
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={
                  selectedRole.roleKey === 'STUDENT'
                    ? 'e.g. Priya Sharma'
                    : selectedRole.roleKey === 'FACULTY'
                    ? 'e.g. Prof. Rajesh Verma'
                    : selectedRole.roleKey === 'ADMIN'
                    ? 'e.g. Shri Vivek Saxena (IAS)'
                    : 'e.g. Dr. Rajesh Verma / Priya Sharma'
                }
                className={`w-full text-sm font-serif border rounded-sm pl-9 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-gov-maroon ${
                  fieldErrors.name ? 'border-red-500 bg-red-50/20' : 'border-gov-border'
                }`}
              />
              <User className="w-4 h-4 text-gov-text-muted absolute left-3 top-2.5" />
            </div>
            {fieldErrors.name && (
              <p className="text-xs text-red-600 font-serif mt-1">{fieldErrors.name}</p>
            )}
          </div>

          {/* Email & Phone Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-serif font-bold text-gov-navy uppercase tracking-wider mb-1">
                Official / Personal Email *
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={
                    selectedRole.roleKey === 'ADMIN'
                      ? 'officer@delhi.gov.in'
                      : selectedRole.roleKey === 'STUDENT'
                      ? 'innovator@college.ac.in'
                      : 'user@institution.edu.in'
                  }
                  className={`w-full text-sm font-serif border rounded-sm pl-9 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-gov-maroon ${
                    fieldErrors.email ? 'border-red-500 bg-red-50/20' : 'border-gov-border'
                  }`}
                />
                <Mail className="w-4 h-4 text-gov-text-muted absolute left-3 top-2.5" />
              </div>
              {fieldErrors.email && (
                <p className="text-xs text-red-600 font-serif mt-1">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-serif font-bold text-gov-navy uppercase tracking-wider mb-1">
                Contact Phone Number *
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className={`w-full text-sm font-serif border rounded-sm pl-9 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-gov-maroon ${
                    fieldErrors.phone ? 'border-red-500 bg-red-50/20' : 'border-gov-border'
                  }`}
                />
                <Phone className="w-4 h-4 text-gov-text-muted absolute left-3 top-2.5" />
              </div>
              {fieldErrors.phone && (
                <p className="text-xs text-red-600 font-serif mt-1">{fieldErrors.phone}</p>
              )}
            </div>
          </div>

          {/* Organization / Affiliation (Dynamic by Role) */}
          <div>
            <label className="block text-xs font-serif font-bold text-gov-navy uppercase tracking-wider mb-1">
              {selectedRole.roleKey === 'STUDENT' || selectedRole.roleKey === 'FACULTY' || selectedRole.roleKey === 'UNIVERSITY'
                ? 'Affiliated University / Academic Institution *'
                : selectedRole.roleKey === 'INDUSTRY'
                ? 'Company / Enterprise / Startup Name *'
                : selectedRole.roleKey === 'ADMIN'
                ? 'Government Department / Commission (Optional)'
                : 'Organization / Resident Welfare Association (Optional)'}
            </label>
            <div className="relative">
              <input
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder={
                  selectedRole.roleKey === 'CLIENT'
                    ? 'e.g. RWA Mayur Vihar or Individual Resident'
                    : selectedRole.roleKey === 'STUDENT'
                    ? 'e.g. Netaji Subhas University of Technology (NSUT)'
                    : selectedRole.roleKey === 'FACULTY' || selectedRole.roleKey === 'UNIVERSITY'
                    ? 'e.g. Delhi Technological University (DTU)'
                    : selectedRole.roleKey === 'INDUSTRY'
                    ? 'e.g. Tata Power / BSES / Tech Mahindra'
                    : 'e.g. Delhi State Administration / Municipal Corporation'
                }
                className={`w-full text-sm font-serif border rounded-sm pl-9 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-gov-maroon ${
                  fieldErrors.organization ? 'border-red-500 bg-red-50/20' : 'border-gov-border'
                }`}
              />
              <Building className="w-4 h-4 text-gov-text-muted absolute left-3 top-2.5" />
            </div>
            {fieldErrors.organization && (
              <p className="text-xs text-red-600 font-serif mt-1">{fieldErrors.organization}</p>
            )}
          </div>

          {/* Role-Specific Fields */}
          {selectedRole.roleKey === 'STUDENT' && (
            <div className="p-3 bg-amber-50/40 border border-amber-200/60 rounded-sm space-y-3">
              <div className="text-xs font-serif font-bold text-gov-navy flex items-center">
                <AcademicCap className="w-4 h-4 mr-1 text-gov-maroon" />
                Student Academic Details
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-serif font-bold text-gov-navy mb-1">Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Computer Science"
                    className="w-full text-xs font-serif border border-gov-border rounded-sm px-2.5 py-1.5 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-serif font-bold text-gov-navy mb-1">Academic Year</label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full text-xs font-serif border border-gov-border rounded-sm px-2 py-1.5 bg-white"
                  >
                    <option value="1st Year B.Tech">1st Year B.Tech</option>
                    <option value="2nd Year B.Tech">2nd Year B.Tech</option>
                    <option value="3rd Year B.Tech">3rd Year B.Tech</option>
                    <option value="Final Year B.Tech">Final Year B.Tech</option>
                    <option value="Postgraduate / M.Tech">Postgraduate / M.Tech</option>
                    <option value="Ph.D. Scholar">Ph.D. Scholar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-serif font-bold text-gov-navy mb-1">Student Roll / ID</label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="e.g. 2024/CS/104"
                    className="w-full text-xs font-serif border border-gov-border rounded-sm px-2.5 py-1.5 bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-serif font-bold text-gov-navy mb-1">Technical Skills & Expertise</label>
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="e.g. IoT, Sensors, React, Python, Embedded C, AI/ML"
                  className="w-full text-xs font-serif border border-gov-border rounded-sm px-2.5 py-1.5 bg-white"
                />
              </div>
            </div>
          )}

          {selectedRole.roleKey === 'FACULTY' && (
            <div className="p-3 bg-gov-sand-50 border border-gov-border rounded-sm space-y-3">
              <div className="text-xs font-serif font-bold text-gov-navy flex items-center">
                <BookOpen className="w-4 h-4 mr-1 text-gov-maroon" />
                Faculty Mentorship Credentials
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-serif font-bold text-gov-navy mb-1">Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Environmental Engineering"
                    className="w-full text-xs font-serif border border-gov-border rounded-sm px-2.5 py-1.5 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-serif font-bold text-gov-navy mb-1">Specialization</label>
                  <input
                    type="text"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    placeholder="e.g. IoT Sensors & Biogas"
                    className="w-full text-xs font-serif border border-gov-border rounded-sm px-2.5 py-1.5 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-serif font-bold text-gov-navy mb-1">Academic Experience</label>
                  <select
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    className="w-full text-xs font-serif border border-gov-border rounded-sm px-2 py-1.5 bg-white"
                  >
                    <option value="3+ Years">3+ Years</option>
                    <option value="5+ Years">5+ Years</option>
                    <option value="10+ Years">10+ Years</option>
                    <option value="15+ Years">15+ Years</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {selectedRole.roleKey === 'INDUSTRY' && (
            <div className="p-3 bg-gov-sand-50 border border-gov-border rounded-sm space-y-3">
              <div className="text-xs font-serif font-bold text-gov-navy flex items-center">
                <Building2 className="w-4 h-4 mr-1 text-gov-navy" />
                Enterprise Partnership Profile
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-serif font-bold text-gov-navy mb-1">Organization Type</label>
                  <select
                    value={organizationType}
                    onChange={(e) => setOrganizationType(e.target.value)}
                    className="w-full text-xs font-serif border border-gov-border rounded-sm px-2 py-1.5 bg-white"
                  >
                    <option value="Industry">Industry / Corporate</option>
                    <option value="Startup">Startup / Tech Incubatee</option>
                    <option value="MSME">MSME Enterprise</option>
                    <option value="CSR Organization">CSR Foundation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-serif font-bold text-gov-navy mb-1">Industry Sector</label>
                  <input
                    type="text"
                    value={industrySector}
                    onChange={(e) => setIndustrySector(e.target.value)}
                    placeholder="e.g. Clean Energy, Smart Grids, Water Tech"
                    className="w-full text-xs font-serif border border-gov-border rounded-sm px-2.5 py-1.5 bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Delhi District Selection */}
          <div>
            <label className="block text-xs font-serif font-bold text-gov-navy uppercase tracking-wider mb-1">
              Delhi District *
            </label>
            <div className="relative">
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full text-sm font-serif border border-gov-border rounded-sm pl-9 pr-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-gov-maroon"
              >
                {delhiDistricts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <MapPin className="w-4 h-4 text-gov-text-muted absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Password & Confirm Password Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-serif font-bold text-gov-navy uppercase tracking-wider mb-1">
                Password (min 6 characters) *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create password"
                  className={`w-full text-sm font-serif border rounded-sm pl-9 pr-9 py-2 focus:outline-none focus:ring-1 focus:ring-gov-maroon ${
                    fieldErrors.password ? 'border-red-500 bg-red-50/20' : 'border-gov-border'
                  }`}
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
              {fieldErrors.password && (
                <p className="text-xs text-red-600 font-serif mt-1">{fieldErrors.password}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-serif font-bold text-gov-navy uppercase tracking-wider mb-1">
                Confirm Password *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className={`w-full text-sm font-serif border rounded-sm pl-9 pr-9 py-2 focus:outline-none focus:ring-1 focus:ring-gov-maroon ${
                    fieldErrors.confirmPassword ? 'border-red-500 bg-red-50/20' : 'border-gov-border'
                  }`}
                />
                <Lock className="w-4 h-4 text-gov-text-muted absolute left-3 top-2.5" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-gov-text-muted hover:text-gov-navy"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p className="text-xs text-red-600 font-serif mt-1">{fieldErrors.confirmPassword}</p>
              )}
            </div>
          </div>

          {/* Terms Checkbox */}
          <div className="pt-2">
            <label className="flex items-start space-x-2.5 cursor-pointer text-xs font-serif text-gov-text-secondary">
              <input
                type="checkbox"
                checked={terms}
                onChange={(e) => setTerms(e.target.checked)}
                className="mt-0.5 accent-gov-maroon rounded-xs w-4 h-4"
              />
              <span>
                I agree to the <strong>Delhi Public Sector Innovation Terms of Service</strong>, Privacy Policy, and digital public goods guidelines.
              </span>
            </label>
            {fieldErrors.terms && (
              <p className="text-xs text-red-600 font-serif mt-1">{fieldErrors.terms}</p>
            )}
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
              {loading ? 'Creating Stakeholder Account...' : `Register for ${selectedRole.badgeText} Portal`}
            </Button>
          </div>
        </form>

        {/* Link back to portal-specific login */}
        <div className="mt-6 pt-4 border-t border-gov-border flex flex-col sm:flex-row items-center justify-between text-xs font-serif text-gov-text-secondary gap-2">
          <span>Already registered for the {selectedRole.badgeText} portal?</span>
          <Link
            to={`/login?role=${selectedRole.id}`}
            className="text-gov-maroon font-bold hover:underline"
          >
            Sign In to {selectedRole.badgeText} Here &rarr;
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default RegisterPage;
