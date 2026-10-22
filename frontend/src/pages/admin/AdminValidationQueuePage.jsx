import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import ChallengeDetailModal from '../../components/admin/ChallengeDetailModal';
import AssignUniversityModal from '../../components/admin/AssignUniversityModal';
import {
  CheckSquare,
  Clock,
  Check,
  XCircle,
  Eye,
  Share2,
  RefreshCw,
  AlertCircle,
  MapPin,
  Calendar
} from 'lucide-react';

const AdminValidationQueuePage = () => {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [assigningChallenge, setAssigningChallenge] = useState(null);

  const [error, setError] = useState('');

  const fetchQueue = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getValidationQueue();
      setQueue(res.data?.queue || []);
    } catch (err) {
      console.error('Failed to load validation queue:', err);
      setError(err.message || 'Failed to load validation queue from state registry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleValidate = async (challenge) => {
    try {
      await adminService.updateChallengeStatus(
        challenge._id,
        'VALIDATED',
        'Validated by Delhi State Administration'
      );
      fetchQueue();
    } catch (err) {
      alert(err.message || 'Failed to validate challenge');
    }
  };

  const handleReject = async (challenge) => {
    const reason = window.prompt('Specify official rejection reason:', 'Out of state jurisdiction or duplicate.');
    if (!reason) return;

    try {
      await adminService.updateChallengeStatus(challenge._id, 'REJECTED', reason);
      fetchQueue();
    } catch (err) {
      alert(err.message || 'Failed to reject challenge');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '--';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6 font-serif">
      {/* Page Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-amber-700 font-bold uppercase tracking-wider mb-1">
            <CheckSquare className="w-4 h-4" />
            <span>Validation & Screening Pipeline</span>
          </div>
          <h1 className="text-2xl font-bold text-gov-navy">
            Challenge Validation Queue ({queue.length} Pending)
          </h1>
          <p className="text-xs text-gov-text-secondary mt-1">
            Prioritize and vet new citizen submissions against Delhi digital public goods criteria before academic allocation.
          </p>
        </div>

        <Button variant="subtle" size="sm" onClick={fetchQueue} icon={RefreshCw}>
          Refresh Queue
        </Button>
      </div>

      {loading ? (
        <LoadingState message="Loading validation queue..." />
      ) : error ? (
        <Card accent="none">
          <ErrorState
            title="Validation Queue Unavailable"
            message={error}
            onRetry={fetchQueue}
            retryLabel="Retry Loading Queue"
          />
        </Card>
      ) : queue.length === 0 ? (
        <Card accent="none">
          <EmptyState
            title="Validation Queue Clear"
            description="All reported citizen problems have been vetted, validated, or allocated to academic cohorts."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {queue.map((item) => (
            <Card key={item._id} accent="amber" className="p-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-gov-maroon bg-gov-sand-100 px-2 py-0.5 rounded-xs border border-gov-border">
                      {item.code || `DEL-${item._id.slice(-4).toUpperCase()}`}
                    </span>
                    <StatusBadge status={item.status} />
                    <span className="text-xs font-semibold px-2 py-0.5 bg-gov-navy text-white rounded-xs">
                      {item.category}
                    </span>
                    <span className="text-xs text-gov-text-muted">
                      Priority: <strong className="capitalize text-gov-maroon">{item.priority || 'Medium'}</strong>
                    </span>
                  </div>

                  <h3
                    onClick={() => setSelectedChallenge(item)}
                    className="text-base font-bold text-gov-navy hover:text-gov-maroon cursor-pointer leading-snug"
                  >
                    {item.title}
                  </h3>

                  <p className="text-xs text-gov-text-secondary leading-relaxed line-clamp-2">
                    {item.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-gov-text-muted pt-1">
                    <span className="flex items-center">
                      <MapPin className="w-3.5 h-3.5 mr-1 text-gov-maroon" />
                      {item.district} {item.location?.landmark ? `• Near ${item.location.landmark}` : ''}
                    </span>
                    <span className="flex items-center">
                      <Calendar className="w-3.5 h-3.5 mr-1 text-gov-text-muted" />
                      Submitted: {formatDate(item.createdAt)}
                    </span>
                    <span>
                      Reporter: <strong>{item.submittedBy?.name || 'Citizen'}</strong>
                    </span>
                  </div>
                </div>

                {/* Direct Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 flex-shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-gov-border">
                  <Button
                    variant="subtle"
                    size="sm"
                    onClick={() => setSelectedChallenge(item)}
                    icon={Eye}
                  >
                    Inspect
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    className="bg-emerald-700 hover:bg-emerald-800"
                    onClick={() => handleValidate(item)}
                    icon={Check}
                  >
                    Validate
                  </Button>

                  <Button
                    variant="subtle"
                    size="sm"
                    className="text-rose-700 hover:bg-rose-50"
                    onClick={() => handleReject(item)}
                    icon={XCircle}
                  >
                    Reject
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAssigningChallenge(item)}
                    icon={Share2}
                  >
                    Assign
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modals */}
      {selectedChallenge && (
        <ChallengeDetailModal
          challenge={selectedChallenge}
          onClose={() => setSelectedChallenge(null)}
          onValidate={handleValidate}
          onReject={handleReject}
          onAssign={(c) => setAssigningChallenge(c)}
        />
      )}

      {assigningChallenge && (
        <AssignUniversityModal
          challenge={assigningChallenge}
          onClose={() => setAssigningChallenge(null)}
          onSuccess={() => fetchQueue()}
        />
      )}
    </div>
  );
};

export default AdminValidationQueuePage;
