import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardCard from '../components/common/DashboardCard';
import ChallengeTable from '../components/common/ChallengeTable';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import SubmitChallengeModal from '../components/challenge/SubmitChallengeModal';
import { problemService } from '../services/problemService';
import { useAuth } from '../hooks/useAuth';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  MapPin,
  RefreshCw
} from 'lucide-react';

const CitizenDashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await problemService.getMyProblems();
      const { stats: fetchedStats, problems: fetchedProblems } = response.data || {};
      setStats(fetchedStats || { total: 0, underReview: 0, inProgress: 0, resolved: 0 });
      setProblems(fetchedProblems || []);
    } catch (err) {
      console.error('Failed to load citizen problems:', err);
      setError(err.message || 'Failed to fetch dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) {
    return <LoadingState message="Loading your submitted challenges and statistics..." />;
  }

  if (error) {
    return (
      <div className="py-8">
        <ErrorState
          title="Failed to Load Citizen Console"
          message={error}
          onRetry={loadDashboardData}
          retryLabel="Retry Dashboard"
        />
      </div>
    );
  }

  // Recent 5 challenges for the overview table
  const recentChallenges = problems.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white border border-gov-border rounded-sm p-6 shadow-gov-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-serif text-gov-maroon font-bold uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Welcome, {user?.name || 'Citizen'}</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-gov-navy leading-tight">
            Citizen Problem Monitoring Console
          </h1>
          <p className="text-xs font-serif text-gov-text-secondary mt-1 max-w-2xl">
            Track community grievances, monitor university research progress, and observe municipal field deployments across Delhi's 11 districts.
          </p>
        </div>

        <div className="flex items-center space-x-3 flex-shrink-0">
          <Button variant="subtle" size="sm" onClick={loadDashboardData} icon={RefreshCw}>
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={PlusCircle}
            onClick={() => setIsSubmitModalOpen(true)}
          >
            Submit a Problem
          </Button>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-serif rounded-sm flex items-center justify-between animate-in fade-in duration-150">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span className="font-semibold">{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage('')}
            className="text-xs text-emerald-700 hover:underline font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-serif rounded-sm flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="subtle" size="sm" onClick={loadDashboardData}>
            Retry
          </Button>
        </div>
      )}

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="Challenges Submitted"
          value={stats?.total || 0}
          subtitle="Total community problems lodged"
          icon={FileText}
          accent="maroon"
          onClick={() => navigate('/client/challenges')}
        />

        <DashboardCard
          title="Under Review"
          value={stats?.underReview || 0}
          subtitle="Screening by state administration"
          icon={Clock}
          accent="amber"
          onClick={() => navigate('/client/challenges?status=UNDER_REVIEW')}
        />

        <DashboardCard
          title="In Progress"
          value={stats?.inProgress || 0}
          subtitle="Active university prototyping"
          icon={TrendingUp}
          accent="navy"
          onClick={() => navigate('/client/challenges?status=IN_PROGRESS')}
        />

        <DashboardCard
          title="Resolved"
          value={stats?.resolved || 0}
          subtitle="Certified municipal solutions"
          icon={CheckCircle2}
          accent="emerald"
          onClick={() => navigate('/client/challenges?status=RESOLVED')}
        />
      </div>

      {/* Recent Challenges Section */}
      <Card
        accent="maroon"
        title="Recent Challenges"
        subtitle="Your latest submitted societal statements and active lifecycle status"
        headerAction={
          <Link to="/client/challenges">
            <Button variant="subtle" size="sm" icon={ArrowRight}>
              View All ({problems.length})
            </Button>
          </Link>
        }
      >
        <ChallengeTable
          challenges={recentChallenges}
          onViewDetails={(id) => navigate(`/client/challenges/${id}`)}
          emptyMessage="You have not submitted any challenges yet. Use 'Submit a Challenge' to lodge your first community problem."
        />
      </Card>

      {/* Civic Guidelines Banner */}
      <div className="bg-gov-sand-100 border border-gov-border rounded-sm p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs font-serif">
        <div className="flex items-start space-x-3">
          <MapPin className="w-5 h-5 text-gov-maroon flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-gov-navy">Delhi Civic Innovation Framework</span>
            <p className="text-gov-text-secondary mt-0.5">
              Verified problem statements in water, sanitation, and air quality are paired with research labs at DTU, NSUT, and IIIT-Delhi for funded pilot prototypes.
            </p>
          </div>
        </div>

        <Link to="/client/help" className="flex-shrink-0">
          <Button variant="outline" size="sm">
            Read Reporting Standards
          </Button>
        </Link>
      </div>

      {/* Quick Problem Submission Modal */}
      <SubmitChallengeModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onSuccess={(newChallenge) => {
          setIsSubmitModalOpen(false);
          setSuccessMessage(
            `Problem "${newChallenge?.title || 'Statement'}" registered successfully with code ${newChallenge?.code || 'DEL'}!`
          );
          loadDashboardData();
        }}
      />
    </div>
  );
};

export default CitizenDashboardPage;
