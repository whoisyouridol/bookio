import { useState } from 'react';
import { Link } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Edit2, Trash2, ShieldCheck, ShieldOff, UserCircle, Plus, X } from 'lucide-react';
import { getAdminUsers, setUserActive, deleteAdminUser, createClientAccount } from '@/api/auth';
import { createMaster } from '@/api/masters';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/error';
import type { AdminUserDto } from '@/types';

const ROLE_LABELS: Record<string, string> = {
  SuperAdmin: 'Super Admin',
  SalonAdmin: 'Salon Admin',
  Master: 'Master',
  Client: 'Client',
};

const ROLE_FILTER_OPTIONS = ['All', 'SuperAdmin', 'SalonAdmin', 'Master', 'Client'];

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  // ── Add account modal ──────────────────────────────────────────────────────
  const [showModal, setShowModal] = useState(false);
  const [accountType, setAccountType] = useState<'client' | 'master'>('client');

  // Client form
  const [cEmail, setCEmail] = useState('');
  const [cFirst, setCFirst] = useState('');
  const [cLast, setCLast] = useState('');
  const [cPhone, setCPhone] = useState('');

  // Master form
  const [mEmail, setMEmail] = useState('');
  const [mFirst, setMFirst] = useState('');
  const [mLast, setMLast] = useState('');
  const [mPhone, setMPhone] = useState('');
  const [mAutoApprove, setMAutoApprove] = useState(true);

  const resetModal = () => {
    setCEmail(''); setCFirst(''); setCLast(''); setCPhone('');
    setMEmail(''); setMFirst(''); setMLast(''); setMPhone(''); setMAutoApprove(true);
    setAccountType('client');
  };

  // ── Queries & mutations ────────────────────────────────────────────────────
  const apiRole = roleFilter === 'All' ? undefined : roleFilter;

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users', apiRole],
    queryFn: () => getAdminUsers(apiRole),
    refetchOnMount: 'always',
  });

  const activateMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => setUserActive(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Status updated');
    },
    onError: () => toast.error('Failed to update status'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Account deleted');
    },
    onError: () => toast.error('Failed to delete account'),
  });

  const createClientMutation = useMutation({
    mutationFn: () => createClientAccount({ email: cEmail, firstName: cFirst || undefined, lastName: cLast || undefined, phone: cPhone || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Client account created — temporary password sent to console');
      setShowModal(false);
      resetModal();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, 'Failed to create account')),
  });

  const createMasterMutation = useMutation({
    mutationFn: () => createMaster({ email: mEmail, firstName: mFirst, lastName: mLast, phone: mPhone, autoApproveBookings: mAutoApprove }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['masters'] });
      toast.success('Master account created — temporary password sent to console');
      setShowModal(false);
      resetModal();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, 'Failed to create master')),
  });

  const handleDelete = (u: AdminUserDto) => {
    const suffix = u.masterId ? ' Their master profile will also be deactivated.' : '';
    if (confirm(`Delete account "${u.email}"? This cannot be undone.${suffix}`)) {
      deleteMutation.mutate(u.id);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (accountType === 'client') createClientMutation.mutate();
    else createMasterMutation.mutate();
  };

  const isPending = createClientMutation.isPending || createMasterMutation.isPending;

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return !q || u.email.toLowerCase().includes(q) || `${u.firstName ?? ''} ${u.lastName ?? ''}`.toLowerCase().includes(q);
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Accounts</h1>
          <p className="text-sm text-gray-500 mt-0.5">{users.length} total</p>
        </div>
        <Button onClick={() => setShowModal(true)} size="sm">
          <Plus className="w-4 h-4 mr-1.5" /> Add new account
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {ROLE_FILTER_OPTIONS.map(r => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                roleFilter === r ? 'bg-purple-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {r === 'All' ? 'All' : ROLE_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <Loader />
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <UserCircle className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No accounts found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-500">Account</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Role</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Provider</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Joined</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">
                      {u.firstName || u.lastName
                        ? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim()
                        : <span className="text-gray-400 italic">No name</span>}
                    </p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="default">{ROLE_LABELS[u.role] ?? u.role}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={u.isActive ? 'success' : 'warning'}>
                      {u.isActive ? 'Active' : 'Pending'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{u.externalProvider ?? 'Email'}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => activateMutation.mutate({ id: u.id, isActive: !u.isActive })}
                        disabled={activateMutation.isPending}
                        title={u.isActive ? 'Deactivate' : 'Activate'}
                        className={`p-1.5 rounded-lg transition-colors ${u.isActive ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                      >
                        {u.isActive ? <ShieldCheck className="w-4 h-4" /> : <ShieldOff className="w-4 h-4" />}
                      </button>
                      <Link to={`/admin/users/${u.id}`}>
                        <Button variant="ghost" size="sm"><Edit2 className="w-4 h-4" /></Button>
                      </Link>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(u)} disabled={deleteMutation.isPending}>
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Add Account Modal ─────────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setShowModal(false); resetModal(); }} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Add new account</h2>
              <button onClick={() => { setShowModal(false); resetModal(); }} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Role picker */}
            <div className="grid grid-cols-2 gap-3">
              {(['client', 'master'] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setAccountType(type)}
                  className={`p-3 rounded-xl border-2 text-left transition-colors ${
                    accountType === type ? 'border-purple-600 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className={`text-sm font-semibold ${accountType === type ? 'text-purple-700' : 'text-gray-700'}`}>
                    {type === 'client' ? 'Client' : 'Master'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {type === 'client'
                      ? 'Regular customer who can book appointments'
                      : 'Specialist who provides services and accepts bookings'}
                  </p>
                </button>
              ))}
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              {accountType === 'client' ? (
                <>
                  <ModalField label="Email *" type="email" value={cEmail} onChange={setCEmail} required />
                  <div className="grid grid-cols-2 gap-3">
                    <ModalField label="First Name" value={cFirst} onChange={setCFirst} />
                    <ModalField label="Last Name" value={cLast} onChange={setCLast} />
                  </div>
                  <ModalField label="Phone" value={cPhone} onChange={setCPhone} />
                </>
              ) : (
                <>
                  <ModalField label="Email *" type="email" value={mEmail} onChange={setMEmail} required />
                  <div className="grid grid-cols-2 gap-3">
                    <ModalField label="First Name *" value={mFirst} onChange={setMFirst} required />
                    <ModalField label="Last Name *" value={mLast} onChange={setMLast} required />
                  </div>
                  <ModalField label="Phone *" value={mPhone} onChange={setMPhone} required />
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mAutoApprove}
                      onChange={e => setMAutoApprove(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-purple-600"
                    />
                    <span className="text-sm text-gray-700">Auto-approve bookings</span>
                  </label>
                </>
              )}

              <p className="text-xs text-gray-400">
                A temporary password will be auto-generated and logged to the console.
              </p>

              <div className="flex gap-3 pt-1">
                <Button type="button" variant="secondary" className="flex-1" onClick={() => { setShowModal(false); resetModal(); }}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" loading={isPending}>
                  Create {accountType === 'client' ? 'Client' : 'Master'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ModalField({ label, value, onChange, type = 'text', required = false }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
      />
    </div>
  );
}
