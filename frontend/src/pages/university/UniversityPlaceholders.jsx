import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { universityService } from '../../services/universityService';
import { projectService } from '../../services/projectService';
import { notificationService } from '../../services/notificationService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingState from '../../components/common/LoadingState';
import {
  CheckSquare,
  Briefcase,
  Users2,
  GraduationCap,
  Users,
  Award,
  BookOpen,
  Bell,
  RefreshCw,
  Plus,
  Check,
  CheckCheck,
  Clock
} from 'lucide-react';

/**
 * Assigned Challenges Page (/university/assigned)
 */
export const UniversityAssignedPage = () => {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await universityService.getChallenges();
      setChallenges(res.data?.assignedChallenges || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6 font-serif">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gov-navy">
            Assigned Civic Challenges ({challenges.length})
          </h1>
          <p className="text-xs text-gov-text-secondary mt-0.5">
            Societal problems officially allocated by the Delhi Government to your university research cohorts.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="subtle" size="sm" onClick={fetchData} icon={RefreshCw}>
            Refresh
          </Button>
          <Link to="/university/projects">
            <Button variant="primary" size="sm" icon={Briefcase} className="bg-gov-maroon text-white">
              View Innovation Projects
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <LoadingState message="Loading assigned challenges..." />
      ) : challenges.length === 0 ? (
        <Card accent="none" className="py-12 text-center text-xs text-gov-text-muted">
          No challenges currently assigned to this institution.
        </Card>
      ) : (
        <div className="space-y-4">
          {challenges.map((c) => (
            <Card key={c._id} accent="maroon" className="p-5">
              <div className="space-y-3 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gov-border pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-gov-maroon bg-gov-sand-50 px-2 py-0.5 rounded-xs border border-gov-border">
                      {c.code}
                    </span>
                    <StatusBadge status={c.status} />
                    <Badge variant="navy">{c.category}</Badge>
                  </div>
                  <span className="text-gov-text-muted text-[11px]">{c.district}</span>
                </div>

                <h3 className="text-base font-bold text-gov-navy">{c.title}</h3>
                <p className="text-gov-text-secondary leading-relaxed">{c.description}</p>

                <div className="pt-2 border-t border-gov-border flex flex-wrap items-center justify-between gap-2 text-[11px] text-gov-text-muted">
                  <div>
                    {c.facultyLead?.name ? (
                      <span>
                        Faculty Lead: <strong>{c.facultyLead.name}</strong> ({c.facultyLead.department})
                      </span>
                    ) : (
                      <span className="text-amber-700 italic">Faculty lead pending designation</span>
                    )}
                  </div>

                  <Link to="/university/projects">
                    <Button variant="outline" size="sm" icon={Plus}>
                      Initiate Project for this Challenge
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Mentors Page (/university/mentors)
 */
export const UniversityMentorsPage = () => {
  const [faculty, setFaculty] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [facRes, projRes] = await Promise.all([
        projectService.getFaculty(),
        projectService.getProjects()
      ]);
      setFaculty(facRes.data?.faculty || []);
      setProjects(projRes.data?.projects || []);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load mentorship directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6 font-serif">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gov-navy">
            Academic & Project Mentors ({faculty.length})
          </h1>
          <p className="text-xs text-gov-text-secondary mt-0.5">
            Faculty guides and technical mentors supervising active student research cohorts.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="subtle" size="sm" onClick={fetchData} icon={RefreshCw}>
            Refresh
          </Button>
          <Link to="/university/faculty">
            <Button variant="primary" size="sm" icon={GraduationCap} className="bg-gov-maroon text-white">
              Faculty Directory
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <LoadingState message="Loading mentorship directory..." />
      ) : errorMsg ? (
        <Card accent="none" className="py-8 text-center text-xs text-rose-700 space-y-2">
          <p className="font-semibold">{errorMsg}</p>
          <Button variant="outline" size="sm" onClick={fetchData} icon={RefreshCw}>
            Retry
          </Button>
        </Card>
      ) : faculty.length === 0 ? (
        <Card accent="none" className="py-12 text-center text-xs text-gov-text-muted space-y-2">
          <p className="font-bold text-gov-navy text-sm">No Mentors Currently Registered</p>
          <p className="max-w-md mx-auto text-[11px]">
            No faculty members are currently on the mentorship roster for this university.
          </p>
          <Link to="/university/faculty" className="inline-block mt-2">
            <Button variant="primary" size="sm" icon={Plus}>
              Add Faculty Mentor
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {faculty.map((m) => {
            const assignedCount = m.assignedProjects?.length || 0;
            return (
              <Card key={m._id} accent="navy" className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2 border-b border-gov-border pb-2">
                  <div>
                    <h3 className="font-bold text-gov-navy text-sm">{m.name || 'Not provided'}</h3>
                    <p className="text-[11px] text-gov-maroon font-semibold">{m.department || 'Not provided'}</p>
                  </div>
                  <Badge variant={assignedCount > 0 ? 'success' : 'neutral'}>
                    {assignedCount > 0 ? `${assignedCount} Active Project${assignedCount > 1 ? 's' : ''}` : 'Available'}
                  </Badge>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-[11px] text-gov-text-secondary">
                    <span>Specialization:</span>
                    <span className="font-semibold text-gov-navy">{m.specialization || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gov-text-secondary">
                    <span>Experience:</span>
                    <span className="font-semibold text-gov-navy">{m.experience || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gov-text-secondary">
                    <span>Email:</span>
                    <span className="font-semibold text-gov-navy">{m.email || 'Not provided'}</span>
                  </div>
                </div>

                {m.assignedProjects && m.assignedProjects.length > 0 && (
                  <div className="pt-2 border-t border-gov-border text-[11px] space-y-1">
                    <span className="font-bold text-gov-navy text-[10px] uppercase tracking-wider block">Supervised Projects:</span>
                    <ul className="space-y-1">
                      {m.assignedProjects.map((p) => {
                        const pTitle = typeof p === 'object' && p.title ? p.title : (typeof p === 'string' ? p : 'Not provided');
                        const pKey = typeof p === 'object' && p._id ? p._id : p;
                        return (
                          <li key={pKey} className="text-gov-text-secondary flex items-center space-x-1.5 truncate" title={pTitle}>
                            <span className="w-1.5 h-1.5 rounded-full bg-gov-maroon flex-shrink-0" />
                            <span className="truncate">{pTitle}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

/**
 * Research Page (/university/research)
 */
export const UniversityResearchPage = () => {
  return (
    <div className="space-y-6 font-serif">
      <div>
        <h1 className="text-2xl font-bold text-gov-navy">Published Papers & Patent Applications</h1>
        <p className="text-xs text-gov-text-secondary mt-0.5">
          Academic IP, patent filings, and peer-reviewed journals resulting from Delhi problem solving.
        </p>
      </div>
      <Card accent="none" className="py-12 text-center text-xs text-gov-text-muted space-y-2">
        <BookOpen className="w-8 h-8 mx-auto text-gov-navy/40" />
        <p className="font-bold text-gov-navy text-sm">No Published Papers or Patents Recorded</p>
        <p className="max-w-md mx-auto text-[11px] text-gov-text-secondary">
          Academic IP disclosures, peer-reviewed publications, and patent filings originating from active or completed municipal innovation projects will appear here once officially submitted.
        </p>
      </Card>
    </div>
  );
};

/**
 * Notifications Page (/university/notifications)
 */
export const UniversityNotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState('unread'); // 'unread' | 'all'
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchNotifs = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await notificationService.getMyNotifications(activeTab);
      setNotifications(res.data?.notifications || []);
      setUnreadCount(res.data?.unreadCount || 0);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load institutional notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, [activeTab]);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.warn('Failed to mark notification as read:', err.message);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, read: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.warn('Failed to mark all as read:', err.message);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'unread') return !n.isRead && !n.read;
    return true;
  });

  return (
    <div className="space-y-6 font-serif">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gov-navy">Institutional Notifications & Alerts</h1>
          <p className="text-xs text-gov-text-secondary mt-0.5">
            Official communications from GNCTD, student team submissions, and project milestone updates.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="subtle" size="sm" onClick={fetchNotifs} icon={RefreshCw}>
            Refresh
          </Button>
          {unreadCount > 0 && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleMarkAllAsRead}
              icon={CheckCheck}
              className="bg-gov-maroon text-white"
            >
              Mark All as Read ({unreadCount})
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-gov-border text-xs font-semibold bg-white rounded-t-sm">
        <button
          onClick={() => setActiveTab('unread')}
          className={`px-4 py-2.5 transition-colors border-b-2 flex items-center space-x-1.5 ${
            activeTab === 'unread'
              ? 'border-gov-maroon text-gov-maroon font-bold'
              : 'border-transparent text-gray-500 hover:text-gov-navy'
          }`}
        >
          <span>Unread Notices</span>
          {unreadCount > 0 && (
            <Badge variant="maroon" className="text-[10px] px-1.5 py-0">
              {unreadCount}
            </Badge>
          )}
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2.5 transition-colors border-b-2 ${
            activeTab === 'all'
              ? 'border-gov-maroon text-gov-maroon font-bold'
              : 'border-transparent text-gray-500 hover:text-gov-navy'
          }`}
        >
          All Notifications
        </button>
      </div>

      {/* Content Area */}
      {loading ? (
        <LoadingState message="Loading institutional notifications..." />
      ) : errorMsg ? (
        <Card accent="none" className="py-8 text-center text-xs text-rose-700 space-y-2">
          <p className="font-semibold">{errorMsg}</p>
          <Button variant="outline" size="sm" onClick={fetchNotifs} icon={RefreshCw}>
            Retry
          </Button>
        </Card>
      ) : filteredNotifications.length === 0 ? (
        <Card accent="none" className="py-12 text-center text-xs text-gov-text-muted space-y-2">
          <Bell className="w-8 h-8 mx-auto text-gray-300 stroke-1" />
          <p className="font-bold text-gov-navy text-sm">
            No {activeTab === 'unread' ? 'Unread ' : ''}Notifications
          </p>
          <p className="max-w-md mx-auto text-[11px] text-gov-text-secondary">
            Official GNCTD directives, challenge assignments, and student team project alerts will appear here.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((n) => {
            const isUnread = !n.isRead && !n.read;
            return (
              <Card
                key={n._id}
                accent="none"
                className={`p-4 transition-colors ${
                  isUnread
                    ? 'bg-amber-50/40 border-l-4 border-l-gov-maroon'
                    : 'bg-white hover:bg-gov-sand-50/50'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center space-x-2 flex-wrap">
                      <span className="font-bold text-gov-navy text-sm">
                        {n.title || 'Not provided'}
                      </span>
                      {isUnread && (
                        <Badge variant="maroon" className="text-[10px]">
                          Unread
                        </Badge>
                      )}
                    </div>
                    <p className="text-gov-text-secondary leading-relaxed text-xs">
                      {n.message || 'Not provided'}
                    </p>
                    <div className="flex items-center space-x-3 text-[11px] text-gov-text-muted pt-1">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span>
                          {n.createdAt
                            ? new Date(n.createdAt).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : 'Not provided'}
                        </span>
                      </span>
                      {n.senderName && (
                        <span>&bull; Sender: <strong>{n.senderName}</strong></span>
                      )}
                      {n.relatedEntity && (
                        <span>&bull; Entity: <em>{n.relatedEntity}</em></span>
                      )}
                    </div>
                  </div>

                  {isUnread && (
                    <Button
                      variant="subtle"
                      size="sm"
                      onClick={() => handleMarkAsRead(n._id)}
                      icon={Check}
                      className="text-xs self-start"
                    >
                      Mark as read
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
