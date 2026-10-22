import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingState from '../../components/common/LoadingState';
import { Briefcase, Bell, CheckCircle2, RefreshCw } from 'lucide-react';

/**
 * Projects Page (/admin/projects)
 */
export const AdminProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await adminService.getChallenges({
        status: 'IN_PROGRESS',
        limit: 10
      });
      setProjects(res.data?.challenges || []);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <div className="space-y-6 font-serif">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gov-navy">Active Societal Innovation Projects</h1>
          <p className="text-xs text-gov-text-secondary mt-1">
            Multidisciplinary university research cohorts actively developing and deploying field solutions in Delhi.
          </p>
        </div>

        <Button variant="subtle" size="sm" onClick={fetchProjects} icon={RefreshCw}>
          Refresh Projects
        </Button>
      </div>

      {loading ? (
        <LoadingState message="Loading active innovation projects..." />
      ) : (
        <div className="space-y-4">
          {projects.map((p) => (
            <Card key={p._id} accent="maroon" className="p-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-gov-maroon">
                      {p.code}
                    </span>
                    <StatusBadge status={p.status} />
                    <Badge variant="navy">{p.category}</Badge>
                    <span className="text-xs text-gov-text-muted">&bull; {p.district}</span>
                  </div>

                  <h3 className="text-base font-bold text-gov-navy leading-snug">{p.title}</h3>
                  <p className="text-xs text-gov-text-secondary leading-relaxed">{p.description}</p>

                  <div className="pt-2 text-xs text-gov-text-muted flex items-center space-x-4">
                    <span>
                      University: <strong>{p.assignedUniversity?.name || 'Assigned Higher Ed Lab'}</strong>
                    </span>
                    {p.industryPartner && (
                      <span>
                        Corporate Partner: <strong>{p.industryPartner.name}</strong>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <Button
                    variant="subtle"
                    size="sm"
                    onClick={() => alert(`Reviewing technical milestone deliverables for ${p.code}`)}
                  >
                    Milestone Audit
                  </Button>
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
 * Notifications Page (/admin/notifications)
 */
export const AdminNotificationsPage = () => {
  const alerts = [
    {
      id: 1,
      title: 'High-Priority Sanitation Report Lodged',
      text: 'DEL-201 at Ghazipur Wholesale Mandi flagged as critical priority. Administrative inspection recommended.',
      time: '1 hour ago',
      level: 'critical'
    },
    {
      id: 2,
      title: 'Water Quality Telemetry Node Verified',
      text: 'Najafgarh basin spectrophotometer benchmark verified by DPCC liaison officer.',
      time: '5 hours ago',
      level: 'normal'
    },
    {
      id: 3,
      title: 'Annual Innovation Grant Sanction Notice',
      text: 'Finance Department GNCTD cleared tranche 2 allocations for DTU Environmental Lab.',
      time: 'Yesterday',
      level: 'normal'
    }
  ];

  return (
    <div className="space-y-6 font-serif">
      <div>
        <h1 className="text-2xl font-bold text-gov-navy">State Administrative Notifications</h1>
        <p className="text-xs text-gov-text-secondary mt-1">
          Real-time system alerts, SLA warnings, and inter-agency municipal correspondences.
        </p>
      </div>

      <Card accent="none">
        <div className="divide-y divide-gov-border">
          {alerts.map((a) => (
            <div key={a.id} className="py-4 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gov-navy">{a.title}</span>
                <span className="text-gov-text-muted text-[11px]">{a.time}</span>
              </div>
              <p className="text-xs text-gov-text-secondary leading-relaxed">{a.text}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
