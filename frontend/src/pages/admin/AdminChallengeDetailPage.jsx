import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import Timeline from '../../components/common/Timeline';
import WorkflowActionModal from '../../components/admin/WorkflowActionModal';
import AssignUniversityModal from '../../components/admin/AssignUniversityModal';
import AIAssistantCard from '../../components/admin/AIAssistantCard';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Building,
  User,
  Paperclip,
  Clock,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Copy,
  Sliders,
  Share2,
  MessageSquare,
  History,
  Send,
  RefreshCw
} from 'lucide-react';

const AdminChallengeDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [challenge, setChallenge] = useState(null);
  const [auditHistory, setAuditHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Workflow Modal state
  const [modalMode, setModalMode] = useState(null); // 'VALIDATE' | 'REJECT' | 'REQUEST_INFO' | 'MARK_DUPLICATE' | 'CHANGE_PRIORITY'
  const [assignModalOpen, setAssignModalOpen] = useState(false);

  // Internal Note state
  const [newNote, setNewNote] = useState('');
  const [noteSubmitting, setNoteSubmitting] = useState(false);

  const fetchDetail = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getChallengeDetail(id);
      setChallenge(res.data?.challenge);
      setAuditHistory(res.data?.auditHistory || []);
    } catch (err) {
      console.error('Failed to load challenge details:', err);
      setError(err.message || 'Challenge not found or access denied');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setNoteSubmitting(true);
    try {
      await adminService.addInternalNote(id, newNote.trim());
      setNewNote('');
      fetchDetail();
    } catch (err) {
      alert(err.message || 'Failed to append internal note');
    } finally {
      setNoteSubmitting(false);
    }
  };

  const handleAnalyzeAI = async () => {
    try {
      await adminService.aiAnalyzeChallenge(id);
      await fetchDetail();
    } catch (err) {
      alert(err.message || 'AI Problem Intelligence analysis encountered an error');
    }
  };

  const [matchingLoading, setMatchingLoading] = useState(false);

  const handleGenerateRecommendations = async () => {
    setMatchingLoading(true);
    try {
      await adminService.recommendUniversities(id);
      await fetchDetail();
    } catch (err) {
      alert(err.message || 'Failed to calculate AI university recommendations');
    } finally {
      setMatchingLoading(false);
    }
  };

  const handleAcceptRecommendation = async (uniId, uniName) => {
    try {
      await adminService.acceptUniversityRecommendation(id, uniId, `Assigned via AI-Assisted match for ${uniName}`);
      await fetchDetail();
    } catch (err) {
      alert(err.message || 'Failed to accept university recommendation');
    }
  };

  const handleIgnoreRecommendation = async (uniId) => {
    try {
      await adminService.ignoreUniversityRecommendation(id, uniId);
      await fetchDetail();
    } catch (err) {
      alert(err.message || 'Failed to ignore recommendation');
    }
  };

  if (loading) {
    return <LoadingState message="Loading challenge records, audit trail, and internal notes..." />;
  }

  if (error || !challenge) {
    return (
      <div className="py-12 max-w-lg mx-auto text-center font-serif">
        <ErrorState
          title="Challenge Record Unavailable"
          message={error || 'Challenge record not found or you do not have administrative clearance to access it.'}
          onRetry={fetchChallengeDetails}
          retryLabel="Retry Loading Challenge"
        />
        <div className="mt-4">
          <Link to="/admin/challenges">
            <Button variant="outline" size="sm" icon={ArrowLeft}>
              Return to Challenge Management
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return '--';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isPending = ['SUBMITTED', 'UNDER_REVIEW', 'NEEDS_INFORMATION'].includes(
    challenge.status?.toUpperCase()
  );

  return (
    <div className="space-y-6 font-serif">
      {/* Top Breadcrumb & Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/admin/challenges"
          className="inline-flex items-center text-xs text-gov-navy hover:text-gov-maroon font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Back to Challenge Registry
        </Link>

        {/* Top Quick Actions Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="subtle" size="sm" onClick={fetchDetail} icon={RefreshCw}>
            Sync
          </Button>

          {isPending && (
            <>
              <Button
                variant="primary"
                size="sm"
                className="bg-emerald-700 hover:bg-emerald-800"
                onClick={() => setModalMode('VALIDATE')}
                icon={CheckCircle2}
              >
                Approve / Validate
              </Button>

              <Button
                variant="subtle"
                size="sm"
                className="text-amber-800 bg-amber-50 hover:bg-amber-100"
                onClick={() => setModalMode('REQUEST_INFO')}
                icon={HelpCircle}
              >
                Request Info
              </Button>

              <Button
                variant="subtle"
                size="sm"
                className="text-rose-700 hover:bg-rose-50"
                onClick={() => setModalMode('REJECT')}
                icon={XCircle}
              >
                Reject
              </Button>
            </>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setModalMode('CHANGE_PRIORITY')}
            icon={Sliders}
          >
            Adjust Priority
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setModalMode('MARK_DUPLICATE')}
            icon={Copy}
          >
            Mark Duplicate
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setAssignModalOpen(true)}
            icon={Share2}
          >
            {challenge.assignedUniversity ? 'Re-allocate Lab' : 'Assign University'}
          </Button>
        </div>
      </div>

      {/* Challenge Title Banner */}
      <Card accent="navy">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gov-border pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-gov-maroon bg-gov-sand-50 px-2 py-0.5 rounded-xs border border-gov-border">
                {challenge.code || `DEL-${challenge._id.slice(-4).toUpperCase()}`}
              </span>
              <StatusBadge status={challenge.status} />
              <Badge variant="navy">{challenge.category}</Badge>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-gov-text-muted">
                Priority:{' '}
                <strong className="capitalize text-gov-maroon">{challenge.priority || 'Medium'}</strong>
              </span>
              <span>&bull;</span>
              <span className="text-gov-text-muted">
                Urgency:{' '}
                <strong className="capitalize text-amber-700">{challenge.urgency || 'Medium'}</strong>
              </span>
              <span>&bull;</span>
              <span className="text-gov-text-muted">
                Severity:{' '}
                <strong className="capitalize text-red-700">{challenge.severity || 'Moderate'}</strong>
              </span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-gov-navy leading-tight">
            {challenge.title}
          </h1>

          <div className="flex flex-wrap items-center gap-5 text-xs text-gov-text-muted pt-1">
            <span className="flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1 text-gov-maroon" />
              Submitted on {formatDate(challenge.createdAt)}
            </span>

            <span className="flex items-center">
              <MapPin className="w-3.5 h-3.5 mr-1 text-gov-maroon" />
              {challenge.district} &bull; {challenge.location?.area || 'Area Unspecified'}
            </span>

            {challenge.location?.landmark && (
              <span>Landmark: <strong>{challenge.location.landmark}</strong></span>
            )}
          </div>
        </div>
      </Card>

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Description, Impact, Evidence, Timeline, Audit Trail */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Problem Intelligence Assistant */}
          <AIAssistantCard
            challenge={challenge}
            onAnalyze={handleAnalyzeAI}
            onOverridePriority={() => setModalMode('CHANGE_PRIORITY')}
          />

          {/* AI-Assisted University Matching Advisory */}
          <Card accent="gold" title="AI-Assisted University Matching Advisory">
            <div className="space-y-3 font-serif">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gov-border pb-2">
                <div>
                  <div className="text-xs font-bold text-gov-navy">
                    Candidate Higher Education Institutions
                  </div>
                  <p className="text-[11px] text-gov-text-secondary">
                    Recommended based on expertise, facilities and project requirements.
                  </p>
                </div>

                <Button
                  variant="subtle"
                  size="sm"
                  onClick={handleGenerateRecommendations}
                  disabled={matchingLoading}
                  icon={RefreshCw}
                >
                  {matchingLoading ? 'Analyzing...' : 'Calculate AI Matches'}
                </Button>
              </div>

              {(!challenge.aiRecommendedUniversities || challenge.aiRecommendedUniversities.length === 0) ? (
                <div className="p-4 bg-gov-sand-50 rounded-xs border border-gov-border text-center space-y-2">
                  <p className="text-xs text-gov-text-secondary italic">
                    No university recommendations generated yet for this challenge.
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleGenerateRecommendations}
                    disabled={matchingLoading}
                    className="bg-gov-navy hover:bg-gov-navy-dark text-white text-xs"
                  >
                    Calculate Suitable Universities
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {challenge.aiRecommendedUniversities.map((rec, idx) => (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xs border transition-colors ${
                        rec.status === 'ACCEPTED'
                          ? 'bg-emerald-50/70 border-emerald-300'
                          : rec.status === 'IGNORED'
                          ? 'bg-gray-50/80 border-gray-200 opacity-60'
                          : 'bg-white border-gov-border hover:border-gov-navy'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center space-x-2 flex-wrap">
                          <span className="font-bold text-gov-navy text-xs sm:text-sm">
                            {rec.universityName}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-gov-sand-100 text-gov-maroon border border-gov-border">
                            {rec.percentage}% Match
                          </span>
                          {rec.status === 'ACCEPTED' && (
                            <Badge variant="emerald" className="text-[9px]">
                              Accepted & Assigned
                            </Badge>
                          )}
                          {rec.status === 'IGNORED' && (
                            <Badge variant="subtle" className="text-[9px]">
                              Ignored
                            </Badge>
                          )}
                        </div>

                        {rec.status === 'PENDING' && (
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleAcceptRecommendation(rec.universityId, rec.universityName)}
                              className="bg-gov-navy hover:bg-gov-navy-dark text-white text-[11px] py-1 px-2.5"
                            >
                              Accept & Assign
                            </Button>
                            <Button
                              variant="subtle"
                              size="sm"
                              onClick={() => handleIgnoreRecommendation(rec.universityId)}
                              className="text-[11px] py-1 px-2.5"
                            >
                              Ignore
                            </Button>
                          </div>
                        )}
                      </div>

                      <p className="text-[11px] text-gray-500 italic mt-1">
                        {rec.explainableSummary}
                      </p>

                      {rec.matchingReasons && rec.matchingReasons.length > 0 && (
                        <ul className="mt-2 space-y-1 text-xs text-gov-text-secondary list-disc list-inside">
                          {rec.matchingReasons.map((reason, rIdx) => (
                            <li key={rIdx} className="leading-snug">
                              {reason}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}

                  <div className="p-2.5 bg-amber-50/60 rounded-xs border border-amber-200 text-[11px] text-amber-900 flex items-start space-x-2">
                    <ShieldCheck className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Human Discretion Mandatory:</strong> AI recommendations assist administrators and do not automatically assign universities. You may accept a recommendation, ignore it, or manually assign any registered institution.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Problem Statement & Quantified Impact */}
          <Card accent="none" title="Problem Description & Ground Impact">
            <div className="space-y-4 text-xs leading-relaxed">
              <p className="text-gov-text-secondary whitespace-pre-line">
                {challenge.description}
              </p>

              <div className="p-3.5 bg-gov-sand-50 rounded-xs border border-gov-border space-y-1">
                <div className="font-bold text-gov-navy text-xs uppercase tracking-wider">
                  Quantified Societal Impact
                </div>
                <p className="text-gov-text-secondary">
                  {challenge.impact || 'Estimated 5,000+ local citizens and commuters affected.'}
                </p>
              </div>

              {challenge.duplicateOf && (
                <div className="p-3 bg-zinc-100 rounded-xs border border-zinc-300 text-xs text-zinc-800 flex items-center space-x-2">
                  <Copy className="w-4 h-4 text-zinc-600" />
                  <span>
                    Linked as duplicate of:{' '}
                    <strong>
                      [{challenge.duplicateOf.code}] {challenge.duplicateOf.title}
                    </strong>
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* Submitted Evidence */}
          <Card accent="none" title="Submitted Evidence & Field Documentation">
            {challenge.evidence && challenge.evidence.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {challenge.evidence.map((ev, idx) => (
                  <div
                    key={idx}
                    className="p-3 border border-gov-border rounded-xs flex items-center justify-between bg-gov-sand-50/50"
                  >
                    <div className="flex items-center space-x-2 truncate mr-2">
                      <Paperclip className="w-4 h-4 text-gov-maroon flex-shrink-0" />
                      <span className="font-medium text-gov-navy truncate">{ev.title}</span>
                    </div>
                    <a
                      href={ev.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gov-maroon hover:underline flex items-center text-[11px] font-bold flex-shrink-0"
                    >
                      <span>View</span>
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gov-text-muted italic">No attached evidence files submitted.</p>
            )}
          </Card>

          {/* Visual Progress Timeline */}
          <Card accent="navy" title="Public Lifecycle Stepper">
            <Timeline currentStatus={challenge.status} events={challenge.timeline || []} />
          </Card>

          {/* Immutable Audit Log History */}
          <Card
            accent="maroon"
            title={`Immutable State Audit History (${auditHistory.length} Actions Logged)`}
            subtitle="Every administrative review, priority adjustment, status transition, and comment timestamped for state accountability"
          >
            {auditHistory.length === 0 ? (
              <p className="text-xs text-gov-text-muted italic py-3">
                No formal administrative actions logged yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs divide-y divide-gov-border">
                  <thead>
                    <tr className="bg-gov-sand-100 text-gov-navy font-bold uppercase tracking-wider text-[10px]">
                      <th className="px-3 py-2.5 whitespace-nowrap">Timestamp</th>
                      <th className="px-3 py-2.5 whitespace-nowrap">Officer</th>
                      <th className="px-3 py-2.5 whitespace-nowrap">Action</th>
                      <th className="px-3 py-2.5 whitespace-nowrap">Status Progression</th>
                      <th className="px-3 py-2.5 min-w-[200px]">Remarks / Audit Directive</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gov-border bg-white">
                    {auditHistory.map((item) => (
                      <tr key={item._id} className="hover:bg-gov-sand-50 transition-colors">
                        <td className="px-3 py-2.5 whitespace-nowrap text-gov-text-muted text-[11px]">
                          {formatDate(item.timestamp)}
                        </td>

                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <div className="font-bold text-gov-navy">{item.userName}</div>
                          <div className="text-[10px] text-gov-maroon font-semibold">{item.userRole}</div>
                        </td>

                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-xs bg-gov-navy text-white uppercase">
                            {item.action.replace('_', ' ')}
                          </span>
                        </td>

                        <td className="px-3 py-2.5 whitespace-nowrap text-[11px]">
                          {item.previousStatus ? (
                            <span>
                              {item.previousStatus} &rarr;{' '}
                              <strong className="text-gov-navy">{item.newStatus}</strong>
                            </span>
                          ) : (
                            <strong className="text-gov-navy">{item.newStatus}</strong>
                          )}
                        </td>

                        <td className="px-3 py-2.5 text-gov-text-secondary leading-snug">
                          {item.comment || '--'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Right 1 Column: Submitter Details, Assigned Lab, Internal Notes */}
        <div className="space-y-6">
          {/* Submitter Details */}
          <Card title="Citizen / Submitter Information" accent="none">
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gov-maroon" />
                <span className="font-bold text-gov-navy">{challenge.submittedBy?.name || 'Citizen'}</span>
              </div>
              <p className="text-gov-text-secondary text-[11px]">
                {challenge.submittedBy?.organization || 'Registered Delhi Resident'}
              </p>
              <div className="pt-2 border-t border-gov-border space-y-1 text-gov-text-muted text-[11px]">
                <div>Email: {challenge.submittedBy?.email || 'N/A'}</div>
                <div>Phone: {challenge.submittedBy?.phone || 'N/A'}</div>
                <div>District: {challenge.submittedBy?.district || challenge.district}</div>
              </div>
            </div>
          </Card>

          {/* Assigned Higher Education Lab */}
          <Card title="Assigned Higher Education Lab" accent="navy">
            {challenge.assignedUniversity ? (
              <div className="space-y-3 text-xs">
                <div className="flex items-start space-x-2">
                  <Building className="w-4 h-4 text-blue-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-gov-navy">{challenge.assignedUniversity.name}</div>
                    <div className="text-gov-text-muted text-[11px]">
                      {challenge.assignedUniversity.organization || 'Higher Education Lab'}
                    </div>
                  </div>
                </div>

                {challenge.facultyLead?.name && (
                  <div className="pt-2 border-t border-gov-border text-[11px]">
                    <span className="font-bold text-gov-navy">Faculty Lead:</span>{' '}
                    <span>
                      {challenge.facultyLead.name} ({challenge.facultyLead.department || 'Engineering'})
                    </span>
                  </div>
                )}

                {challenge.industryPartner && (
                  <div className="pt-2 border-t border-gov-border text-[11px]">
                    <span className="font-bold text-gov-navy">Corporate Sponsor:</span>{' '}
                    <span className="text-emerald-700 font-semibold">
                      {challenge.industryPartner.name}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-gov-text-muted italic">
                Pending allocation. Click "Assign University" above to allocate to DTU, NSUT, or accredited Delhi labs.
              </div>
            )}
          </Card>

          {/* Internal Notes Thread */}
          <Card title="Internal Administrative Notes" accent="maroon">
            <div className="space-y-3">
              {/* Existing Notes */}
              <div className="max-h-60 overflow-y-auto space-y-2.5 text-xs">
                {challenge.internalNotes && challenge.internalNotes.length > 0 ? (
                  challenge.internalNotes.map((note, idx) => (
                    <div key={idx} className="p-3 bg-gov-sand-50 rounded-xs border border-gov-border space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-gov-text-muted">
                        <span className="font-bold text-gov-navy">{note.authorName || 'Administrator'}</span>
                        <span>{formatDate(note.createdAt)}</span>
                      </div>
                      <p className="text-gov-text-secondary leading-snug">{note.note}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gov-text-muted text-[11px] italic">
                    No internal notes posted yet. Use form below to add inter-departmental remarks.
                  </p>
                )}
              </div>

              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="pt-2 border-t border-gov-border space-y-2">
                <textarea
                  rows={2}
                  required
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add confidential inter-agency remark..."
                  className="w-full text-xs font-serif border border-gov-border rounded-xs p-2 focus:ring-1 focus:ring-gov-navy outline-none"
                />
                <Button
                  variant="primary"
                  size="sm"
                  fullWidth
                  type="submit"
                  disabled={noteSubmitting}
                  icon={Send}
                >
                  {noteSubmitting ? 'Posting Note...' : 'Post Internal Note'}
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </div>

      {/* Workflow Action Modal */}
      {modalMode && (
        <WorkflowActionModal
          challenge={challenge}
          mode={modalMode}
          onClose={() => setModalMode(null)}
          onSuccess={() => fetchDetail()}
        />
      )}

      {/* Assign University Modal */}
      {assignModalOpen && (
        <AssignUniversityModal
          challenge={challenge}
          onClose={() => setAssignModalOpen(false)}
          onSuccess={() => fetchDetail()}
        />
      )}
    </div>
  );
};

export default AdminChallengeDetailPage;
