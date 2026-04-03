import { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSalon, createSalon, updateSalon, linkMasterToSalon, unlinkMasterFromSalon } from '@/api/salons';
import { getMasters } from '@/api/masters';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { DragDropUpload } from '@/components/ui/DragDropUpload';
import { Loader } from '@/components/ui/Loader';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function SalonFormPage() {
  const { salonId } = useParams<{ salonId: string }>();
  const isNew = !salonId || salonId === 'new';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { role, salonId: ownSalonId } = useAuth();

  // salon_admin can only edit their own salon, not create new ones
  if (role === 'salon_admin') {
    if (isNew) return <Navigate to="/admin" replace />;
    if (ownSalonId && salonId !== ownSalonId) return <Navigate to={`/admin/salons/${ownSalonId}`} replace />;
  }
  // master_admin has no access to salon editing
  if (role === 'master_admin') return <Navigate to="/admin" replace />;

  const { data: existing, isLoading } = useQuery({
    queryKey: ['salon', salonId],
    queryFn: () => getSalon(salonId!),
    enabled: !isNew,
  });

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [yandexMapsUrl, setYandexMapsUrl] = useState('');
  const [hoursStart, setHoursStart] = useState('09:00');
  const [hoursEnd, setHoursEnd] = useState('21:00');
  const [workingDays, setWorkingDays] = useState<string[]>(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
  const [photos, setPhotos] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [slug, setSlug] = useState('');
  const [primaryColor, setPrimaryColor] = useState('');
  const [accentColor, setAccentColor] = useState('');
  const [borderRadius, setBorderRadius] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  // Masters section state
  const [showAddMaster, setShowAddMaster] = useState(false);
  const [addMasterId, setAddMasterId] = useState('');
  const [masterSearch, setMasterSearch] = useState('');

  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setAddress(existing.address);
      setGoogleMapsUrl(existing.googleMapsUrl ?? '');
      setYandexMapsUrl(existing.yandexMapsUrl ?? '');
      setHoursStart(existing.workingHoursStart.slice(0, 5));
      setHoursEnd(existing.workingHoursEnd.slice(0, 5));
      setWorkingDays(existing.workingDays);
      setPhotos(existing.photos);
      setVideos(existing.videos);
      setSlug(existing.slug ?? '');
      setPrimaryColor(existing.primaryColor ?? '');
      setAccentColor(existing.accentColor ?? '');
      setBorderRadius(existing.borderRadius ?? '');
      setLogoUrl(existing.logoUrl ?? '');
    }
  }, [existing]);

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        name, address,
        slug: slug || undefined,
        googleMapsUrl: googleMapsUrl || undefined,
        yandexMapsUrl: yandexMapsUrl || undefined,
        workingHoursStart: hoursStart,
        workingHoursEnd: hoursEnd,
        workingDays,
        photos: photos.filter(Boolean),
        videos: videos.filter(Boolean),
        primaryColor: primaryColor || undefined,
        accentColor: accentColor || undefined,
        borderRadius: borderRadius || undefined,
        logoUrl: logoUrl || undefined,
      };
      return isNew ? createSalon(payload) : updateSalon(salonId!, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salons'] });
      toast.success(isNew ? t('admin.salonForm.salonCreated') : t('admin.salonForm.salonUpdated'));
      navigate('/admin/salons');
    },
    onError: () => toast.error(t('admin.salonForm.failedToSave')),
  });

  const toggleDay = (day: string) =>
    setWorkingDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);

  const { data: allMasters = [] } = useQuery({
    queryKey: ['masters'],
    queryFn: getMasters,
    enabled: !isNew,
  });

  const linkedMasterIds = new Set(existing?.masters.map(m => m.masterId) ?? []);
  const availableMasters = allMasters.filter(m => !linkedMasterIds.has(m.id) && !m.isDeleted);

  const linkMutation = useMutation({
    mutationFn: () => linkMasterToSalon(salonId!, {
      masterId: addMasterId,
      workingHoursStart: existing?.workingHoursStart.slice(0, 5) ?? '09:00',
      workingHoursEnd: existing?.workingHoursEnd.slice(0, 5) ?? '21:00',
      workingDays: existing?.workingDays ?? ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salon', salonId] });
      queryClient.invalidateQueries({ queryKey: ['masterSalons', addMasterId] });
      setShowAddMaster(false);
      setAddMasterId('');
      setMasterSearch('');
      toast.success(t('admin.salonForm.masterAddedToSalon'));
    },
    onError: () => toast.error(t('admin.salonForm.failedToAddMaster')),
  });

  const unlinkMutation = useMutation({
    mutationFn: (masterId: string) => unlinkMasterFromSalon(salonId!, masterId),
    onSuccess: (_, masterId) => {
      queryClient.invalidateQueries({ queryKey: ['salon', salonId] });
      queryClient.invalidateQueries({ queryKey: ['masterSalons', masterId] });
      toast.success(t('admin.salonForm.masterRemovedFromSalon'));
    },
    onError: () => toast.error(t('admin.salonForm.failedToRemoveMaster')),
  });

  if (!isNew && isLoading) return <Loader />;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-[var(--color-text)] mb-6">{isNew ? t('admin.salonForm.newSalon') : t('admin.salonForm.editSalon')}</h1>

      <form onSubmit={e => { e.preventDefault(); mutation.mutate(); }} className="space-y-5">
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

        {/* Subdomain Theming */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text)] mb-2">{t('admin.salonForm.subdomainTheming')}</label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[var(--color-text-secondary)] mb-1">{t('admin.salonForm.primaryColor')}</label>
              <div className="flex items-center gap-2">
                <input type="color" value={primaryColor || '#8B5CF6'} onChange={e => setPrimaryColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border border-[var(--color-border)]" />
                <input type="text" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} placeholder="#8B5CF6" className="flex-1 px-2 py-1.5 text-sm border border-[var(--color-border)] rounded-lg" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-[var(--color-text-secondary)] mb-1">{t('admin.salonForm.accentColor')}</label>
              <div className="flex items-center gap-2">
                <input type="color" value={accentColor || '#7C3AED'} onChange={e => setAccentColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border border-[var(--color-border)]" />
                <input type="text" value={accentColor} onChange={e => setAccentColor(e.target.value)} placeholder="#7C3AED" className="flex-1 px-2 py-1.5 text-sm border border-[var(--color-border)] rounded-lg" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-3">
            <FormField label={t('admin.salonForm.borderRadius')} value={borderRadius} onChange={setBorderRadius} placeholder="12px" />
            <FormField label={t('admin.salonForm.logoUrl')} value={logoUrl} onChange={setLogoUrl} placeholder="https://..." />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">{t('admin.salonForm.photos')}</label>
          <DragDropUpload folder="salons" accept="image" maxFiles={10} values={photos} onChange={setPhotos} />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">{t('admin.salonForm.videos')}</label>
          <DragDropUpload folder="salons" accept="video" maxFiles={5} values={videos} onChange={setVideos} />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" size="lg" onClick={() => navigate(-1)} className="flex-1">
            {t('admin.salonForm.cancel')}
          </Button>
          <Button type="submit" size="lg" loading={mutation.isPending} className="flex-1">
            {isNew ? t('admin.salonForm.create') : t('admin.salonForm.saveChanges')}
          </Button>
        </div>
      </form>

      {/* ── Masters section (edit only) ─────────────────────────────────────── */}
      {!isNew && (
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--color-text)]">
              {t('admin.salonForm.masters')} <span className="text-[var(--color-text-tertiary)] font-normal">({existing?.masters.length ?? 0})</span>
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

          {/* Linked masters list */}
          <div className="space-y-2 mb-4">
            {existing?.masters.length === 0 && !showAddMaster && (
              <p className="text-sm text-[var(--color-text-secondary)]">{t('admin.salonForm.noMastersLinked')}</p>
            )}
            {existing?.masters.map(sm => (
              <div key={sm.id} className="flex items-center justify-between px-4 py-3 bg-[var(--color-bg)] rounded-lg border border-[var(--color-border)]">
                <div>
                  <span className="font-medium text-[var(--color-text)]">{sm.masterFirstName} {sm.masterLastName}</span>
                  <span className="text-sm text-[var(--color-text-secondary)] ml-3">
                    {sm.workingHoursStart.slice(0, 5)}–{sm.workingHoursEnd.slice(0, 5)}
                    {' · '}{sm.workingDays.map(d => d.slice(0, 3)).join(', ')}
                  </span>
                </div>
                <button
                  onClick={() => unlinkMutation.mutate(sm.masterId)}
                  disabled={unlinkMutation.isPending}
                  className="text-sm text-[var(--color-error)] hover:text-[var(--color-error-text)] font-medium disabled:opacity-40"
                >
                  {t('admin.salonMasters.remove')}
                </button>
              </div>
            ))}
          </div>

          {/* Add master inline form */}
          {showAddMaster && (
            <div className="border border-[var(--color-border)] rounded-lg p-4 space-y-4 bg-[var(--color-bg)]">
              <h3 className="text-sm font-semibold text-gray-800">{t('admin.salonForm.addMasterToSalon')}</h3>
              <p className="text-xs text-[var(--color-text-secondary)]">{t('admin.salonForm.masterInheritNote')}</p>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">{t('admin.nav.masters' as any)}</label>
                <input
                  type="text"
                  placeholder={t('admin.salonForm.searchByName')}
                  value={masterSearch}
                  onChange={e => { setMasterSearch(e.target.value); setAddMasterId(''); }}
                  className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm bg-[var(--color-surface)] focus:outline-none focus:border-[var(--color-primary)] mb-2"
                />
                {(() => {
                  const filtered = availableMasters.filter(m =>
                    `${m.firstName} ${m.lastName}`.toLowerCase().includes(masterSearch.toLowerCase())
                  );
                  return (
                    <div className="border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] max-h-48 overflow-y-auto divide-y divide-[var(--color-divider)]">
                      {filtered.length === 0
                        ? <p className="px-3 py-2 text-sm text-[var(--color-text-tertiary)]">{t('admin.salonForm.noMastersFound')}</p>
                        : filtered.map(m => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => { setAddMasterId(m.id); setMasterSearch(`${m.firstName} ${m.lastName}`); }}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-[var(--color-primary-subtle)] transition-colors ${addMasterId === m.id ? 'bg-[var(--color-primary-subtle)] text-[var(--color-primary)] font-medium' : 'text-gray-800'}`}
                          >
                            {m.firstName} {m.lastName}
                          </button>
                        ))
                      }
                    </div>
                  );
                })()}
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowAddMaster(false); setAddMasterId(''); setMasterSearch(''); }}
                  className="flex-1 px-4 py-2 text-sm border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-bg-subtle)] transition-colors"
                >
                  {t('admin.salonForm.cancel')}
                </button>
                <button
                  type="button"
                  onClick={() => linkMutation.mutate()}
                  disabled={!addMasterId || linkMutation.isPending}
                  className="flex-1 px-4 py-2 text-sm bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-hover)] disabled:opacity-50 transition-colors font-medium"
                >
                  {linkMutation.isPending ? t('admin.salonForm.adding') : t('admin.salonForm.addMaster')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


