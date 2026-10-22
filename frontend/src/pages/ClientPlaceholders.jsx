import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import {
  PlusCircle,
  Bookmark,
  Bell,
  HelpCircle,
  FileText,
  AlertCircle,
  CheckCircle2,
  PhoneCall,
  Mail,
  Building,
  Info
} from 'lucide-react';

import SubmitChallengePage from './SubmitChallengePage';

/**
 * Submit a Challenge Page
 */
export const SubmitLaunchpadPage = () => {
  return <SubmitChallengePage />;
};

/**
 * Saved Challenges Page
 */
export const SavedChallengesPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-gov-navy">Saved Challenges</h1>
        <p className="text-xs font-serif text-gov-text-secondary mt-1">
          Challenges you have bookmarked to monitor university prototype breakthroughs.
        </p>
      </div>

      <Card accent="none">
        <EmptyState
          icon={Bookmark}
          title="No Saved Challenges Yet"
          description="You haven't bookmarked any challenges yet. Browse active submissions to save items of interest."
          actionLabel="Explore My Challenges"
          onAction={() => (window.location.href = '/client/challenges')}
        />
      </Card>
    </div>
  );
};

/**
 * Notifications Center Page
 */
export const NotificationsPage = () => {
  const [filter, setFilter] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      const res = await notificationService.getMyNotifications();
      setNotifications(res.data?.notifications || []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkAll = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(notifications.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const filtered =
    filter === 'unread' ? notifications.filter((n) => !n.read) : notifications;

  return (
    <div className="space-y-6 font-serif">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gov-navy">Notifications & State Alerts</h1>
          <p className="text-xs text-gov-text-secondary mt-1">
            Real-time government notifications regarding your reported civic problems.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-xs border ${
              filter === 'all'
                ? 'bg-gov-maroon text-white border-gov-maroon'
                : 'bg-white text-gov-navy border-gov-border'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-3 py-1 rounded-xs border ${
              filter === 'unread'
                ? 'bg-gov-maroon text-white border-gov-maroon'
                : 'bg-white text-gov-navy border-gov-border'
            }`}
          >
            Unread ({notifications.filter((n) => !n.read).length})
          </button>
          {notifications.some((n) => !n.read) && (
            <button
              onClick={handleMarkAll}
              className="text-xs text-gov-maroon hover:underline font-semibold ml-2"
            >
              Mark all read
            </button>
          )}
        </div>
      </div>

      <Card accent="none">
        {loading ? (
          <div className="py-8 text-center text-xs text-gov-text-muted">
            Loading state notifications...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center text-xs text-gov-text-muted">
            No notifications matching this filter.
          </div>
        ) : (
          <div className="divide-y divide-gov-border">
            {filtered.map((n) => (
              <div
                key={n._id}
                className={`py-4 ${!n.read ? 'bg-gov-sand-50/70 p-3 rounded-xs my-1' : ''}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-gov-navy text-xs flex items-center space-x-1.5">
                    {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-gov-maroon"></span>}
                    <span>{n.title}</span>
                  </span>
                  <span className="text-[11px] text-gov-text-muted">
                    {new Date(n.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <p className="text-xs text-gov-text-secondary leading-relaxed">
                  {n.message}
                </p>
                {n.challenge && (
                  <div className="mt-2">
                    <Link
                      to={`/client/challenges/${n.challenge._id || n.challenge}`}
                      className="text-[11px] text-gov-maroon hover:underline font-semibold"
                    >
                      View Challenge Progress &rarr;
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

/**
 * Help & Support Page
 */
export const HelpSupportPage = () => {
  const faqs = [
    {
      q: 'How long does government review take for reported challenges?',
      a: 'Initial screening by the Delhi District Innovation Cell typically takes 3-5 working days. Once verified, statements are made available in the State Problem Bank for university research cohort adoption.'
    },
    {
      q: 'What happens after my challenge is assigned to a university?',
      a: 'The assigned engineering or urban planning faculty lead deploys student teams to survey the ground site, formulate a technical proposal, and engineer a deployable prototype.'
    },
    {
      q: 'How can I submit additional evidence after lodging a challenge?',
      a: 'Navigate to Challenge Details page where attachments can be viewed. You can contact your district nodal officer with your DEL reference code to attach supplementary logs.'
    }
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 font-serif">
      <div>
        <h1 className="text-2xl font-bold text-gov-navy">Helpdesk & Citizen Support</h1>
        <p className="text-xs text-gov-text-secondary mt-1">
          Guidance and official contact channels for the Samadhan Setu Portal.
        </p>
      </div>

      {/* Contacts Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card accent="maroon" className="p-4">
          <div className="flex items-start space-x-3">
            <PhoneCall className="w-5 h-5 text-gov-maroon flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-gov-navy text-xs uppercase">Civic Grievance Helpline</h4>
              <div className="text-lg font-bold text-gov-maroon mt-1">1800-11-DELHI</div>
              <p className="text-[11px] text-gov-text-muted mt-0.5">Toll-free / 24x7 State Support</p>
            </div>
          </div>
        </Card>

        <Card accent="navy" className="p-4">
          <div className="flex items-start space-x-3">
            <Mail className="w-5 h-5 text-gov-navy flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-gov-navy text-xs uppercase">Nodal Email Support</h4>
              <div className="text-sm font-bold text-gov-navy mt-1">innovation.portal@delhi.gov.in</div>
              <p className="text-[11px] text-gov-text-muted mt-0.5">Response within 24 working hours</p>
            </div>
          </div>
        </Card>
      </div>

      {/* FAQs */}
      <Card accent="none" title="Frequently Asked Questions">
        <div className="space-y-4 divide-y divide-gov-border">
          {faqs.map((faq, idx) => (
            <div key={idx} className={idx !== 0 ? 'pt-4' : ''}>
              <h4 className="text-xs font-bold text-gov-navy">{faq.q}</h4>
              <p className="text-xs text-gov-text-secondary leading-relaxed mt-1">{faq.a}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
