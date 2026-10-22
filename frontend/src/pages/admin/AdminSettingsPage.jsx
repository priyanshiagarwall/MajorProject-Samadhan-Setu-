import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { adminService } from '../../services/adminService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import {
  ShieldCheck,
  User,
  Mail,
  Phone,
  Building,
  MapPin,
  CheckCircle2,
  AlertCircle,
  KeyRound
} from 'lucide-react';

const AdminSettingsPage = () => {
  const { user } = useAuth();

  const [name, setName] = useState(user?.name || 'Dr. Vivek Saxena (IAS)');
  const [phone, setPhone] = useState(user?.phone || '+91 011-23379000');
  const [organization, setOrganization] = useState(
    user?.organization || 'Delhi State Innovation Council, GNCTD'
  );
  const [district, setDistrict] = useState(user?.district || 'Central Delhi');

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      await adminService.updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        organization: organization.trim(),
        district
      });

      // Update cached storage
      const cached = JSON.parse(
        localStorage.getItem('delhi_portal_user') || sessionStorage.getItem('delhi_portal_user') || '{}'
      );
      const updated = { ...cached, name, phone, organization, district };
      if (localStorage.getItem('delhi_portal_user')) {
        localStorage.setItem('delhi_portal_user', JSON.stringify(updated));
      } else {
        sessionStorage.setItem('delhi_portal_user', JSON.stringify(updated));
      }

      setSuccessMsg('Administrative profile updated successfully.');
      setIsEditing(false);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update administrative profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 font-serif">
      <div>
        <h1 className="text-2xl font-bold text-gov-navy">
          Administrative Identity & Settings
        </h1>
        <p className="text-xs text-gov-text-secondary mt-1">
          Administrative officer credentials and system configuration details.
        </p>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xs flex items-center">
          <CheckCircle2 className="w-4 h-4 mr-2" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xs flex items-center">
          <AlertCircle className="w-4 h-4 mr-2" />
          <span>{errorMsg}</span>
        </div>
      )}

      <Card accent="navy">
        {/* Officer Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 border-b border-gov-border pb-6 mb-6">
          <img
            src={
              user?.profileImage ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Administrator')}&background=142a45&color=fff&font-size=0.4`
            }
            alt={user?.name}
            className="w-20 h-20 rounded-xs border-2 border-gov-navy object-cover shadow-sm"
          />

          <div className="text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
              <h2 className="text-xl font-bold text-gov-navy">{name || user?.name}</h2>
              <Badge variant="navy">STATE ADMIN / IAS</Badge>
              <Badge variant="gold">Administrator</Badge>
            </div>

            <p className="text-xs text-gov-text-secondary">
              {organization || user?.organization || 'State Innovation Council, GNCTD'}
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-gov-text-muted mt-2">
              <span className="flex items-center">
                <Mail className="w-3.5 h-3.5 mr-1 text-gov-navy" />
                {user?.email}
              </span>
              <span>&bull;</span>
              <span className="flex items-center">
                <MapPin className="w-3.5 h-3.5 mr-1 text-gov-navy" />
                Delhi Secretariat &bull; {district || user?.district}
              </span>
            </div>
          </div>

          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="flex-shrink-0"
            >
              Edit Officer Profile
            </Button>
          )}
        </div>

        {/* View / Edit Form */}
        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-gov-navy uppercase tracking-wider mb-1">
                Officer Name & Designation *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs font-serif border border-gov-border rounded-xs pl-9 pr-3 py-2 focus:ring-1 focus:ring-gov-navy outline-none"
                />
                <User className="w-4 h-4 text-gov-text-muted absolute left-3 top-2.5" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-gov-navy uppercase tracking-wider mb-1">
                  Official Gov Email (Read-Only)
                </label>
                <div className="relative">
                  <input
                    type="email"
                    disabled
                    value={user?.email || 'admin@delhi.gov.in'}
                    className="w-full text-xs font-serif border border-gov-border bg-gov-sand-50 rounded-xs pl-9 pr-3 py-2 text-gov-text-muted cursor-not-allowed"
                  />
                  <Mail className="w-4 h-4 text-gov-text-muted absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gov-navy uppercase tracking-wider mb-1">
                  Secretariat Direct Phone
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-xs font-serif border border-gov-border rounded-xs pl-9 pr-3 py-2 focus:ring-1 focus:ring-gov-navy outline-none"
                  />
                  <Phone className="w-4 h-4 text-gov-text-muted absolute left-3 top-2.5" />
                </div>
              </div>
            </div>

            <div>
              <label className="block font-bold text-gov-navy uppercase tracking-wider mb-1">
                Department / Authority Cell
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  className="w-full text-xs font-serif border border-gov-border rounded-xs pl-9 pr-3 py-2 focus:ring-1 focus:ring-gov-navy outline-none"
                />
                <Building className="w-4 h-4 text-gov-text-muted absolute left-3 top-2.5" />
              </div>
            </div>

            <div className="pt-3 border-t border-gov-border flex items-center justify-end space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Save Settings'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-gov-sand-50 rounded-xs border border-gov-border">
              <span className="font-bold text-gov-navy block text-[10px] uppercase mb-1">
                Officer Name
              </span>
              <span className="font-medium text-gov-navy">{name || user?.name}</span>
            </div>

            <div className="p-3 bg-gov-sand-50 rounded-xs border border-gov-border">
              <span className="font-bold text-gov-navy block text-[10px] uppercase mb-1">
                Email Address
              </span>
              <span className="font-medium text-gov-navy">{user?.email}</span>
            </div>

            <div className="p-3 bg-gov-sand-50 rounded-xs border border-gov-border">
              <span className="font-bold text-gov-navy block text-[10px] uppercase mb-1">
                Official Department
              </span>
              <span className="font-medium text-gov-navy">{organization || user?.organization}</span>
            </div>

            <div className="p-3 bg-gov-sand-50 rounded-xs border border-gov-border">
              <span className="font-bold text-gov-navy block text-[10px] uppercase mb-1">
                Contact Phone
              </span>
              <span className="font-medium text-gov-navy">{phone || user?.phone}</span>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminSettingsPage;
