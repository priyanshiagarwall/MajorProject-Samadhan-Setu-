import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { problemService } from '../services/problemService';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import StatusBadge from '../components/common/StatusBadge';
import Timeline from '../components/common/Timeline';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Tag,
  Building,
  User,
  Paperclip,
  Clock,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Bookmark,
  Compass,
  FileText,
  Users,
  Briefcase
} from 'lucide-react';

const ChallengeDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [problem, setProblem] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDetail = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await problemService.getProblemById(id);
      setProblem(res.data?.problem);
      setIsSaved(!!res.data?.isSaved);
    } catch (err) {
      console.error('Failed to load challenge detail:', err);
      setError(err.message || 'Challenge not found or access denied.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleToggleSave = async () => {
    if (!problem?._id) return;
    setSaving(true);
    try {
      const res = await problemService.toggleSaveProblem(problem._id);
      setIsSaved(!!res.data?.saved);
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading challenge details and lifecycle progress..." />;
  }

  if (error || !problem) {
    return (
      <div className="py-12 max-w-lg mx-auto text-center font-serif">
        <ErrorState
          title="Challenge Record Unavailable"
          message={error || 'Challenge not found or your account does not have authorization to view it.'}
          onRetry={fetchDetail}
          retryLabel="Retry Loading Challenge"
        />
        <div className="mt-4">
          <Link to="/client/challenges">
            <Button variant="outline" size="sm" icon={ArrowLeft}>
              Return to My Challenges
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return '--';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6 font-serif">
      {/* Navigation Breadcrumb Action */}
      <div className="flex items-center justify-between">
        <Link
          to="/client/challenges"
          className="inline-flex items-center text-xs font-serif text-gov-maroon hover:underline font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Back to My Challenges
        </Link>

        <div className="flex items-center space-x-2.5">
          <Button
            variant={isSaved ? 'primary' : 'outline'}
            size="sm"
            onClick={handleToggleSave}
            disabled={saving}
            icon={Bookmark}
            className={isSaved ? 'bg-amber-600 border-amber-600 hover:bg-amber-700' : ''}
          >
            {isSaved ? 'Bookmarked' : 'Save Challenge'}
          </Button>

          <span className="font-mono text-xs font-bold text-gov-maroon bg-gov-maroon-surface px-2.5 py-1 rounded-xs border border-gov-maroon-border">
            {problem.code || `DEL-${problem._id.slice(-4).toUpperCase()}`}
          </span>
        </div>
      </div>

      {/* Main Challenge Header Card */}
      <Card accent="maroon">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gov-border pb-3">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 text-xs font-serif bg-gov-navy text-white rounded-xs font-semibold">
                {problem.category}
              </span>
              <span className="text-xs text-gov-text-muted">
                Priority: <strong className="capitalize text-gov-navy">{problem.priority || 'Medium'}</strong>
              </span>
              {problem.severity && (
                <span className="text-xs text-gov-text-muted">
                  &bull; Severity: <strong className="capitalize text-gov-navy">{problem.severity}</strong>
                </span>
              )}
            </div>

            <StatusBadge status={problem.status} />
          </div>

          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gov-navy leading-tight">
            {problem.title}
          </h1>

          {/* Quick Meta Row */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-serif text-gov-text-muted pt-1">
            <span className="flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1.5 text-gov-maroon" />
              Submitted on {formatDate(problem.createdAt)}
            </span>

            <span className="flex items-center">
              <MapPin className="w-3.5 h-3.5 mr-1.5 text-gov-maroon" />
              {problem.district} {problem.location?.area ? `• ${problem.location.area}` : ''}
            </span>

            {problem.location?.landmark && (
              <span className="flex items-center">
                <strong>Landmark:</strong>&nbsp;{problem.location.landmark}
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* 2-Column Grid: Left (Description & Timeline) | Right (Assigned Institution & Evidence) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Detailed Problem Statement */}
          <Card title="Detailed Problem Description & Ground Impact" accent="none">
            <p className="text-xs sm:text-sm text-gov-text-secondary leading-relaxed whitespace-pre-line">
              {problem.description}
            </p>

            {problem.impact && (
              <div className="mt-4 p-3 bg-gov-sand-50 border-l-3 border-gov-maroon rounded-xs text-xs space-y-1">
                <span className="font-bold text-gov-navy uppercase tracking-wider text-[10px]">
                  Estimated Community Footprint
                </span>
                <p className="text-gov-text-secondary">{problem.impact}</p>
              </div>
            )}

            {problem.tags && problem.tags.length > 0 && (
              <div className="mt-4 pt-3 border-t border-gov-border flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-gov-navy mr-1">Tags:</span>
                {problem.tags.map((t, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-gov-sand-100 text-gov-text-secondary rounded-xs text-[11px] border border-gov-border"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </Card>

          {/* Visual Lifecycle Timeline */}
          <Card
            accent="maroon"
            title="Challenge Progress & Verification Lifecycle"
            subtitle="Track government screening, university cohort assignment, and field validation stages"
          >
            <Timeline currentStatus={problem.status} events={problem.timeline || []} />
          </Card>

          {/* Latest Updates & Notes */}
          <Card title="Latest Updates & Cohort Milestones" accent="none">
            <div className="space-y-4 text-xs">
              {problem.solutionNotes ? (
                <div className="p-4 bg-gov-sand-50 border border-gov-border rounded-xs space-y-2">
                  <div className="font-bold text-gov-navy flex items-center">
                    <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600" />
                    Cohort Field Progress Note
                  </div>
                  <p className="text-gov-text-secondary leading-relaxed">
                    {problem.solutionNotes}
                  </p>
                </div>
              ) : (
                <div className="text-gov-text-muted py-2">
                  No field progress reports posted yet. Once verified and assigned to an academic cohort, status updates will appear here.
                </div>
              )}

              {/* Milestones if present */}
              {problem.milestones && problem.milestones.length > 0 && (
                <div className="pt-2 border-t border-gov-border space-y-2">
                  <div className="font-bold text-gov-navy text-xs uppercase tracking-wider">
                    Project Milestones
                  </div>
                  <div className="space-y-2">
                    {problem.milestones.map((m, idx) => (
                      <div key={idx} className="p-2.5 bg-white border border-gov-border rounded-xs flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-gov-navy">{m.title}</div>
                          {m.description && <div className="text-[11px] text-gov-text-muted">{m.description}</div>}
                        </div>
                        <Badge variant={m.completed ? 'green' : 'amber'}>
                          {m.completed ? 'Completed' : 'In Progress'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right 1 Column: Location, Institution & Evidence */}
        <div className="space-y-6">
          {/* Geographical Location Card */}
          <Card title="Geographic Location & Coordinates" accent="none">
            <div className="space-y-2.5 text-xs">
              <div className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-gov-maroon flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-gov-navy">{problem.district}</div>
                  <div className="text-gov-text-secondary">{problem.location?.area || 'NCT of Delhi'}</div>
                  {problem.location?.landmark && (
                    <div className="text-gov-text-muted text-[11px] mt-0.5">
                      Landmark: {problem.location.landmark}
                    </div>
                  )}
                </div>
              </div>

              {problem.location?.coordinates && (
                <div className="mt-2 pt-2 border-t border-gov-border flex items-center justify-between text-[11px] text-gov-text-muted">
                  <span className="flex items-center">
                    <Compass className="w-3.5 h-3.5 mr-1 text-gov-navy" />
                    GPS Coordinates
                  </span>
                  <span className="font-mono font-medium text-gov-navy">
                    {problem.location.coordinates.lat?.toFixed(4)}, {problem.location.coordinates.lng?.toFixed(4)}
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* Active Project Lifecycle Link */}
          {problem.assignedProject && (
            <Card title="Active Engineering Project" accent="maroon">
              <div className="space-y-2.5 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-bold text-gov-navy text-sm leading-snug">
                    {problem.assignedProject.title}
                  </h4>
                  <Badge variant="navy">{problem.assignedProject.status}</Badge>
                </div>
                <div className="flex items-center justify-between text-[11px] text-gov-text-muted">
                  <span>Lifecycle: {problem.assignedProject.timeline || 'Active Sprint'}</span>
                  <span className="font-bold text-gov-maroon">
                    {problem.assignedProject.overallProgress || 0}% Complete
                  </span>
                </div>
                <div className="w-full bg-gov-sand-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gov-maroon h-full transition-all"
                    style={{ width: `${problem.assignedProject.overallProgress || 0}%` }}
                  ></div>
                </div>
                <div className="pt-2 border-t border-gov-border">
                  <Link to={`/projects/${problem.assignedProject._id}`}>
                    <Button variant="primary" size="sm" fullWidth className="bg-gov-maroon text-white">
                      Open Project Workspace &rarr;
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          )}

          {/* Assigned Institution Card */}
          <Card title="Assigned Institution & Cohort" accent="navy">
            {problem.assignedUniversity ? (
              <div className="space-y-3 text-xs">
                <div className="flex items-start space-x-2.5">
                  <Building className="w-4 h-4 text-blue-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-gov-navy">
                      {problem.assignedUniversity.name || 'University Research Lab'}
                    </div>
                    <div className="text-gov-text-muted text-[11px]">
                      {problem.assignedDepartment || problem.assignedUniversity.organization || 'Accredited Delhi Higher Education Institution'}
                    </div>
                  </div>
                </div>

                {(problem.assignedFaculty || problem.facultyLead?.name) && (
                  <div className="pt-2 border-t border-gov-border flex items-start space-x-2.5">
                    <User className="w-4 h-4 text-gov-maroon flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-gov-navy">Faculty Mentor:</span>
                      <div className="text-gov-text-secondary">
                        {problem.assignedFaculty?.name || problem.facultyLead?.name} ({problem.assignedFaculty?.department || problem.facultyLead?.department || 'Faculty Lead'})
                      </div>
                    </div>
                  </div>
                )}

                {problem.assignedStudentTeam && (
                  <div className="pt-2 border-t border-gov-border flex items-start space-x-2.5">
                    <Users className="w-4 h-4 text-indigo-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-gov-navy">Student Innovator Team:</span>
                      <div className="text-gov-text-secondary">
                        {problem.assignedStudentTeam.name || 'Multidisciplinary Student Cohort'}
                      </div>
                    </div>
                  </div>
                )}

                {problem.industryPartner && (
                  <div className="pt-2 border-t border-gov-border flex items-start space-x-2.5">
                    <Briefcase className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-gov-navy">Corporate / CSR Sponsor:</span>
                      <div className="text-emerald-700 font-semibold">
                        {problem.industryPartner.name || 'Industry Partner'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-gov-text-muted leading-relaxed">
                Pending institutional allocation. Once screened and approved by state administration, the challenge will be routed to a university research laboratory.
              </div>
            )}
          </Card>

          {/* Submitted Evidence & Attachments */}
          <Card title="Submitted Evidence & Artifacts" accent="none">
            {problem.evidence && problem.evidence.length > 0 ? (
              <div className="space-y-3 text-xs">
                {problem.evidence.map((ev, idx) => {
                  const isImage = ev.url && (ev.url.includes('images.unsplash.com') || /\.(jpg|jpeg|png|webp|gif)/i.test(ev.url));
                  return (
                    <div key={idx} className="p-2.5 bg-gov-sand-50 rounded-xs border border-gov-border flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 truncate mr-2">
                          <Paperclip className="w-3.5 h-3.5 text-gov-maroon flex-shrink-0" />
                          <span className="text-gov-navy font-semibold truncate">{ev.title}</span>
                        </div>
                        <a
                          href={ev.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gov-maroon hover:underline flex items-center text-[11px] font-bold flex-shrink-0"
                        >
                          <span>Open</span>
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      </div>

                      {isImage && (
                        <a
                          href={ev.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block rounded-xs overflow-hidden border border-gov-border max-h-36 group"
                        >
                          <img
                            src={ev.url}
                            alt={ev.title}
                            className="w-full h-32 object-cover group-hover:scale-102 transition-transform duration-200"
                          />
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-xs text-gov-text-muted py-2">
                No external document attachments or photographs uploaded with this submission.
              </div>
            )}
          </Card>

          {/* Citizen Verification Seal */}
          <div className="bg-gov-sand-100 border border-gov-border rounded-sm p-4 text-xs text-gov-text-secondary flex items-start space-x-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-gov-navy">Authenticated Citizen Record</span>
              <p className="text-[11px] text-gov-text-muted mt-0.5">
                Protected under Delhi Digital Public Goods standards. Official reference DEL-{problem.code || problem._id?.slice(-4).toUpperCase()}.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallengeDetailPage;
