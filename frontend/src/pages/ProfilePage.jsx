import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { problemService } from '../services/problemService';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { User, Mail, Phone, Building, MapPin, CheckCircle2, AlertCircle, ShieldCheck, Camera } from 'lucide-react';

const ProfilePage = () => {
  const { user } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [organization, setOrganization] = useState(user?.organization || '');
  const [district, setDistrict] = useState(user?.district || 'Central Delhi');
  const [profileImage, setProfileImage] = useState(user?.profileImage || '');

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const delhiDistricts = [
    'Central Delhi',
    'East Delhi',
    'New Delhi',
    'North Delhi',
    'North East Delhi',
    'North West Delhi',
    'Shahdara',
    'South Delhi',
    'South East Delhi',
    'South West Delhi',
    'West Delhi'
  ];

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      await problemService.updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        organization: organization.trim(),
        district,
        profileImage: profileImage.trim()
      });

      // Update cached user in storage
      const cached = JSON.parse(localStorage.getItem('delhi_portal_user') || sessionStorage.getItem('delhi_portal_user') || '{}');
      const updated = { ...cached, name, phone, organization, district, profileImage: profileImage.trim() };
      if (localStorage.getItem('delhi_portal_user')) {
        localStorage.setItem('delhi_portal_user', JSON.stringify(updated));
      } else {
        sessionStorage.setItem('delhi_portal_user', JSON.stringify(updated));
      }

      setSuccessMsg('Profile updated successfully in state registry.');
      setIsEditing(false);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Page Heading */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-gov-navy">
          Citizen Profile & Identity
        </h1>
        <p className="text-xs font-serif text-gov-text-secondary mt-1">
          Manage your verified contact details and residential jurisdiction across the NCT of Delhi.
        </p>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-serif rounded-sm flex items-center">
          <CheckCircle2 className="w-4 h-4 mr-2" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-serif rounded-sm flex items-center">
          <AlertCircle className="w-4 h-4 mr-2" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Profile View / Edit Card */}
      <Card accent="maroon">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 border-b border-gov-border pb-6 mb-6">
          <img
            src={
              user?.profileImage ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Citizen')}&background=7a1113&color=fff&font-size=0.4`
            }
            alt={user?.name}
            className="w-20 h-20 rounded-sm border-2 border-gov-maroon object-cover shadow-sm"
          />

          <div className="text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
              <h2 className="text-xl font-serif font-bold text-gov-navy">
                {name || user?.name}
              </h2>
              <Badge variant="maroon">{user?.role || 'CLIENT'}</Badge>
              <Badge variant="green">Active Account</Badge>
            </div>

            <p className="text-xs font-serif text-gov-text-secondary">
              {organization || user?.organization || 'Registered Delhi Resident'}
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs font-serif text-gov-text-muted mt-2">
              <span className="flex items-center">
                <Mail className="w-3.5 h-3.5 mr-1 text-gov-maroon" />
                {user?.email}
              </span>
              <span>&bull;</span>
              <span className="flex items-center">
                <MapPin className="w-3.5 h-3.5 mr-1 text-gov-maroon" />
                {district || user?.district}
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
              Edit Profile
            </Button>
          )}
        </div>

        {/* Profile Content / Edit Form */}
        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-serif font-bold text-gov-navy uppercase tracking-wider mb-1">
                Full Legal Name *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-sm font-serif border border-gov-border rounded-sm pl-9 pr-3 py-2 focus:ring-1 focus:ring-gov-maroon outline-none"
                />
                <User className="w-4 h-4 text-gov-text-muted absolute left-3 top-2.5" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-serif font-bold text-gov-navy uppercase tracking-wider mb-1">
                  Registered Email (Fixed)
                </label>
                <div className="relative">
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full text-sm font-serif border border-gov-border bg-gov-sand-50 rounded-sm pl-9 pr-3 py-2 text-gov-text-muted cursor-not-allowed"
                  />
                  <Mail className="w-4 h-4 text-gov-text-muted absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-serif font-bold text-gov-navy uppercase tracking-wider mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full text-sm font-serif border border-gov-border rounded-sm pl-9 pr-3 py-2 focus:ring-1 focus:ring-gov-maroon outline-none"
                  />
                  <Phone className="w-4 h-4 text-gov-text-muted absolute left-3 top-2.5" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-serif font-bold text-gov-navy uppercase tracking-wider mb-1">
                  Organization / RWA Affiliation
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="e.g. Resident Welfare Association"
                    className="w-full text-sm font-serif border border-gov-border rounded-sm pl-9 pr-3 py-2 focus:ring-1 focus:ring-gov-maroon outline-none"
                  />
                  <Building className="w-4 h-4 text-gov-text-muted absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-serif font-bold text-gov-navy uppercase tracking-wider mb-1">
                  Delhi District
                </label>
                <div className="relative">
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full text-sm font-serif border border-gov-border rounded-sm pl-9 pr-3 py-2 bg-white focus:ring-1 focus:ring-gov-maroon outline-none"
                  >
                    {delhiDistricts.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <MapPin className="w-4 h-4 text-gov-text-muted absolute left-3 top-2.5" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-serif font-bold text-gov-navy uppercase tracking-wider mb-1">
                Profile Image URL (Optional)
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={profileImage}
                  onChange={(e) => setProfileImage(e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                  className="w-full text-sm font-serif border border-gov-border rounded-sm pl-9 pr-3 py-2 focus:ring-1 focus:ring-gov-maroon outline-none"
                />
                <Camera className="w-4 h-4 text-gov-text-muted absolute left-3 top-2.5" />
              </div>
            </div>

            <div className="pt-3 border-t border-gov-border flex items-center justify-end space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={loading}
              >
                {loading ? 'Saving Profile...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs font-serif">
            <div className="p-3.5 bg-gov-sand-50 rounded-xs border border-gov-border">
              <span className="font-bold text-gov-navy block text-[11px] uppercase tracking-wider mb-1">
                Full Legal Name
              </span>
              <span className="text-sm font-medium text-gov-navy">{name || user?.name}</span>
            </div>

            <div className="p-3.5 bg-gov-sand-50 rounded-xs border border-gov-border">
              <span className="font-bold text-gov-navy block text-[11px] uppercase tracking-wider mb-1">
                Email Address
              </span>
              <span className="text-sm font-medium text-gov-navy">{user?.email}</span>
            </div>

            <div className="p-3.5 bg-gov-sand-50 rounded-xs border border-gov-border">
              <span className="font-bold text-gov-navy block text-[11px] uppercase tracking-wider mb-1">
                Phone Number
              </span>
              <span className="text-sm font-medium text-gov-navy">{phone || user?.phone || 'Not Provided'}</span>
            </div>

            <div className="p-3.5 bg-gov-sand-50 rounded-xs border border-gov-border">
              <span className="font-bold text-gov-navy block text-[11px] uppercase tracking-wider mb-1">
                Organization / RWA
              </span>
              <span className="text-sm font-medium text-gov-navy">{organization || user?.organization || 'Individual Citizen'}</span>
            </div>

            <div className="p-3.5 bg-gov-sand-50 rounded-xs border border-gov-border sm:col-span-2">
              <span className="font-bold text-gov-navy block text-[11px] uppercase tracking-wider mb-1">
                Delhi District Jurisdiction
              </span>
              <span className="text-sm font-medium text-gov-navy">{district || user?.district}</span>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ProfilePage;
