import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import LoadingState from '../../components/common/LoadingState';
import MetricCard from '../../components/common/MetricCard';
import {
  Building2,
  Award,
  Mail,
  Phone,
  MapPin,
  RefreshCw,
  Briefcase,
  Handshake,
  FileText,
  UserCheck,
  UserX,
  Sparkles
} from 'lucide-react';

const AdminIndustryPage = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [togglingId, setTogglingId] = useState(null);

  const fetchPartners = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getIndustryPartners();
      setPartners(res.data?.partners || []);
    } catch (err) {
      console.error('Failed to load industry partners:', err);
      setError(err.message || 'Failed to load corporate partners registry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const handleToggleStatus = async (partner) => {
    const action = partner.isActive ? 'deactivate' : 'activate';
    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${partner.name}?`
    );
    if (!confirmed) return;

    setTogglingId(partner._id);
    try {
      await adminService.updateIndustryStatus(partner._id, !partner.isActive);
      fetchPartners();
    } catch (err) {
      alert(err.message || `Failed to ${action} industry partner`);
    } finally {
      setTogglingId(null);
    }
  };

  const activeCount = partners.filter((p) => p.isActive).length;
  const totalCollaborations = partners.reduce((acc, p) => acc + (p.activePartnershipsCount || 0), 0);
  const totalProposals = partners.reduce((acc, p) => acc + (p.proposalsCount || 0), 0);

  return (
    <div className="space-y-6 font-serif">
      {/* Top Banner */}
      <div className="bg-white border border-gov-border rounded-xs p-6 shadow-gov-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-gov-navy font-bold uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Corporate Co-Sponsorship & CSR Network</span>
          </div>
          <h1 className="text-2xl font-bold text-gov-navy">
            Industry & Startup Partners ({partners.length})
          </h1>
          <p className="text-xs text-gov-text-secondary mt-1 max-w-3xl leading-relaxed">
            Private enterprises, technology startups, and CSR organizations co-sponsoring societal technology pilots and funding prototypes across Delhi.
          </p>
        </div>

        <Button variant="subtle" size="sm" onClick={fetchPartners} icon={RefreshCw}>
          Refresh Partners
        </Button>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Registered Partners"
          value={partners.length}
          subtitle={`${activeCount} active in network`}
          icon={Building2}
          accent="navy"
        />
        <MetricCard
          title="Active Collaborations"
          value={totalCollaborations}
          subtitle="Formally approved partnerships"
          icon={Handshake}
          accent="emerald"
        />
        <MetricCard
          title="Submitted Proposals"
          value={totalProposals}
          subtitle="Partnership expressions received"
          icon={FileText}
          accent="amber"
        />
      </div>

      {loading ? (
        <LoadingState message="Loading corporate and startup partners from MongoDB..." />
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xs flex items-center justify-between">
          <span>{error}</span>
          <Button variant="subtle" size="sm" onClick={fetchPartners}>
            Retry
          </Button>
        </div>
      ) : partners.length === 0 ? (
        <Card accent="none" className="p-12 text-center text-xs text-gov-text-muted">
          No corporate or industry partners currently registered in the state registry.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {partners.map((partner) => (
            <Card key={partner._id} accent="navy" className="p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 rounded-xs bg-gov-navy/10 text-gov-navy flex items-center justify-center border border-gov-navy/20 flex-shrink-0 mt-0.5">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gov-navy leading-snug">
                        {partner.name}
                      </h3>
                      <p className="text-xs text-gov-text-secondary mt-0.5">
                        {partner.organization || partner.industrySector || 'Technology & Innovation Enterprise'}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-xs text-[10px] font-bold flex-shrink-0 ${
                      partner.isActive
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {partner.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Industry Sector & Expertise */}
                <div>
                  <span className="text-[11px] font-bold text-gov-navy block mb-1">
                    Domain Expertise & Technology Focus:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {partner.expertise && partner.expertise.length > 0 ? (
                      partner.expertise.map((exp, i) => (
                        <span
                          key={i}
                          className="text-[10px] bg-gov-sand-100 text-gov-navy px-1.5 py-0.5 rounded-xs font-mono"
                        >
                          {exp}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-gov-text-muted">
                        Smart Grids, Clean Energy, IoT Sensing, Waste-to-Energy, Mobility
                      </span>
                    )}
                  </div>
                </div>

                {/* Quantitative Metrics Bar */}
                <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-gov-sand-50/70 border border-gov-border rounded-xs text-center text-xs">
                  <div>
                    <span className="text-[10px] text-gov-text-muted block">Collaborations</span>
                    <strong className="text-emerald-700">{partner.activePartnershipsCount || 0}</strong>
                  </div>
                  <div className="border-x border-gov-border">
                    <span className="text-[10px] text-gov-text-muted block">Proposals</span>
                    <strong className="text-gov-maroon">{partner.proposalsCount || 0}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-gov-text-muted block">Active Projects</span>
                    <strong className="text-gov-navy">{partner.activeProjectsCount || 0}</strong>
                  </div>
                </div>

                {/* Contact & District */}
                <div className="space-y-1 text-xs text-gov-text-muted pt-1">
                  <div className="flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-gov-maroon flex-shrink-0" />
                    <span>Location: <strong>{partner.district || 'Delhi NCR'}</strong></span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Mail className="w-3.5 h-3.5 text-gov-maroon flex-shrink-0" />
                    <span>{partner.email}</span>
                  </div>
                  {partner.phone && (
                    <div className="flex items-center space-x-1.5">
                      <Phone className="w-3.5 h-3.5 text-gov-maroon flex-shrink-0" />
                      <span>{partner.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Controls */}
              <div className="pt-3 border-t border-gov-border flex items-center justify-between">
                <span className="text-[11px] text-gov-text-muted">
                  Organization Cleared
                </span>

                <Button
                  variant={partner.isActive ? 'subtle' : 'primary'}
                  size="sm"
                  disabled={togglingId === partner._id}
                  onClick={() => handleToggleStatus(partner)}
                  className={
                    partner.isActive
                      ? 'text-rose-700 hover:bg-rose-50'
                      : 'bg-emerald-700 hover:bg-emerald-800'
                  }
                  icon={partner.isActive ? UserX : UserCheck}
                >
                  {togglingId === partner._id
                    ? 'Updating...'
                    : partner.isActive
                    ? 'Deactivate Partner'
                    : 'Activate Partner'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminIndustryPage;
