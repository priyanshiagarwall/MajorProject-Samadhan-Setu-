import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { notificationService } from '../../services/notificationService';
import { useAuth } from '../../hooks/useAuth';
import socketService from '../../services/socket';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import LoadingState from '../../components/common/LoadingState';
import {
  Bell,
  CheckCircle2,
  CheckCheck,
  RefreshCw,
  FolderKanban,
  Briefcase,
  AlertTriangle,
  Clock,
  Sparkles,
  ArrowRight,
  User
} from 'lucide-react';

const NOTIF_ICONS = {
  CHALLENGE_SUBMITTED: FolderKanban,
  CHALLENGE_VALIDATED: CheckCircle2,
  CHALLENGE_REJECTED: AlertTriangle,
  CHALLENGE_ASSIGNED: Briefcase,
  AI_ANALYSIS_COMPLETED: Sparkles,
  DEFAULT: Bell
};

const AdminNotificationsPage = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await notificationService.getMyNotifications(statusFilter);
      setNotifications(res.data?.notifications || []);
      setUnreadCount(res.data?.unreadCount || 0);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Real-time socket events
    const socket = socketService.connect(user?._id || user?.id);
    if (socket) {
      const handleNewNotif = () => fetchNotifications();
      socket.on('new_notification', handleNewNotif);
      socket.on('unread_count', (data) => setUnreadCount(data.unreadCount));

      return () => {
        socket.off('new_notification', handleNewNotif);
      };
    }
  }, [statusFilter, user]);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, read: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    const diff = (new Date() - new Date(dateString)) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="space-y-6 font-serif">
      {/* Top Banner */}
      <div className="bg-white border border-gov-border rounded-xs p-6 shadow-gov-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-gov-navy font-bold uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Real-time Operational Dispatcher</span>
          </div>
          <h1 className="text-2xl font-bold text-gov-navy">
            State Administrative Notifications
          </h1>
          <p className="text-xs text-gov-text-secondary mt-1 max-w-3xl leading-relaxed">
            Real-time inter-agency dispatches, SLA escalation alerts, AI analysis completions, and university allocation updates.
          </p>
        </div>

        <div className="flex items-center space-x-3 flex-shrink-0">
          <Button variant="subtle" size="sm" onClick={fetchNotifications} icon={RefreshCw}>
            Refresh
          </Button>

          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead} icon={CheckCheck}>
              Mark All Read ({unreadCount})
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <Card accent="none" className="p-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-xs rounded-xs font-semibold transition-colors ${
              statusFilter === 'all'
                ? 'bg-gov-navy text-white shadow-xs'
                : 'text-gov-text-secondary hover:bg-gov-sand-100'
            }`}
          >
            All Dispatches ({notifications.length})
          </button>

          <button
            onClick={() => setStatusFilter('unread')}
            className={`px-3 py-1.5 text-xs rounded-xs font-semibold transition-colors flex items-center space-x-1.5 ${
              statusFilter === 'unread'
                ? 'bg-gov-navy text-white shadow-xs'
                : 'text-gov-text-secondary hover:bg-gov-sand-100'
            }`}
          >
            <span>Unread</span>
            {unreadCount > 0 && (
              <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </Card>

      {/* Notifications Feed */}
      <Card accent="navy" title="Notification Log">
        {loading ? (
          <LoadingState message="Fetching official notices from notification registry..." />
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-xs text-gov-text-muted space-y-2">
            <Bell className="w-8 h-8 text-gov-text-muted mx-auto opacity-50" />
            <p>No administrative notices found.</p>
          </div>
        ) : (
          <div className="divide-y divide-gov-border">
            {notifications.map((notif) => {
              const isUnread = !notif.isRead && !notif.read;
              const Icon = NOTIF_ICONS[notif.type] || NOTIF_ICONS.DEFAULT;

              return (
                <div
                  key={notif._id}
                  className={`p-4 transition-colors ${
                    isUnread ? 'bg-amber-50/40' : 'bg-white hover:bg-gov-sand-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start space-x-3 flex-1">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          isUnread
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-gov-sand-100 text-gov-navy'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>

                      <div className="space-y-1 flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-xs font-bold text-gov-navy leading-snug">
                            {notif.title}
                          </h4>
                          {isUnread && (
                            <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0"></span>
                          )}
                        </div>

                        <p className="text-xs text-gov-text-secondary leading-relaxed">
                          {notif.message}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-gov-text-muted">
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatTimeAgo(notif.createdAt)}</span>
                          </span>

                          {notif.sender && (
                            <span className="flex items-center space-x-1">
                              <User className="w-3 h-3" />
                              <span>{notif.sender.name || 'System'}</span>
                            </span>
                          )}

                          {notif.relatedEntity === 'Challenge' && notif.relatedEntityId && (
                            <Link
                              to={`/admin/challenges/${notif.relatedEntityId}`}
                              className="text-gov-maroon font-bold hover:underline flex items-center space-x-0.5"
                            >
                              <span>View Challenge</span>
                              <ArrowRight className="w-3 h-3" />
                            </Link>
                          )}

                          {notif.relatedEntity === 'Project' && notif.relatedEntityId && (
                            <Link
                              to={`/admin/projects/${notif.relatedEntityId}`}
                              className="text-gov-navy font-bold hover:underline flex items-center space-x-0.5"
                            >
                              <span>View Project</span>
                              <ArrowRight className="w-3 h-3" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>

                    {isUnread && (
                      <Button
                        variant="subtle"
                        size="sm"
                        onClick={() => handleMarkAsRead(notif._id)}
                        className="text-[11px] text-gov-navy flex-shrink-0"
                      >
                        Mark Read
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminNotificationsPage;
