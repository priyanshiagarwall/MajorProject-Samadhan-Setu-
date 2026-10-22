import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../hooks/useAuth';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import LoadingState from '../../components/common/LoadingState';
import MetricCard from '../../components/common/MetricCard';
import {
  Users,
  Search,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  GraduationCap,
  Building2,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Calendar,
  AlertTriangle
} from 'lucide-react';

const ROLES = [
  { value: 'ALL', label: 'All Stakeholders' },
  { value: 'CITIZEN', label: 'Citizens / Clients' },
  { value: 'UNIVERSITY', label: 'Universities' },
  { value: 'FACULTY', label: 'Faculty / Mentors' },
  { value: 'STUDENT', label: 'Students' },
  { value: 'INDUSTRY', label: 'Industry Partners' },
  { value: 'ADMIN', label: 'Administrators' }
];

const ROLE_BADGES = {
  CLIENT: { label: 'Citizen', variant: 'sand' },
  UNIVERSITY: { label: 'University', variant: 'maroon' },
  FACULTY: { label: 'Faculty', variant: 'amber' },
  STUDENT: { label: 'Student', variant: 'blue' },
  INDUSTRY: { label: 'Industry', variant: 'navy' },
  ADMIN: { label: 'Admin', variant: 'maroon' }
};

const AdminUsersPage = () => {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [togglingId, setTogglingId] = useState(null);

  const fetchUsers = async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 15,
        search: search.trim() || undefined,
        role: selectedRole !== 'ALL' ? selectedRole : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined
      };
      const res = await adminService.getUsers(params);
      setUsers(res.data?.users || []);
      setPagination(res.data?.pagination || { total: 0, page: 1, totalPages: 1 });
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1);
  }, [selectedRole, statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers(1);
  };

  const handleToggleStatus = async (user) => {
    const isSelf = (currentAdmin?._id || currentAdmin?.id) === user._id;
    if (isSelf && user.isActive) {
      alert('Security Protection: You cannot deactivate your own active administrator account.');
      return;
    }

    const actionText = user.isActive ? 'deactivate' : 'activate';
    const confirmed = window.confirm(
      `Are you sure you want to ${actionText} the account for ${user.name} (${user.email})?`
    );
    if (!confirmed) return;

    setTogglingId(user._id);
    try {
      await adminService.updateUserStatus(user._id, !user.isActive);
      fetchUsers(pagination.page);
    } catch (err) {
      alert(err.message || `Failed to ${actionText} user`);
    } finally {
      setTogglingId(null);
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
      {/* Top Banner */}
      <div className="bg-white border border-gov-border rounded-xs p-6 shadow-gov-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-gov-navy font-bold uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Identity & Access Management (IAM)</span>
          </div>
          <h1 className="text-2xl font-bold text-gov-navy">
            User & Role Management
          </h1>
          <p className="text-xs text-gov-text-secondary mt-1 max-w-3xl leading-relaxed">
            Manage authenticated stakeholders across Delhi's innovation ecosystem with strict backend role enforcement and account activation controls.
          </p>
        </div>

        <div className="flex items-center space-x-3 flex-shrink-0">
          <Button variant="subtle" size="sm" onClick={() => fetchUsers(pagination.page)} icon={RefreshCw}>
            Sync Users
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Users"
          value={pagination.total || users.length}
          subtitle="All registered stakeholders"
          icon={Users}
          accent="navy"
        />
        <MetricCard
          title="Active Accounts"
          value={users.filter((u) => u.isActive).length}
          subtitle="Cleared for portal access"
          icon={UserCheck}
          accent="emerald"
        />
        <MetricCard
          title="Universities"
          value={users.filter((u) => u.role === 'UNIVERSITY').length}
          subtitle="Registered institutions"
          icon={GraduationCap}
          accent="purple"
        />
        <MetricCard
          title="Industry Partners"
          value={users.filter((u) => u.role === 'INDUSTRY').length}
          subtitle="Corporate partners"
          icon={Building2}
          accent="cyan"
        />
      </div>

      {/* Filter and Search Bar */}
      <Card accent="none" className="p-4 space-y-4">
        {/* Role Selection Tabs */}
        <div className="flex flex-wrap gap-1.5 border-b border-gov-border pb-3">
          {ROLES.map((r) => (
            <button
              key={r.value}
              onClick={() => setSelectedRole(r.value)}
              className={`px-3 py-1.5 text-xs rounded-xs font-semibold transition-colors ${
                selectedRole === r.value
                  ? 'bg-gov-navy text-white shadow-xs'
                  : 'bg-gov-sand-50 text-gov-text-secondary hover:bg-gov-sand-100'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <form onSubmit={handleSearch} className="flex-1 flex items-center space-x-2 w-full">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gov-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by full name, email, organization, district..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-gov-border rounded-xs focus:outline-none focus:border-gov-navy"
              />
            </div>
            <Button variant="primary" size="sm" type="submit">
              Search
            </Button>
          </form>

          <div className="flex items-center space-x-2 w-full md:w-auto">
            <span className="text-xs text-gov-text-muted flex-shrink-0">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-gov-border rounded-xs px-3 py-2 bg-white text-gov-navy focus:outline-none focus:border-gov-navy w-full md:w-auto"
            >
              <option value="ALL">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card accent="navy" title="Registered Stakeholder Directory">
        {loading ? (
          <LoadingState message="Querying registered stakeholders from MongoDB..." />
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-xs text-gov-text-muted">
            No user accounts found matching the criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-gov-border font-serif">
              <thead>
                <tr className="bg-gov-sand-100 text-gov-navy font-bold uppercase tracking-wider text-[11px]">
                  <th className="px-4 py-3">Stakeholder</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Organization / District</th>
                  <th className="px-4 py-3">Registered Date</th>
                  <th className="px-4 py-3">Account Status</th>
                  <th className="px-4 py-3 text-right">Administrative Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gov-border bg-white">
                {users.map((u) => {
                  const roleConfig = ROLE_BADGES[u.role] || { label: u.role, variant: 'sand' };
                  const isCurrentAdmin = (currentAdmin?._id || currentAdmin?.id) === u._id;

                  return (
                    <tr key={u._id} className="hover:bg-gov-sand-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-gov-navy flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-full bg-gov-navy text-white text-[10px] flex items-center justify-center font-mono font-bold flex-shrink-0">
                            {u.name?.charAt(0) || 'U'}
                          </div>
                          <span>{u.name}</span>
                          {isCurrentAdmin && (
                            <span className="text-[9px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded-xs font-bold">
                              You
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-gov-text-secondary">
                        <div className="flex items-center space-x-1.5">
                          <Mail className="w-3 h-3 text-gov-text-muted" />
                          <span>{u.email}</span>
                        </div>
                        {u.phone && (
                          <div className="flex items-center space-x-1.5 text-[11px] text-gov-text-muted mt-0.5">
                            <Phone className="w-3 h-3" />
                            <span>{u.phone}</span>
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge variant={roleConfig.variant}>
                          {roleConfig.label}
                        </Badge>
                      </td>

                      <td className="px-4 py-3 text-gov-text-secondary">
                        <div className="font-medium text-gov-navy truncate max-w-[180px]">
                          {u.organization || 'Individual Citizen'}
                        </div>
                        {u.district && (
                          <div className="text-[10px] text-gov-text-muted truncate">
                            {u.district}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-gov-text-muted">
                        {formatDate(u.createdAt)}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-xs text-[10px] font-bold ${
                            u.isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {u.isActive ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" />
                              <span>Inactive</span>
                            </>
                          )}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <Button
                          variant={u.isActive ? 'subtle' : 'primary'}
                          size="sm"
                          disabled={togglingId === u._id || isCurrentAdmin}
                          onClick={() => handleToggleStatus(u)}
                          className={
                            u.isActive
                              ? 'text-rose-700 hover:bg-rose-50'
                              : 'bg-emerald-700 hover:bg-emerald-800'
                          }
                          icon={u.isActive ? UserX : UserCheck}
                        >
                          {togglingId === u._id
                            ? 'Processing...'
                            : u.isActive
                            ? 'Deactivate'
                            : 'Activate'}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-gov-text-secondary pt-2">
          <span>
            Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} users)
          </span>
          <div className="flex items-center space-x-2">
            <Button
              variant="subtle"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => fetchUsers(pagination.page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="subtle"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchUsers(pagination.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
