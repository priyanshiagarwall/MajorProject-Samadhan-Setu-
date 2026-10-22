import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { problemService } from '../services/problemService';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import ChallengeTable from '../components/common/ChallengeTable';
import ChallengeCard from '../components/common/ChallengeCard';
import EmptyState from '../components/common/EmptyState';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import { Bookmark, LayoutGrid, LayoutList, RefreshCw, PlusCircle, ArrowRight } from 'lucide-react';

const SavedChallengesPage = () => {
  const navigate = useNavigate();
  const [savedProblems, setSavedProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'

  const fetchSaved = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await problemService.getSavedProblems();
      setSavedProblems(res.data?.problems || []);
    } catch (err) {
      console.error('Failed to load saved challenges:', err);
      setError(err.message || 'Failed to fetch your bookmarked challenges.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSaved();
  }, []);

  if (loading) {
    return <LoadingState message="Loading your bookmarked challenges..." />;
  }

  if (error) {
    return (
      <div className="py-8 font-serif">
        <ErrorState
          title="Could Not Load Saved Challenges"
          message={error}
          onRetry={fetchSaved}
          retryLabel="Retry Loading"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-serif">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-amber-700 font-bold uppercase tracking-wider mb-1">
            <Bookmark className="w-4 h-4" />
            <span>Bookmarked Challenges ({savedProblems.length})</span>
          </div>
          <h1 className="text-2xl font-bold text-gov-navy">
            Saved Challenges
          </h1>
          <p className="text-xs text-gov-text-secondary mt-1">
            Track societal problems you have flagged for continuous monitoring and research progress.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="subtle" size="sm" onClick={fetchSaved} icon={RefreshCw}>
            Refresh
          </Button>

          {/* View Mode Toggle */}
          {savedProblems.length > 0 && (
            <div className="flex items-center border border-gov-border rounded-xs overflow-hidden">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-gov-maroon text-white'
                    : 'bg-white text-gov-navy hover:bg-gov-sand-100'
                }`}
                title="Table View"
              >
                <LayoutList className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-gov-maroon text-white'
                    : 'bg-white text-gov-navy hover:bg-gov-sand-100'
                }`}
                title="Grid Card View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          )}

          <Link to="/client/challenges">
            <Button variant="outline" size="sm" icon={ArrowRight}>
              Browse All
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Content Area */}
      {savedProblems.length === 0 ? (
        <Card accent="none">
          <EmptyState
            icon={Bookmark}
            title="No Saved Challenges Yet"
            description="You have not saved any challenges to your bookmarks. Browse community challenges and click 'Save Challenge' to bookmark them here."
            actionLabel="Explore My Challenges"
            onAction={() => navigate('/client/challenges')}
          />
        </Card>
      ) : viewMode === 'table' ? (
        <Card accent="navy" title="Bookmarked Challenge Registry">
          <ChallengeTable
            challenges={savedProblems}
            onViewDetails={(id) => navigate(`/client/challenges/${id}`)}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {savedProblems.map((challenge) => (
            <ChallengeCard key={challenge._id} challenge={challenge} />
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedChallengesPage;
