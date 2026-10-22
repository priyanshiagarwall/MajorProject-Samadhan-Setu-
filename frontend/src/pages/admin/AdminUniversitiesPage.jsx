import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import LoadingState from '../../components/common/LoadingState';
import MetricCard from '../../components/common/MetricCard';
import {
  GraduationCap,
  MapPin,
  Mail,
  Phone,
  FolderKanban,
  RefreshCw,
  Briefcase,
  Users,
  Building,
  CheckCircle2,
  XCircle,
  UserCheck,
  UserX
} from 'lucide-react';

const AdminUniversitiesPage = () => {
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [togglingId, setTogglingId] = useState(null);

  const fetchUniversities = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getUniversities();
      setUniversities(res.data?.universities || []);
    } catch (err) {
      console.error('Failed to load universities:', err);
      setError(err.message || 'Failed to load universities registry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUniversities();
  }, []);

  const handleToggleStatus = async (uni) => {
    const action = uni.isActive ? 'deactivate' : 'activate';
    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${uni.name}?`
    );
    if (!confirmed) return;

    setTogglingId(uni._id);
    try {
      await adminService.updateUniversityStatus(uni._id, !uni.isActive);
      fetchUniversities();
    } catch (err) {
      alert(err.message || `Failed to ${action} university`);
    } finally {
      setTogglingId(null);
    }
  };

  const activeCount = universities.filter((u) => u.isActive).length;
  const totalAssignedChallenges = universities.reduce((acc, u) => acc + (u.assignedChallengesCount || 0), 0);
  const totalActiveProjects = universities.reduce((acc, u) => acc + (u.activeProjectsCount || 0), 0);

  return (
    <div className="space-y-6 font-serif">
      {/* Top Banner */}
      <div className="bg-white border border-gov-border rounded-xs p-6 shadow-gov-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-gov-navy font-bold uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Higher Education & Research Registry</span>
          </div>
          <h1 className="text-2xl font-bold text-gov-navy">
            Partner University Institutions ({universities.length})
          </h1>
          <p className="text-xs text-gov-text-secondary mt-1 max-w-3xl leading-relaxed">
            Technical universities, engineering colleges, and academic research departments accredited to solve civic challenges in Delhi.
          </p>
        </div>

        <Button variant="subtle" size="sm" onClick={fetchUniversities} icon={RefreshCw}>
          Refresh Registry
        </Button>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Registered Universities"
          value={universities.length}
          subtitle={`${activeCount} active in network`}
          icon={GraduationCap}
          accent="navy"
        />
        <MetricCard
          title="Assigned Challenges"
          value={totalAssignedChallenges}
          subtitle="Allocated for research & MVP"
          icon={FolderKanban}
          accent="amber"
        />
        <MetricCard
          title="Active Projects"
          value={totalActiveProjects}
          subtitle="Engineering cohorts developing"
          icon={Briefcase}
          accent="emerald"
        />
      </div>

      {loading ? (
        <LoadingState message="Loading registered universities from MongoDB..." />
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xs flex items-center justify-between">
          <span>{error}</span>
          <Button variant="subtle" size="sm" onClick={fetchUniversities}>
            Retry
          </Button>
        </div>
      ) : universities.length === 0 ? (
        <Card accent="none" className="p-12 text-center text-xs text-gov-text-muted">
          No registered universities found in the state innovation registry.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {universities.map((uni) => (
            <Card key={uni._id} accent="maroon" className="p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 rounded-xs bg-gov-maroon/10 text-gov-maroon flex items-center justify-center border border-gov-maroon/20 flex-shrink-0 mt-0.5">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gov-navy leading-snug">
                        {uni.name}
                      </h3>
                      <p className="text-xs text-gov-text-secondary mt-0.5">
                        {uni.organization || 'Accredited Higher Education Institution'}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-xs text-[10px] font-bold flex-shrink-0 ${
                      uni.isActive
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {uni.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Departments */}
                <div>
                  <span className="text-[11px] font-bold text-gov-navy block mb-1">
                    Academic Departments:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {uni.departments && uni.departments.length > 0 ? (
                      uni.departments.map((dept, i) => (
                        <span
                          key={i}
                          className="text-[10px] bg-gov-sand-100 text-gov-navy px-1.5 py-0.5 rounded-xs font-mono"
                        >
                          {dept}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-gov-text-muted">
                        Computer Science, Civil & Environmental Engineering, Mechanical Engineering
                      </span>
                    )}
                  </div>
                </div>

                {/* Quantitative Metrics Bar */}
                <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-gov-sand-50/70 border border-gov-border rounded-xs text-center text-xs">
                  <div>
                    <span className="text-[10px] text-gov-text-muted block">Faculty Mentors</span>
                    <strong className="text-gov-navy">{uni.facultyCount || 0}</strong>
                  </div>
                  <div className="border-x border-gov-border">
                    <span className="text-[10px] text-gov-text-muted block">Active Projects</span>
                    <strong className="text-gov-maroon">{uni.activeProjectsCount || 0}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-gov-text-muted block">Assigned Challenges</span>
                    <strong className="text-emerald-700">{uni.assignedChallengesCount || 0}</strong>
                  </div>
                </div>

                {/* Contact & District */}
                <div className="space-y-1 text-xs text-gov-text-muted pt-1">
                  <div className="flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-gov-maroon flex-shrink-0" />
                    <span>Jurisdiction: <strong>{uni.district || 'NCT of Delhi'}</strong></span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Mail className="w-3.5 h-3.5 text-gov-maroon flex-shrink-0" />
                    <span>{uni.email}</span>
                  </div>
                  {uni.phone && (
                    <div className="flex items-center space-x-1.5">
                      <Phone className="w-3.5 h-3.5 text-gov-maroon flex-shrink-0" />
                      <span>{uni.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Controls */}
              <div className="pt-3 border-t border-gov-border flex items-center justify-between">
                <span className="text-[11px] text-gov-text-muted">
                  State Node Cleared
                </span>

                <Button
                  variant={uni.isActive ? 'subtle' : 'primary'}
                  size="sm"
                  disabled={togglingId === uni._id}
                  onClick={() => handleToggleStatus(uni)}
                  className={
                    uni.isActive
                      ? 'text-rose-700 hover:bg-rose-50'
                      : 'bg-emerald-700 hover:bg-emerald-800'
                  }
                  icon={uni.isActive ? UserX : UserCheck}
                >
                  {togglingId === uni._id
                    ? 'Updating...'
                    : uni.isActive
                    ? 'Deactivate Account'
                    : 'Activate Account'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminUniversitiesPage;
