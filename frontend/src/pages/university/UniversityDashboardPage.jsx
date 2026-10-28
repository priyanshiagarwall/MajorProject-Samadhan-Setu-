import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { universityService } from '../../services/universityService';
import MetricCard from '../../components/common/MetricCard';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import {
  Compass,
  CheckSquare,
  Briefcase,
  CheckCircle2,
  Users2,
  GraduationCap,
  ArrowRight,
  RefreshCw,
  Building,
  ExternalLink,
  MapPin
} from 'lucide-react';

const UniversityDashboardPage = () => {
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [chalRes, profRes] = await Promise.all([
        universityService.getChallenges(),
        universityService.getProfile()
      ]);
      setData(chalRes.data);
      setProfile(profRes.data?.university);
    } catch (err) {
      console.error('Failed to load university dashboard data:', err);
      setError(err.message || 'Failed to load university innovation metrics & research cohorts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return <LoadingState message="Loading university innovation metrics & research cohorts..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Dashboard Connection Error"
        message={error}
        onRetry={fetchData}
        retryLabel="Retry Dashboard"
      />
    );
  }

  const { stats = {}, availableChallenges = [], assignedChallenges = [] } = data || {};

  return (
    <div className="space-y-6 font-serif">
      {/* Executive Welcome & Sync */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold text-gov-maroon uppercase tracking-wider mb-1">
            Higher Education Research Workbench
          </div>
          <h1 className="text-2xl font-bold text-gov-navy">
            {profile?.name || 'Higher Education Research Workbench'}
          </h1>
          <p className="text-xs text-gov-text-secondary mt-0.5">
            {profile?.campus || 'Campus not specified'} &bull; District:{' '}
            <strong>{profile?.district || 'Delhi'}</strong>
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="subtle" size="sm" onClick={fetchData} icon={RefreshCw}>
            Refresh
          </Button>
          <Link to="/university/marketplace">
            <Button variant="primary" size="sm" icon={Compass}>
              Open Marketplace
            </Button>
          </Link>
        </div>
      </div>

      {/* 6 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <MetricCard
          title="Available Challenges"
          value={stats.availableChallenges ?? 0}
          subtitle="Ready for institutional adoption"
          icon={Compass}
          accent="gold"
        />

        <MetricCard
          title="Assigned Challenges"
          value={stats.assignedChallenges ?? 0}
          subtitle="Allocated to this institution"
          icon={CheckSquare}
          accent="navy"
        />

        <MetricCard
          title="Active Projects"
          value={stats.activeProjects ?? 0}
          subtitle="In active lab prototyping"
          icon={Briefcase}
          accent="blue"
        />

        <MetricCard
          title="Completed Projects"
          value={stats.completedProjects ?? 0}
          subtitle="Certified field solutions"
          icon={CheckCircle2}
          accent="emerald"
        />

        <MetricCard
          title="Student Teams"
          value={stats.studentTeams ?? 0}
          subtitle="Multidisciplinary cohorts"
          icon={Users2}
          accent="indigo"
        />

        <MetricCard
          title="Faculty Mentors"
          value={stats.facultyMentors ?? 0}
          subtitle="Supervising researchers"
          icon={GraduationCap}
          accent="maroon"
        />
      </div>

      {/* Marketplace Alert Banner */}
      {availableChallenges.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <div className="font-bold text-amber-900 flex items-center space-x-1.5">
              <Compass className="w-4 h-4 text-amber-700" />
              <span>
                {availableChallenges.length} Validated Civic Challenge(s) Available for Academic Adoption!
              </span>
            </div>
            <p className="text-amber-800 text-[11px]">
              The Delhi State Innovation Council has validated new societal challenges matching your institution's environmental & IoT expertise.
            </p>
          </div>
          <Link to="/university/marketplace">
            <Button
              variant="primary"
              size="sm"
              className="bg-amber-700 hover:bg-amber-800 text-white whitespace-nowrap"
            >
              Browse Challenge Marketplace &rarr;
            </Button>
          </Link>
        </div>
      )}

      {/* 2-Column Grid: Assigned Projects + Institutional Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Assigned Challenges List */}
        <div className="lg:col-span-2 space-y-4">
          <Card
            accent="maroon"
            title={`Assigned Academic Challenges (${assignedChallenges.length})`}
            subtitle="Civic problem statements adopted or allocated to your university research cohorts"
          >
            {assignedChallenges.length === 0 ? (
              <div className="py-8 text-center text-xs text-gov-text-muted space-y-2">
                <p>No challenges currently assigned to your university.</p>
                <Link to="/university/marketplace">
                  <Button variant="outline" size="sm" icon={Compass}>
                    Explore Marketplace for Challenges
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gov-border">
                {assignedChallenges.map((c) => (
                  <div key={c._id} className="py-3.5 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-gov-maroon bg-gov-sand-50 px-1.5 py-0.5 rounded-xs border border-gov-border">
                          {c.code}
                        </span>
                        <StatusBadge status={c.status} />
                        <Badge variant="navy">{c.category}</Badge>
                      </div>

                      <span className="text-gov-text-muted text-[11px]">
                        {c.district}
                      </span>
                    </div>

                    <h4 className="font-bold text-gov-navy text-sm leading-snug">
                      {c.title}
                    </h4>

                    <p className="text-xs text-gov-text-secondary line-clamp-2 leading-relaxed">
                      {c.description}
                    </p>

                    <div className="pt-1 flex flex-wrap items-center justify-between gap-2 text-[11px] text-gov-text-muted">
                      <div>
                        {c.facultyLead?.name ? (
                          <span>
                            Faculty Mentor: <strong>{c.facultyLead.name}</strong> ({c.facultyLead.department})
                          </span>
                        ) : (
                          <span className="italic text-amber-700">Faculty mentor pending designation</span>
                        )}
                      </div>

                      <Link
                        to={`/university/assigned`}
                        className="text-gov-maroon font-bold hover:underline inline-flex items-center"
                      >
                        <span>Manage Research Team</span>
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right 1 Col: Institutional Profile Snapshot */}
        <div className="space-y-4">
          <Card accent="navy" title="Institutional Profile & Expertise">
            <div className="space-y-3 text-xs">
              <div>
                <span className="font-bold text-gov-navy block text-[10px] uppercase tracking-wider mb-1">
                  Accredited Domain Expertise
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(profile?.expertise || []).map((exp, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-xs bg-gov-sand-100 text-gov-navy border border-gov-border text-[11px] font-semibold"
                    >
                      {exp}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-gov-border">
                <span className="font-bold text-gov-navy block text-[10px] uppercase tracking-wider mb-1">
                  Participating Departments ({profile?.departments?.length || 0})
                </span>
                <ul className="space-y-1 text-gov-text-secondary text-[11px]">
                  {(profile?.departments || []).slice(0, 3).map((dept, idx) => (
                    <li key={idx} className="truncate">&bull; {dept}</li>
                  ))}
                  {(profile?.departments?.length || 0) > 3 && (
                    <li className="text-gov-maroon font-semibold">
                      +{profile.departments.length - 3} additional departments
                    </li>
                  )}
                </ul>
              </div>

              <div className="pt-2 border-t border-gov-border">
                <span className="font-bold text-gov-navy block text-[10px] uppercase tracking-wider mb-1">
                  Incubation & Prototyping
                </span>
                <p className="text-gov-text-secondary text-[11px] leading-snug">
                  {profile?.incubationFacilities || 'Technology Business Incubator (TBI)'}
                </p>
              </div>

              <div className="pt-3 border-t border-gov-border">
                <Link to="/university/profile">
                  <Button variant="outline" size="sm" fullWidth>
                    Edit University Profile & Expertise Tags
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UniversityDashboardPage;
