import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { universityService } from '../../services/universityService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import {
  Compass,
  Eye,
  Heart,
  CheckCircle,
  X,
  Sparkles,
  MapPin,
  Calendar,
  Building,
  RefreshCw,
  Send,
  AlertCircle,
  AlertTriangle,
  XCircle,
  Search,
  RotateCcw
} from 'lucide-react';

const CATEGORY_OPTIONS = [
  'ALL',
  'Education',
  'Healthcare',
  'Agriculture',
  'Water Management',
  'Sanitation',
  'Environment',
  'Energy',
  'Urban Infrastructure',
  'Accessibility',
  'Public Services',
  'Rural Livelihoods',
  'Other'
];

const PRIORITY_OPTIONS = ['ALL', 'critical', 'high', 'medium', 'low'];

const PRIORITY_WEIGHTS = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1
};

const UniversityMarketplacePage = () => {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [universityExpertise, setUniversityExpertise] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search, Filter & Sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [sortBy, setSortBy] = useState('NEWEST');

  // Modals state
  const [viewingChallenge, setViewingChallenge] = useState(null);
  const [interestChallenge, setInterestChallenge] = useState(null);
  const [acceptChallenge, setAcceptChallenge] = useState(null);
  const [declineTarget, setDeclineTarget] = useState(null);

  // Form states
  const [interestNote, setInterestNote] = useState('');
  const [facultyName, setFacultyName] = useState('');
  const [facultyDept, setFacultyDept] = useState('');
  const [acceptComment, setAcceptComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');
  const [error, setError] = useState('');

  const fetchMarketplace = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await universityService.getChallenges();
      setChallenges(res.data?.availableChallenges || []);
      setUniversityExpertise(res.data?.universityExpertise || []);
    } catch (err) {
      console.error('Failed to load marketplace challenges:', err);
      setError(err.message || 'Unable to connect to civic problem exchange.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketplace();
  }, []);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('ALL');
    setSelectedPriority('ALL');
    setSortBy('NEWEST');
  };

  // Safe AI Fit Matcher for the authenticated university
  const getMyAiMatch = (challenge) => {
    if (!user || !challenge?.aiRecommendedUniversities?.length) return null;
    const myUserId = (user.id || user._id)?.toString();
    if (!myUserId) return null;
    return (
      challenge.aiRecommendedUniversities.find((rec) => {
        const recUniId = (
          rec.universityId?._id ||
          rec.universityId?.id ||
          rec.universityId
        )?.toString();
        return recUniId && recUniId === myUserId;
      }) || null
    );
  };

  // Filtered and Sorted Challenges
  const filteredChallenges = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const result = challenges.filter((c) => {
      // 1. Search filter across key fields
      if (q) {
        const code = (c.code || '').toLowerCase();
        const title = (c.title || '').toLowerCase();
        const desc = (c.description || '').toLowerCase();
        const district = (c.district || '').toLowerCase();
        const cat = (c.category || '').toLowerCase();
        const tags = Array.isArray(c.tags) ? c.tags.join(' ').toLowerCase() : '';
        const matchesSearch =
          code.includes(q) ||
          title.includes(q) ||
          desc.includes(q) ||
          district.includes(q) ||
          cat.includes(q) ||
          tags.includes(q);
        if (!matchesSearch) return false;
      }

      // 2. Category filter
      if (selectedCategory !== 'ALL' && c.category !== selectedCategory) {
        return false;
      }

      // 3. Priority filter
      if (selectedPriority !== 'ALL' && c.priority !== selectedPriority) {
        return false;
      }

      return true;
    });

    // Sort non-mutating
    return [...result].sort((a, b) => {
      if (sortBy === 'NEWEST') {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      if (sortBy === 'PRIORITY') {
        const weightA = PRIORITY_WEIGHTS[a.priority] || 0;
        const weightB = PRIORITY_WEIGHTS[b.priority] || 0;
        return weightB - weightA;
      }
      if (sortBy === 'AI_FIT') {
        const matchA = getMyAiMatch(a);
        const matchB = getMyAiMatch(b);
        const scoreA = matchA && typeof matchA.percentage === 'number' ? matchA.percentage : -1;
        const scoreB = matchB && typeof matchB.percentage === 'number' ? matchB.percentage : -1;
        return scoreB - scoreA;
      }
      if (sortBy === 'TITLE') {
        return (a.title || '').localeCompare(b.title || '');
      }
      return 0;
    });
  }, [challenges, searchQuery, selectedCategory, selectedPriority, sortBy, user]);

  const handleExpressInterest = async (e) => {
    e.preventDefault();
    if (!interestChallenge) return;

    setSubmitting(true);
    setActionError('');
    try {
      const res = await universityService.expressInterest(interestChallenge._id, interestNote);
      const isAlready = res?.data?.alreadyExpressed;
      setActionSuccess(
        isAlready
          ? `Interest was already previously registered for [${interestChallenge.code || 'Not provided'}].`
          : `Expression of interest registered for [${interestChallenge.code || 'Not provided'}]!`
      );
      setInterestChallenge(null);
      setInterestNote('');
      setTimeout(() => setActionSuccess(''), 4000);
      await fetchMarketplace();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to register interest';
      setActionError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptChallenge = async (e) => {
    e.preventDefault();
    if (!acceptChallenge) return;

    setSubmitting(true);
    setActionError('');
    try {
      await universityService.acceptChallenge(acceptChallenge._id, {
        facultyLeadName: facultyName,
        facultyLeadDepartment: facultyDept,
        comment: acceptComment
      });

      setActionSuccess(
        `Challenge [${acceptChallenge.code || 'Not provided'}] successfully adopted for institutional research!`
      );
      setAcceptChallenge(null);
      setFacultyName('');
      setFacultyDept('');
      setAcceptComment('');
      setTimeout(() => setActionSuccess(''), 4000);
      await fetchMarketplace();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to adopt challenge';
      setActionError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeclineChallenge = async () => {
    if (!declineTarget) return;

    setSubmitting(true);
    setActionError('');
    try {
      const res = await universityService.declineChallenge(declineTarget._id);
      const isAlready = res?.data?.alreadyDeclined;
      setActionSuccess(
        isAlready
          ? `Challenge [${declineTarget.code || 'Not provided'}] was already declined.`
          : `Challenge [${declineTarget.code || 'Not provided'}] recommendation declined. Removed from your marketplace.`
      );
      setDeclineTarget(null);
      setTimeout(() => setActionSuccess(''), 4000);
      await fetchMarketplace();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to decline challenge';
      setActionError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-serif">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold text-gov-maroon uppercase tracking-wider mb-1 flex items-center space-x-1.5">
            <Compass className="w-4 h-4 text-gov-maroon" />
            <span>Civic Problem Adoption Exchange</span>
          </div>
          <h1 className="text-2xl font-bold text-gov-navy">
            Challenge Marketplace ({challenges.length} Available)
          </h1>
          <p className="text-xs text-gov-text-secondary mt-0.5">
            Formally validated civic problem statements awaiting accredited Delhi higher education research cohorts.
          </p>
        </div>

        <Button variant="subtle" size="sm" onClick={fetchMarketplace} icon={RefreshCw}>
          Refresh Marketplace
        </Button>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            onClick={() => setActionSuccess('')}
            className="text-emerald-700 hover:text-emerald-900 p-0.5"
            aria-label="Dismiss success message"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{actionError}</span>
          </div>
          <button
            onClick={() => setActionError('')}
            className="text-rose-700 hover:text-rose-900 p-0.5"
            aria-label="Dismiss error message"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {loading ? (
        <LoadingState message="Loading available civic challenges & AI matching models..." />
      ) : error ? (
        <ErrorState
          title="Marketplace Connection Error"
          message={error}
          onRetry={fetchMarketplace}
          retryLabel="Retry Marketplace"
        />
      ) : challenges.length === 0 ? (
        <Card accent="none" className="py-12 text-center text-xs text-gov-text-muted space-y-2">
          <p className="font-bold text-gov-navy text-sm">No Unassigned Challenges Currently Available</p>
          <p className="text-[11px] max-w-md mx-auto">
            All validated Delhi civic challenges are actively assigned to participating university labs or undergoing nodal review.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Search, Filter & Sort Controls */}
          <div className="bg-white border border-gov-border rounded-xs p-3 space-y-3 shadow-xs">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              {/* Search Box */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gov-text-muted absolute left-2.5 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by code, title, description, district, category..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs font-serif border border-gov-border rounded-xs focus:ring-1 focus:ring-gov-navy focus:border-gov-navy outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Category Select */}
                <div className="flex items-center space-x-1">
                  <label className="text-[11px] font-bold text-gov-navy uppercase whitespace-nowrap">Category:</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="text-xs font-serif border border-gov-border rounded-xs px-2 py-1.5 bg-white focus:ring-1 focus:ring-gov-navy outline-none"
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat === 'ALL' ? 'All Categories' : cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority Select */}
                <div className="flex items-center space-x-1">
                  <label className="text-[11px] font-bold text-gov-navy uppercase whitespace-nowrap">Priority:</label>
                  <select
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value)}
                    className="text-xs font-serif border border-gov-border rounded-xs px-2 py-1.5 bg-white focus:ring-1 focus:ring-gov-navy outline-none"
                  >
                    {PRIORITY_OPTIONS.map((pri) => (
                      <option key={pri} value={pri}>
                        {pri === 'ALL' ? 'All Priorities' : pri.charAt(0).toUpperCase() + pri.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort Select */}
                <div className="flex items-center space-x-1">
                  <label className="text-[11px] font-bold text-gov-navy uppercase whitespace-nowrap">Sort:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="text-xs font-serif border border-gov-border rounded-xs px-2 py-1.5 bg-white focus:ring-1 focus:ring-gov-navy outline-none"
                  >
                    <option value="NEWEST">Newest First</option>
                    <option value="PRIORITY">Highest Priority</option>
                    <option value="AI_FIT">Highest AI Match</option>
                    <option value="TITLE">Title (A-Z)</option>
                  </select>
                </div>

                {/* Reset Button */}
                {(searchQuery || selectedCategory !== 'ALL' || selectedPriority !== 'ALL' || sortBy !== 'NEWEST') && (
                  <Button
                    variant="subtle"
                    size="sm"
                    onClick={handleResetFilters}
                    icon={RotateCcw}
                    className="text-gov-text-secondary hover:text-gov-navy"
                    title="Reset filters and sorting"
                  >
                    Reset
                  </Button>
                )}
              </div>
            </div>

            {/* Counter bar */}
            <div className="flex items-center justify-between text-[11px] text-gov-text-secondary pt-1 border-t border-gov-border/50">
              <span>
                Showing <strong className="text-gov-navy">{filteredChallenges.length}</strong> of{' '}
                <strong className="text-gov-navy">{challenges.length}</strong> available challenges
              </span>
              {(searchQuery || selectedCategory !== 'ALL' || selectedPriority !== 'ALL') && (
                <span className="text-[10px] bg-gov-sand-100 text-gov-navy px-2 py-0.5 rounded-xs">
                  Filters Active
                </span>
              )}
            </div>
          </div>

          {/* Results Table or Filtered Empty State */}
          {filteredChallenges.length === 0 ? (
            <Card accent="none" className="py-12 text-center text-xs text-gov-text-muted space-y-3">
              <p className="font-bold text-gov-navy text-sm">No Challenges Match Your Filter Criteria</p>
              <p className="text-[11px] max-w-md mx-auto">
                Try adjusting your search query, selecting &quot;All Categories&quot; or &quot;All Priorities&quot;, or clearing your active filters.
              </p>
              <div>
                <Button variant="subtle" size="sm" onClick={handleResetFilters} icon={RotateCcw}>
                  Clear All Filters
                </Button>
              </div>
            </Card>
          ) : (
            <Card accent="navy">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs divide-y divide-gov-border">
                  <thead>
                    <tr className="bg-gov-sand-100 text-gov-navy font-bold uppercase tracking-wider text-[10px]">
                      <th className="px-3 py-2.5 whitespace-nowrap">Challenge ID</th>
                      <th className="px-3 py-2.5 min-w-[200px]">Title & Focus</th>
                      <th className="px-3 py-2.5 whitespace-nowrap">Category</th>
                      <th className="px-3 py-2.5 whitespace-nowrap">District</th>
                      <th className="px-3 py-2.5 whitespace-nowrap">Priority</th>
                      <th className="px-3 py-2.5 min-w-[170px]">AI Recommended Expertise</th>
                      <th className="px-3 py-2.5 whitespace-nowrap">Validated Date</th>
                      <th className="px-3 py-2.5 text-right whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gov-border bg-white">
                    {filteredChallenges.map((c) => {
                      const myAiMatch = getMyAiMatch(c);
                      return (
                        <tr key={c._id} className="hover:bg-gov-sand-50 transition-colors">
                          {/* ID */}
                          <td className="px-3 py-3 whitespace-nowrap">
                            <span className="font-mono font-bold text-gov-maroon">
                              {c.code || 'Not provided'}
                            </span>
                          </td>

                          {/* Title */}
                          <td className="px-3 py-3">
                            <div className="font-bold text-gov-navy line-clamp-1">{c.title}</div>
                            <div className="text-[11px] text-gov-text-secondary line-clamp-1 mt-0.5">
                              {c.description}
                            </div>
                            {c.isRelevant && (
                              <span className="inline-block mt-1 text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-xs">
                                &bull; Matches University Expertise
                              </span>
                            )}
                          </td>

                          {/* Category */}
                          <td className="px-3 py-3 whitespace-nowrap">
                            <Badge variant="navy">{c.category}</Badge>
                          </td>

                          {/* District */}
                          <td className="px-3 py-3 whitespace-nowrap text-gov-text-secondary">
                            {c.district || 'Not provided'}
                          </td>

                          {/* Priority */}
                          <td className="px-3 py-3 whitespace-nowrap">
                            <span
                              className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-xs ${
                                c.priority === 'critical'
                                  ? 'bg-rose-100 text-rose-800 font-extrabold'
                                  : c.priority === 'high'
                                  ? 'bg-amber-100 text-amber-900'
                                  : 'bg-stone-100 text-stone-700'
                              }`}
                            >
                              {c.priority}
                            </span>
                          </td>

                          {/* AI Recommended Expertise & Institutional Match */}
                          <td className="px-3 py-3">
                            <div className="flex flex-col gap-1">
                              {myAiMatch && typeof myAiMatch.percentage === 'number' && (
                                <div className="flex items-center space-x-1 mb-0.5">
                                  <span
                                    className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300"
                                    title="AI Recommendation for your institution"
                                  >
                                    <Sparkles className="w-2.5 h-2.5 mr-1 text-amber-700" />
                                    {myAiMatch.percentage}% AI Fit
                                  </span>
                                </div>
                              )}
                              <div className="flex flex-wrap gap-1">
                                {(c.aiRecommendedExpertise || []).map((exp, idx) => (
                                  <span
                                    key={idx}
                                    className={`text-[10px] font-medium px-1.5 py-0.2 rounded-xs border ${
                                      universityExpertise.includes(exp)
                                        ? 'bg-indigo-50 text-indigo-800 border-indigo-200 font-bold'
                                        : 'bg-gov-sand-50 text-gov-navy border-gov-border'
                                    }`}
                                  >
                                    {exp}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </td>

                          {/* Date */}
                          <td className="px-3 py-3 whitespace-nowrap text-gov-text-muted text-[11px]">
                            {new Date(c.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </td>

                          {/* Actions */}
                          <td className="px-3 py-3 whitespace-nowrap text-right space-x-1">
                            <Button
                              variant="subtle"
                              size="sm"
                              onClick={() => setViewingChallenge(c)}
                              title="View Full Challenge Statement"
                              icon={Eye}
                            >
                              View
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setActionError('');
                                setInterestChallenge(c);
                              }}
                              title="Express Research Interest"
                              icon={Heart}
                              className="text-amber-800 border-amber-300 hover:bg-amber-50"
                            >
                              Interest
                            </Button>

                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => {
                                setActionError('');
                                setAcceptChallenge(c);
                              }}
                              title="Accept Challenge for Lab Prototyping"
                              icon={CheckCircle}
                              className="bg-emerald-700 hover:bg-emerald-800 text-white"
                            >
                              Accept
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setActionError('');
                                setDeclineTarget(c);
                              }}
                              title="Decline this Challenge Recommendation"
                              icon={XCircle}
                              className="text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                            >
                              Decline
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* 1. View Challenge Detail Modal */}
      {viewingChallenge && (() => {
        const modalAiMatch = getMyAiMatch(viewingChallenge);
        return (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-gov-border rounded-sm max-w-2xl w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-gov-border pb-3">
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-gov-maroon bg-gov-sand-50 px-2 py-0.5 rounded-xs border border-gov-border text-xs">
                    {viewingChallenge.code || 'Not provided'}
                  </span>
                  <StatusBadge status={viewingChallenge.status} />
                  <Badge variant="navy">{viewingChallenge.category}</Badge>
                </div>
                <button
                  onClick={() => setViewingChallenge(null)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <h3 className="font-bold text-gov-navy text-lg leading-snug">
                {viewingChallenge.title}
              </h3>

              <div className="space-y-3 text-xs leading-relaxed">
                <div className="p-3 bg-gov-sand-50 rounded-xs border border-gov-border">
                  <span className="font-bold text-gov-navy block uppercase text-[10px] tracking-wider mb-1">
                    Ground Problem Statement
                  </span>
                  <p className="text-gov-text-secondary whitespace-pre-line">
                    {viewingChallenge.description}
                  </p>
                </div>

                {viewingChallenge.impact && (
                  <div className="p-2.5 bg-amber-50 rounded-xs border border-amber-200">
                    <span className="font-bold text-amber-900 block text-[10px] uppercase">
                      Quantified Societal Impact
                    </span>
                    <p className="text-amber-800 text-[11px]">{viewingChallenge.impact}</p>
                  </div>
                )}

                {/* Safe Institutional AI Recommendation Match */}
                {modalAiMatch && (
                  <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xs space-y-1.5 font-serif">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-950 uppercase text-[10px] tracking-wider flex items-center space-x-1">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-700 mr-1" />
                        Institutional AI Recommendation Match (AI-Generated)
                      </span>
                      {typeof modalAiMatch.percentage === 'number' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-900 border border-indigo-300">
                          {modalAiMatch.percentage}% Match
                        </span>
                      )}
                    </div>
                    {modalAiMatch.explainableSummary && (
                      <p className="text-[11px] text-indigo-900 italic">
                        {modalAiMatch.explainableSummary}
                      </p>
                    )}
                    {modalAiMatch.matchingReasons && modalAiMatch.matchingReasons.length > 0 && (
                      <ul className="text-[11px] text-indigo-950 list-disc list-inside space-y-0.5 pt-1">
                        {modalAiMatch.matchingReasons.map((reason, rIdx) => (
                          <li key={rIdx}>{reason}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-4 text-gov-text-muted text-[11px] pt-1">
                  <span className="flex items-center">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-gov-maroon" />
                    {viewingChallenge.district || 'Not provided'} &bull;{' '}
                    {viewingChallenge.location?.area || 'Not provided'}
                  </span>
                  <span className="flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-1 text-gov-maroon" />
                    Validated on {new Date(viewingChallenge.createdAt).toLocaleDateString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-gov-border flex items-center justify-end space-x-2">
                <Button variant="ghost" size="sm" onClick={() => setViewingChallenge(null)}>
                  Close
                </Button>
                <Button
                  variant="subtle"
                  size="sm"
                  onClick={() => {
                    const target = viewingChallenge;
                    setViewingChallenge(null);
                    setActionError('');
                    setDeclineTarget(target);
                  }}
                  className="text-rose-700 border-rose-200 hover:bg-rose-50"
                >
                  Decline
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    const target = viewingChallenge;
                    setViewingChallenge(null);
                    setActionError('');
                    setAcceptChallenge(target);
                  }}
                  className="bg-emerald-700 hover:bg-emerald-800"
                >
                  Accept Challenge
                </Button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 2. Express Interest Modal */}
      {interestChallenge && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gov-border rounded-sm max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gov-border pb-3">
              <h3 className="font-bold text-gov-navy text-base flex items-center space-x-1.5">
                <Heart className="w-4 h-4 text-amber-600" />
                <span>Express Institutional Interest</span>
              </h3>
              <button
                onClick={() => setInterestChallenge(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2.5 bg-gov-sand-50 rounded-xs border border-gov-border text-xs">
              <div className="font-bold text-gov-navy">
                [{interestChallenge.code || 'Not provided'}] {interestChallenge.title}
              </div>
              <div className="text-[11px] text-gov-text-muted mt-0.5">
                District: {interestChallenge.district || 'Not provided'} &bull; Category: {interestChallenge.category}
              </div>
            </div>

            <form onSubmit={handleExpressInterest} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gov-navy uppercase tracking-wider mb-1">
                  Expression of Interest & Lab Assessment Notes
                </label>
                <textarea
                  rows={3}
                  value={interestNote}
                  onChange={(e) => setInterestNote(e.target.value)}
                  placeholder="Outline your department or lab's technical capability to address this challenge..."
                  className="w-full text-xs font-serif border border-gov-border rounded-xs p-2 focus:ring-1 focus:ring-gov-navy outline-none"
                />
              </div>

              <div className="pt-3 border-t border-gov-border flex items-center justify-end space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setInterestChallenge(null)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  disabled={submitting}
                  icon={Send}
                >
                  {submitting ? 'Registering...' : 'Submit Expression of Interest'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Accept Challenge Modal */}
      {acceptChallenge && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gov-border rounded-sm max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gov-border pb-3">
              <h3 className="font-bold text-gov-navy text-base flex items-center space-x-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Adopt Civic Challenge for Academic Prototyping</span>
              </h3>
              <button
                onClick={() => setAcceptChallenge(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2.5 bg-gov-sand-50 rounded-xs border border-gov-border text-xs">
              <div className="font-bold text-gov-navy">
                [{acceptChallenge.code || 'Not provided'}] {acceptChallenge.title}
              </div>
              <div className="text-[11px] text-gov-text-muted mt-0.5">
                District: {acceptChallenge.district || 'Not provided'} &bull; Category: {acceptChallenge.category}
              </div>
            </div>

            <form onSubmit={handleAcceptChallenge} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gov-navy uppercase tracking-wider mb-1">
                  Designated Faculty Mentor Name *
                </label>
                <input
                  type="text"
                  required
                  value={facultyName}
                  onChange={(e) => setFacultyName(e.target.value)}
                  placeholder="e.g. Prof. S. K. Sharma"
                  className="w-full text-xs font-serif border border-gov-border rounded-xs px-3 py-2 focus:ring-1 focus:ring-emerald-700 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gov-navy uppercase tracking-wider mb-1">
                  Supervising Academic Department *
                </label>
                <input
                  type="text"
                  required
                  value={facultyDept}
                  onChange={(e) => setFacultyDept(e.target.value)}
                  placeholder="e.g. Department of Environmental Engineering"
                  className="w-full text-xs font-serif border border-gov-border rounded-xs px-3 py-2 focus:ring-1 focus:ring-emerald-700 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gov-navy uppercase tracking-wider mb-1">
                  Institutional Adoption Commitment / Directive
                </label>
                <textarea
                  rows={2}
                  value={acceptComment}
                  onChange={(e) => setAcceptComment(e.target.value)}
                  placeholder="Accepted for multidisciplinary engineering prototype and field verification in Delhi..."
                  className="w-full text-xs font-serif border border-gov-border rounded-xs px-3 py-2 focus:ring-1 focus:ring-emerald-700 outline-none"
                />
              </div>

              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xs text-[11px] text-emerald-900">
                <strong>Grant Notice:</strong> Accepting this challenge assigns it to your university in GNCTD records and unlocks student team cohort allocation.
              </div>

              <div className="pt-3 border-t border-gov-border flex items-center justify-end space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAcceptChallenge(null)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  disabled={submitting}
                  className="bg-emerald-700 hover:bg-emerald-800"
                >
                  {submitting ? 'Adopting Challenge...' : 'Confirm Institutional Adoption'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* 4. Decline Challenge Confirmation Modal */}
      {declineTarget && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gov-border rounded-sm max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gov-border pb-3">
              <h3 className="font-bold text-gov-navy text-base flex items-center space-x-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Decline Challenge Recommendation</span>
              </h3>
              <button
                onClick={() => setDeclineTarget(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2.5 bg-gov-sand-50 rounded-xs border border-gov-border text-xs">
              <div className="font-bold text-gov-navy">
                [{declineTarget.code || 'Not provided'}] {declineTarget.title}
              </div>
              <div className="text-[11px] text-gov-text-muted mt-0.5">
                District: {declineTarget.district || 'Not provided'} &bull; Category: {declineTarget.category}
              </div>
            </div>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xs text-xs text-rose-900 leading-relaxed space-y-1">
              <p className="font-bold">Are you sure you want to decline this challenge?</p>
              <p className="text-[11px] text-rose-800">
                Declining removes this challenge recommendation from your institution&apos;s marketplace. Other recommended universities will still be able to view and adopt it.
              </p>
            </div>

            <div className="pt-3 border-t border-gov-border flex items-center justify-end space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeclineTarget(null)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleDeclineChallenge}
                disabled={submitting}
                className="bg-rose-700 hover:bg-rose-800 text-white"
              >
                {submitting ? 'Declining...' : 'Confirm Decline'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UniversityMarketplacePage;
