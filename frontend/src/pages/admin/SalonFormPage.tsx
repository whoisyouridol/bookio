import { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSalon, createSalon, updateSalon, linkMasterToSalon, unlinkMasterFromSalon } from '@/api/salons';
import { getMasters } from '@/api/masters';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { DragDropUpload } from '@/components/ui/DragDropUpload';
import { Collapse } from '@/components/ui/Collapse';
import { Loader } from '@/components/ui/Loader';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface PendingAdd {
  masterId: string;
  firstName: string;
  lastName: string;
}

export default function SalonFormPage() {
  const { salonId } = useParams<{ salonId: string }>();
  const isNew = !salonId || salonId === 'new';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { role, salonId: ownSalonId } = useAuth();

  if (role === 'salon_admin') {
    if (isNew) return <Navigate to="/admin" replace />;
    if (ownSalonId && salonId !== ownSalonId) return <Navigate to={`/admin/salons/${ownSalonId}`} replace />;
  }
  if (role === 'master_admin') return <Navigate to="/admin" replace />;

  const { data: existing, isLoading } = useQuery({
    queryKey: ['salon', salonId],
    queryFn: () => getSalon(salonId!),
    enabled: !isNew,
  });

  // ── Salon fields ────────────────────────────────────────────────────────────
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [yandexMapsUrl, setYandexMapsUrl] = useState('');
  const [hoursStart, setHoursStart] = useState('09:00');
  const [hoursEnd, setHoursEnd] = useState('21:00');
  const [workingDays, setWorkingDays] = useState<string[]>(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
  const [coverPicture, setCoverPicture] = useState<string | null>(null);
  const [slug, setSlug] = useState('');

  // ── Pending master changes (staged, applied only on Save) ───────────────────
  const [pendingAdds, setPendingAdds] = useState<PendingAdd[]>([]);
  const [pendingRemovals, setPendingRemovals] = useState<string[]>([]);

  // ── Add-master inline form state ────────────────────────────────────────────
  const [showAddMaster, setShowAddMaster] = useState(false);
  const [masterSearch, setMasterSearch] = useState('');

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setAddress(existing.address);
      setGoogleMapsUrl(existing.googleMapsUrl ?? '');
      setYandexMapsUrl(existing.yandexMapsUrl ?? '');
      setHoursStart(existing.workingHoursStart.slice(0, 5));
      setHoursEnd(existing.workingHoursEnd.slice(0, 5));
      setWorkingDays(existing.workingDays);
      setCoverPicture(existing.coverPicture ?? null);
      setSlug(existing.slug ?? '');
    }
  }, [existing]);

  const salonMutation = useMutation({
    mutationFn: () => {
      const payload = {
        name, address,
        slug: slug || undefined,
        googleMapsUrl: googleMapsUrl || undefined,
        yandexMapsUrl: yandexMapsUrl || undefined,
        workingHoursStart: hoursStart,
        workingHoursEnd: hoursEnd,
        workingDays,
        coverPicture: coverPicture ?? undefined,
      };
      return isNew ? createSalon(payload) : updateSalon(salonId!, payload);
    },
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await salonMutation.mutateAsync();

      // Apply staged master changes (only in edit mode)
      if (!isNew) {
        await Promise.all([
          ...pendingAdds.map(a => linkMasterToSalon(salonId!, {
            masterId: a.masterId,
          })),
          ...pendingRemovals.map(id => unlinkMasterFromSalon(salonId!, id)),
        ]);
        queryClient.invalidateQueries({ queryKey: ['salon', salonId] });
      }

      queryClient.invalidateQueries({ queryKey: ['salons'] });
      toast.success(isNew ? t('admin.salonForm.salonCreated') : t('admin.salonForm.salonUpdated'));
      navigate('/admin/salons');
    } catch {
      toast.error(t('admin.salonForm.failedToSave'));
    } finally {
      setIsSaving(false);
    }
  };

  const toggleDay = (day: string) =>
    setWorkingDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);

  const { data: allMasters = [] } = useQuery({
    queryKey: ['masters'],
    queryFn: getMasters,
    enabled: !isNew,
  });

  // Effective linked masters = server list minus pending removals, plus pending adds
  const pendingRemovalSet = new Set(pendingRemovals);
  const pendingAddIds = new Set(pendingAdds.map(a => a.masterId));

  const effectiveLinked = existing?.masters.filter(sm => !pendingRemovalSet.has(sm.masterId)) ?? [];
  const effectiveCount = effectiveLinked.length + pendingAdds.length;

  // Masters available to add = not already effectively linked, not deleted
  const effectiveLinkedIds = new Set([
    ...effectiveLinked.map(sm => sm.masterId),
    ...pendingAddIds,
  ]);
  const availableMasters = allMasters.filter(m => !effectiveLinkedIds.has(m.id) && !m.isDeleted);

  const stageAdd = (master: { id: string; firstName: string; lastName: string }) => {
    setPendingAdds(prev => [...prev, { masterId: master.id, firstName: master.firstName, lastName: master.lastName }]);
    setShowAddMaster(false);
    setMasterSearch('');
  };

  const stageRemove = (masterId: string, isPendingAdd: boolean) => {
    if (isPendingAdd) {
      setPendingAdds(prev => prev.filter(a => a.masterId !== masterId));
    } else {
      setPendingRemovals(prev => [...prev, masterId]);
    }
  };

  if (!isNew && isLoading) return <Loader />;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-[var(--color-text)] mb-6">
        {isNew ? t('admin.salonForm.newSalon') : t('admin.salonForm.editSalon')}
      </h1>

      {/* ── Salon fields ──────────────────────────────────────────────────── */}
      <div className="space-y-5">
        <FormField label={t('admin.salonForm.name')} value={name} onChange={setName} required />
        <FormField label={t('admin.salonForm.slug')} value={slug} onChange={setSlug} placeholder={t('admin.salonForm.slugPlaceholder')} />
        <FormField label={t('admin.salonForm.address')} value={address} onChange={setAddress} required />
        <FormField label={t('admin.salonForm.googleMapsUrl')} value={googleMapsUrl} onChange={setGoogleMapsUrl} />
        <FormField label={t('admin.salonForm.yandexMapsUrl')} value={yandexMapsUrl} onChange={setYandexMapsUrl} />

        <div className="grid grid-cols-2 gap-4">
          <FormField label={t('admin.salonForm.opensAt')} value={hoursStart} onChange={setHoursStart} type="time" />
          <FormField label={t('admin.salonForm.closesAt')} value={hoursEnd} onChange={setHoursEnd} type="time" />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text)] mb-2">{t('admin.salonForm.workingDays')}</label>
          <div className="flex flex-wrap gap-2">
            {DAYS.map(day => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-colors ${
                  workingDays.includes(day)
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary-subtle)] text-[var(--color-primary)]'
                    : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-gray-400'
                }`}
              >
                {day.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text)] mb-1">{t('admin.salonForm.coverImage')}</label>
          <p className="text-xs text-[var(--color-text-secondary)] mb-2">{t('admin.salonForm.coverImageDesc')}</p>
          {!isNew && existing?.coverPicture && (
            <div className="flex items-start gap-2 mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
              <span>⚠️</span>
              <span>{t('admin.salonForm.coverImageHint')}</span>
            </div>
          )}
          <DragDropUpload
            folder="salons"
            accept="image"
            maxFiles={1}
            values={coverPicture ? [coverPicture] : []}
            onChange={keys => setCoverPicture(keys[0] ?? null)}
          />
        </div>
      </div>

      {/* ── Masters section (edit only) ─────────────────────────────────────── */}
      {!isNew && (
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--color-text)]">
              {t('admin.salonForm.masters')} <span className="text-[var(--color-text-tertiary)] font-normal">({effectiveCount})</span>
            </h2>
            {!showAddMaster && availableMasters.length > 0 && (
              <button
                onClick={() => setShowAddMaster(true)}
                className="text-sm font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]"
              >
                {t('admin.salonForm.plusAddMaster')}
              </button>
            )}
          </div>

          {/* Effective masters list */}
          <div className="space-y-2 mb-4">
            {effectiveCount === 0 && !showAddMaster && (
              <p className="text-sm text-[var(--color-text-secondary)]">{t('admin.salonForm.noMastersLinked')}</p>
            )}

            {/* Currently linked (minus pending removals) */}
            {effectiveLinked.map(sm => (
              <div key={sm.id} className="flex items-center justify-between px-4 py-3 bg-[var(--color-bg)] rounded-lg border border-[var(--color-border)]">
                <span className="font-medium text-[var(--color-text)]">{sm.masterFirstName} {sm.masterLastName}</span>
                <button
                  type="button"
                  onClick={() => stageRemove(sm.masterId, false)}
                  className="text-sm text-[var(--color-error)] hover:text-[var(--color-error-text)] font-medium"
                >
                  {t('admin.salonMasters.remove')}
                </button>
              </div>
            ))}

            {/* Pending additions — schedule from current form values (what will be saved) */}
            {pendingAdds.map(a => (
              <div key={a.masterId} className="flex items-center justify-between px-4 py-3 bg-[var(--color-bg)] rounded-lg border border-[var(--color-border)]">
                <span className="font-medium text-[var(--color-text)]">{a.firstName} {a.lastName}</span>
                <button
                  type="button"
                  onClick={() => stageRemove(a.masterId, true)}
                  className="text-sm text-[var(--color-error)] hover:text-[var(--color-error-text)] font-medium"
                >
                  {t('admin.salonMasters.remove')}
                </button>
              </div>
            ))}
          </div>

          {/* Add master inline form */}
          <Collapse open={showAddMaster}>
            <div className="border border-[var(--color-border)] rounded-lg p-4 space-y-4 bg-[var(--color-bg)] mt-2">
              <h3 className="text-sm font-semibold text-[var(--color-text)]">{t('admin.salonForm.addMasterToSalon')}</h3>
              <p className="text-xs text-[var(--color-text-secondary)]">{t('admin.salonForm.masterInheritNote')}</p>

              <div>
                <input
                  type="text"
                  placeholder={t('admin.salonForm.searchByName')}
                  value={masterSearch}
                  onChange={e => setMasterSearch(e.target.value)}
                  className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] mb-2"
                />
                <div className="border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] max-h-48 overflow-y-auto divide-y divide-[var(--color-divider)]">
                  {availableMasters.filter(m =>
                    `${m.firstName} ${m.lastName}`.toLowerCase().includes(masterSearch.toLowerCase())
                  ).length === 0
                    ? <p className="px-3 py-2 text-sm text-[var(--color-text-tertiary)]">{t('admin.salonForm.noMastersFound')}</p>
                    : availableMasters
                        .filter(m => `${m.firstName} ${m.lastName}`.toLowerCase().includes(masterSearch.toLowerCase()))
                        .map(m => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => stageAdd(m)}
                            className="w-full text-left px-3 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-primary-subtle)] hover:text-[var(--color-primary)] transition-colors"
                          >
                            {m.firstName} {m.lastName}
                          </button>
                        ))
                  }
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => { setShowAddMaster(false); setMasterSearch(''); }}
                  className="w-full px-4 py-2 text-sm border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-bg-subtle)] transition-colors text-[var(--color-text)]"
                >
                  {t('admin.salonForm.cancel')}
                </button>
              </div>
            </div>
          </Collapse>
        </div>
      )}

      {/* ── Save / Cancel ──────────────────────────────────────────────────── */}
      <div className="flex gap-3 pt-8 mt-4 border-t border-[var(--color-border)]">
        <Button type="button" variant="secondary" size="lg" onClick={() => navigate(-1)} className="flex-1">
          {t('admin.salonForm.cancel')}
        </Button>
        <Button type="button" size="lg" loading={isSaving} onClick={handleSave} className="flex-1">
          {isNew ? t('admin.salonForm.create') : t('admin.salonForm.saveChanges')}
        </Button>
      </div>
    </div>
  );
}
