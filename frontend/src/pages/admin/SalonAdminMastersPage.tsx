import { useState, useRef, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSalonAdminMasters,
  searchAvailableMasters,
  linkMasterToSalon,
  createSalonAdminMaster,
  removeSalonAdminMaster,
} from '@/api/salonAdmin';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { Users, Star, Briefcase, Plus, X, UserMinus, Search, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/error';

type AddMode = null | 'existing' | 'new';

export default function SalonAdminMastersPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [addMode, setAddMode] = useState<AddMode>(null);

  const { data: masters, isLoading } = useQuery({
    queryKey: ['salon-admin-masters'],
    queryFn: getSalonAdminMasters,
    refetchOnMount: 'always',
  });

  const removeMut = useMutation({
    mutationFn: (masterId: string) => removeSalonAdminMaster(masterId),
    onSuccess: () => {
      invalidateAll();
      toast.success(t('admin.salonMasters.masterRemovedFromSalon'));
    },
    onError: (err) => toast.error(getErrorMessage(err, t('admin.salonMasters.failedToRemoveMaster'))),
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['salon-admin-masters'] });
    queryClient.invalidateQueries({ queryKey: ['salon-admin-dashboard'] });
  };

  if (isLoading) return <Loader />;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-text)]">{t('admin.salonMasters.title')}</h1>
        {!addMode && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setAddMode('existing')}>
              <Search className="w-4 h-4 mr-1" /> {t('admin.salonMasters.addExisting')}
            </Button>
            <Button onClick={() => setAddMode('new')}>
              <Plus className="w-4 h-4 mr-1" /> {t('admin.salonMasters.createNew')}
            </Button>
          </div>
        )}
      </div>

      {addMode === 'existing' && (
        <LinkExistingMasterPanel
          onClose={() => setAddMode(null)}
          onSuccess={() => { setAddMode(null); invalidateAll(); }}
        />
      )}

      {addMode === 'new' && (
        <AddMasterForm
          onClose={() => setAddMode(null)}
          onSuccess={() => { setAddMode(null); invalidateAll(); }}
        />
      )}

      {!masters?.length ? (
        <EmptyState icon={Users} title={t('admin.salonMasters.noMastersLinked')} />
      ) : (
        <div className="space-y-3">
          {masters.map(m => {
            const name = [m.firstName, m.lastName].filter(Boolean).join(' ') || (m.email ?? m.phone ?? '\u2014');
            const statusVariant = m.isDeleted ? 'error' as const : m.isUserActive ? 'success' as const : 'warning' as const;
            const statusLabel = m.isDeleted ? t('admin.masters.deleted') : m.isUserActive ? t('admin.masters.active') : t('admin.masters.pending');

            return (
              <div key={m.masterId} className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-[var(--color-bg-subtle)] shrink-0">
                  <ImageWithFallback src={m.photo} alt={name} className="w-full h-full object-cover" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[var(--color-text)]">{name}</p>
                  <p className="text-sm text-[var(--color-text-secondary)]">{m.email ?? m.phone ?? '\u2014'}</p>
                  {m.phone && m.email && <p className="text-xs text-[var(--color-text-tertiary)]">{m.phone}</p>}
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)]">
                      <Star className="w-3.5 h-3.5 fill-[var(--color-warning)] text-[var(--color-warning)]" />
                      {m.averageRating ? m.averageRating.toFixed(1) : '—'}
                      <span className="text-[var(--color-text-tertiary)]">({m.ratingCount})</span>
                    </span>
                    <span className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)]">
                      <Briefcase className="w-3.5 h-3.5" />
                      {m.servicesCount} {t('admin.masterForm.services').toLowerCase()}
                    </span>
                  </div>
                </div>

                <Badge variant={statusVariant}>{statusLabel}</Badge>

                <div className="flex gap-1.5 shrink-0">
                  {!m.isDeleted && (
                    <Button size="sm" variant="outline"
                      onClick={() => {
                        if (confirm(t('admin.salonMasters.removeConfirm', { name })))
                          removeMut.mutate(m.masterId);
                      }}
                      disabled={removeMut.isPending}>
                      <UserMinus className="w-3.5 h-3.5 mr-1" /> {t('admin.salonMasters.remove')}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function LinkExistingMasterPanel({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [linking, setLinking] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = (val: string) => {
    setQuery(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebouncedQuery(val), 300);
  };

  const { data: results, isLoading } = useQuery({
    queryKey: ['salon-admin-masters-search', debouncedQuery],
    queryFn: () => searchAvailableMasters(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
  });

  const handleLink = async (masterId: string) => {
    setLinking(true);
    try {
      await linkMasterToSalon(masterId);
      toast.success(t('admin.salonMasters.masterAddedToSalon'));
      onSuccess();
    } catch (err) {
      toast.error(getErrorMessage(err, t('admin.salonMasters.failedToAddMaster')));
    } finally {
      setLinking(false);
    }
  };

  return (
    <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">{t('admin.salonMasters.addExistingMaster')}</h2>
        <button onClick={onClose} className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-tertiary)]" />
        <input
          type="text"
          placeholder={t('admin.salonMasters.searchPlaceholder')}
          value={query}
          onChange={e => handleSearch(e.target.value)}
          autoFocus
          className="w-full border border-[var(--color-border)] rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)]"
        />
      </div>
      {debouncedQuery.length < 2 ? (
        <p className="text-sm text-[var(--color-text-tertiary)] text-center py-4">{t('admin.salonMasters.typeToSearch')}</p>
      ) : isLoading ? (
        <div className="py-4 flex justify-center"><Loader /></div>
      ) : !results?.length ? (
        <p className="text-sm text-[var(--color-text-tertiary)] text-center py-4">{t('admin.salonMasters.noAvailableMasters')}</p>
      ) : (
        <div className="max-h-64 overflow-y-auto border border-[var(--color-divider)] rounded-lg divide-y divide-[var(--color-divider)]">
          {results.map(m => {
            const name = [m.firstName, m.lastName].filter(Boolean).join(' ') || (m.email ?? m.phone ?? '\u2014');
            return (
              <div key={m.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-bg)]">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-[var(--color-bg-subtle)] shrink-0">
                  <ImageWithFallback src={m.photo} alt={name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-text)] truncate">{name}</p>
                  <p className="text-xs text-[var(--color-text-secondary)] truncate">{m.email ?? m.phone ?? '\u2014'}</p>
                </div>
                <Button size="sm" onClick={() => handleLink(m.id)} disabled={linking}>
                  <UserPlus className="w-3.5 h-3.5 mr-1" /> {t('admin.salonMasters.add')}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AddMasterForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createSalonAdminMaster({
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        autoApproveBookings: true,
      });
      toast.success(t('admin.salonMasters.masterCreatedSuccess'));
      onSuccess();
    } catch (err) {
      toast.error(getErrorMessage(err, t('admin.salonMasters.failedToCreateMaster')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">{t('admin.salonMasters.createNewMaster')}</h2>
        <button onClick={onClose} className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]">
          <X className="w-5 h-5" />
        </button>
      </div>
      <p className="text-sm text-[var(--color-text-secondary)] mb-4">
        {t('admin.salonMasters.tempPasswordNote')}
      </p>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--color-text)] mb-1">{t('admin.salonMasters.firstName')}</label>
          <input type="text" required value={form.firstName} onChange={set('firstName')}
            className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-text)] mb-1">{t('admin.salonMasters.lastName')}</label>
          <input type="text" required value={form.lastName} onChange={set('lastName')}
            className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-text)] mb-1">{t('admin.salonMasters.email')}</label>
          <input type="email" required value={form.email} onChange={set('email')}
            className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-text)] mb-1">{t('admin.salonMasters.phone')}</label>
          <input type="tel" required value={form.phone} onChange={set('phone')}
            className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)]" />
        </div>
        <div className="col-span-2 flex justify-end gap-3 mt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>{t('admin.salonMasters.cancel')}</Button>
          <Button type="submit" disabled={loading}>
            {loading ? t('admin.salonMasters.creating') : t('admin.salonMasters.createMaster')}
          </Button>
        </div>
      </form>
    </div>
  );
}
