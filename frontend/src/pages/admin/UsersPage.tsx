import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Edit2, Trash2, ShieldCheck, ShieldOff, UserCircle, Plus, X, CheckCircle } from 'lucide-react';
import { getAdminUsers, setUserActive, deleteAdminUser, createClientAccount } from '@/api/auth';
import { createMaster } from '@/api/masters';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/error';
import type { AdminUserDto } from '@/types';

const ROLE_LABEL_KEYS: Record<string, string> = {
  SuperAdmin: 'admin.roles.superAdmin',
  SalonAdmin: 'admin.roles.salonAdmin',
  Master: 'admin.roles.master',
  Client: 'admin.roles.client',
};

const ROLE_FILTER_OPTIONS = ['All', 'SuperAdmin', 'SalonAdmin', 'Master', 'Client'];

export default function UsersPage() {
  const { t } = useTranslation();
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
      toast.success(t('admin.users.statusUpdated'));
    },
    onError: () => toast.error(t('admin.users.failedToUpdateStatus')),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(t('admin.users.accountDeleted'));
    },
    onError: () => toast.error(t('admin.users.failedToDeleteAccount')),
  });

  const createClientMutation = useMutation({
    mutationFn: () => createClientAccount({ email: cEmail, firstName: cFirst || undefined, lastName: cLast || undefined, phone: cPhone || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(t('admin.users.clientAccountCreated'));
      setShowModal(false);
      resetModal();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, t('admin.users.failedToCreateAccount'))),
  });

  const createMasterMutation = useMutation({
    mutationFn: () => createMaster({ email: mEmail, firstName: mFirst, lastName: mLast, phone: mPhone, autoApproveBookings: mAutoApprove }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['masters'] });
      toast.success(t('admin.users.masterAccountCreated'));
      setShowModal(false);
      resetModal();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, t('admin.users.failedToCreateMaster'))),
  });

  const handleDelete = (u: AdminUserDto) => {
    const msg = t('admin.users.deleteAccountConfirm', { email: u.email ?? u.phone ?? u.id });
    const suffix = u.masterId ? ` ${t('admin.users.deleteAccountMasterNote')}` : '';
    if (confirm(`${msg}${suffix}`)) {
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
    return !q || (u.email ?? '').toLowerCase().includes(q) || (u.phone ?? '').toLowerCase().includes(q) || `${u.firstName ?? ''} ${u.lastName ?? ''}`.toLowerCase().includes(q);
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">{t('admin.users.title')}</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">{users.length} {t('admin.users.total')}</p>
        </div>
        <Button onClick={() => setShowModal(true)} size="sm">
          <Plus className="w-4 h-4 mr-1.5" /> {t('admin.users.addNewAccount')}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-tertiary)] pointer-events-none" />
          <input
            type="text"
            placeholder={t('admin.users.searchPlaceholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {ROLE_FILTER_OPTIONS.map(r => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                roleFilter === r ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border)]'
              }`}
            >
              {r === 'All' ? t('admin.users.all') : t(ROLE_LABEL_KEYS[r] as any)}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <Loader />
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-[var(--color-text-tertiary)]">
          <UserCircle className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">{t('admin.users.noAccountsFound')}</p>
        </div>
      ) : (
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-divider)] bg-[var(--color-bg)]">
                <th className="text-left px-4 py-3 font-medium text-[var(--color-text-secondary)]">{t('admin.users.accountColumn')}</th>
                <th className="text-left px-4 py-3 font-medium text-[var(--color-text-secondary)]">{t('admin.users.role')}</th>
                <th className="text-left px-4 py-3 font-medium text-[var(--color-text-secondary)]">{t('admin.users.status')}</th>
                <th className="text-left px-4 py-3 font-medium text-[var(--color-text-secondary)]">{t('admin.users.provider')}</th>
                <th className="text-left px-4 py-3 font-medium text-[var(--color-text-secondary)]">{t('admin.users.joined')}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-divider)]">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-[var(--color-bg)] transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-[var(--color-text)]">
                      {u.firstName || u.lastName
                        ? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim()
                        : <span className="text-[var(--color-text-tertiary)] italic">{t('admin.users.noName')}</span>}
                    </p>
                    <p className="text-xs text-[var(--color-text-tertiary)]">{u.email ?? u.phone ?? '\u2014'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="default">{ROLE_LABEL_KEYS[u.role] ? t(ROLE_LABEL_KEYS[u.role] as any) : u.role}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={u.isActive ? 'success' : 'warning'}>
                      {u.isActive ? t('admin.users.active') : t('admin.users.pending')}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-secondary)] text-xs">{u.externalProvider ?? 'Email'}</td>
                  <td className="px-4 py-3 text-[var(--color-text-tertiary)] text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      {!u.isActive && u.role === 'SalonAdmin' ? (
                        <button
                          onClick={() => {
                            if (confirm(`${t('admin.users.approve')} ${u.email ?? u.phone ?? u.id}?`))
                              activateMutation.mutate({ id: u.id, isActive: true });
                          }}
                          disabled={activateMutation.isPending}
                          title={t('admin.users.approveActivatesSalon')}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[var(--color-success-subtle)] text-[var(--color-success-text)] hover:bg-[var(--color-success-subtle)] transition-colors"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> {t('admin.users.approve')}
                        </button>
                      ) : (
                        <button
                          onClick={() => activateMutation.mutate({ id: u.id, isActive: !u.isActive })}
                          disabled={activateMutation.isPending}
                          title={u.isActive ? t('admin.userDetail.deactivate') : t('admin.userDetail.activate')}
                          className={`p-1.5 rounded-lg transition-colors ${u.isActive ? 'text-[var(--color-success)] hover:bg-[var(--color-success-subtle)]' : 'text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-subtle)]'}`}
                        >
                          {u.isActive ? <ShieldCheck className="w-4 h-4" /> : <ShieldOff className="w-4 h-4" />}
                        </button>
                      )}
                      <Link to={`/admin/users/${u.id}`}>
                        <Button variant="ghost" size="sm"><Edit2 className="w-4 h-4" /></Button>
                      </Link>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(u)} disabled={deleteMutation.isPending}>
                        <Trash2 className="w-4 h-4 text-[var(--color-error)]" />
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
          <div className="relative bg-[var(--color-surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow-xl)] w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[var(--color-text)]">{t('admin.users.addNewAccount')}</h2>
              <button onClick={() => { setShowModal(false); resetModal(); }} className="p-1 hover:bg-[var(--color-bg-subtle)] rounded-lg">
                <X className="w-5 h-5 text-[var(--color-text-secondary)]" />
              </button>
            </div>

            {/* Role picker */}
            <div className="grid grid-cols-2 gap-3">
              {(['client', 'master'] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setAccountType(type)}
                  className={`p-3 rounded-[var(--radius-lg)] border-2 text-left transition-colors ${
                    accountType === type ? 'border-[var(--color-primary)] bg-[var(--color-primary-subtle)]' : 'border-[var(--color-border)] hover:border-[var(--color-border)]'
                  }`}
                >
                  <p className={`text-sm font-semibold ${accountType === type ? 'text-[var(--color-primary)]' : 'text-[var(--color-text)]'}`}>
                    {type === 'client' ? t('admin.roles.client') : t('admin.roles.master')}
                  </p>
                  <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                    {type === 'client'
                      ? t('admin.users.clientDescription')
                      : t('admin.users.masterDescription')}
                  </p>
                </button>
              ))}
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              {accountType === 'client' ? (
                <>
                  <ModalField label={t('admin.users.email')} type="email" value={cEmail} onChange={setCEmail} required />
                  <div className="grid grid-cols-2 gap-3">
                    <ModalField label={t('admin.users.firstName')} value={cFirst} onChange={setCFirst} />
                    <ModalField label={t('admin.users.lastName')} value={cLast} onChange={setCLast} />
                  </div>
                  <ModalField label={t('admin.users.phone')} value={cPhone} onChange={setCPhone} />
                </>
              ) : (
                <>
                  <ModalField label={t('admin.users.email')} type="email" value={mEmail} onChange={setMEmail} required />
                  <div className="grid grid-cols-2 gap-3">
                    <ModalField label={t('admin.users.firstNameRequired')} value={mFirst} onChange={setMFirst} required />
                    <ModalField label={t('admin.users.lastNameRequired')} value={mLast} onChange={setMLast} required />
                  </div>
                  <ModalField label={t('admin.users.phoneRequired')} value={mPhone} onChange={setMPhone} required />
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mAutoApprove}
                      onChange={e => setMAutoApprove(e.target.checked)}
                      className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary)]"
                    />
                    <span className="text-sm text-[var(--color-text)]">{t('admin.users.autoApprove')}</span>
                  </label>
                </>
              )}

              <p className="text-xs text-[var(--color-text-tertiary)]">
                {t('admin.users.tempPasswordNote')}
              </p>

              <div className="flex gap-3 pt-1">
                <Button type="button" variant="secondary" className="flex-1" onClick={() => { setShowModal(false); resetModal(); }}>
                  {t('admin.users.cancel')}
                </Button>
                <Button type="submit" className="flex-1" loading={isPending}>
                  {accountType === 'client' ? t('admin.users.createClient') : t('admin.users.createMaster')}
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
      <label className="block text-xs font-medium text-[var(--color-text)] mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
      />
    </div>
  );
}
