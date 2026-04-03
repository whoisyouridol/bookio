import { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMaster, createMaster, updateMaster, getMasterServices, addMasterService, updateMasterService, removeMasterService, getMasterSalons } from '@/api/masters';
import { updateSalonMaster } from '@/api/salons';
import { getServices } from '@/api/services';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { DragDropUpload } from '@/components/ui/DragDropUpload';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { Loader } from '@/components/ui/Loader';
import { resolveMediaUrl } from '@/api/media';
import { toast } from 'sonner';
import { Plus, Trash2, Info, Edit2, Check, X } from 'lucide-react';
import type { MasterServiceDto, SalonMasterWithSalonDto } from '@/types';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';

export default function MasterFormPage() {
  const { masterId } = useParams<{ masterId: string }>();
  const isNew = !masterId || masterId === 'new';
  const { t } = useTranslation();
  const { role, masterId: ownMasterId } = useAuth();

  // master_admin can only edit their own profile, not create new masters
  if (role === 'master_admin') {
    if (isNew) return <Navigate to="/admin" replace />;
    if (ownMasterId && masterId !== ownMasterId) return <Navigate to={`/admin/masters/${ownMasterId}`} replace />;
  }
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: existing, isLoading } = useQuery({
    queryKey: ['master', masterId],
    queryFn: () => getMaster(masterId!),
    enabled: !isNew,
  });

  const { data: masterServices } = useQuery({
    queryKey: ['masterServices', masterId],
    queryFn: () => getMasterServices(masterId!),
    enabled: !isNew,
  });

  const { data: catalog } = useQuery({ queryKey: ['services'], queryFn: getServices });

  const { data: masterSalons = [] } = useQuery({
    queryKey: ['masterSalons', masterId],
    queryFn: () => getMasterSalons(masterId!),
    enabled: !isNew,
  });

  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [photoKeys, setPhotoKeys] = useState<string[]>([]);

  const [description, setDescription] = useState('');
  const [autoApproveBookings, setAutoApproveBookings] = useState(true);

  // Add-service form
  const [addServiceId, setAddServiceId] = useState('');
  const [addPrice, setAddPrice] = useState('');
  const [addDuration, setAddDuration] = useState('');
  const [addPhotoKeys, setAddPhotoKeys] = useState<string[]>([]);
  const [addDescription, setAddDescription] = useState('');

  // Per-salon schedule editing state
  const [editingScheduleSalonId, setEditingScheduleSalonId] = useState<string | null>(null);
  const [schedHoursStart, setSchedHoursStart] = useState('09:00');
  const [schedHoursEnd, setSchedHoursEnd] = useState('21:00');
  const [schedDays, setSchedDays] = useState<string[]>([]);

  const openScheduleEdit = (sm: SalonMasterWithSalonDto) => {
    setEditingScheduleSalonId(sm.salonId);
    setSchedHoursStart(sm.workingHoursStart.slice(0, 5));
    setSchedHoursEnd(sm.workingHoursEnd.slice(0, 5));
    setSchedDays(sm.workingDays);
  };

  const closeScheduleEdit = () => {
    setEditingScheduleSalonId(null);
    setSchedHoursStart('09:00');
    setSchedHoursEnd('21:00');
    setSchedDays([]);
  };

  // Edit-service inline state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editDuration, setEditDuration] = useState('');
  const [editPhotoKeys, setEditPhotoKeys] = useState<string[]>([]);
  const [clearPhoto, setClearPhoto] = useState(false);
  const [editDescription, setEditDescription] = useState('');

  useEffect(() => {
    if (existing) {
      setPhotoKeys(existing.photo ? [existing.photo] : []);
      setDescription(existing.description ?? '');
      setAutoApproveBookings(existing.autoApproveBookings);
    }
  }, [existing]);

  const openEdit = (ms: MasterServiceDto) => {
    setEditingId(ms.serviceId);
    setEditPrice(String(ms.price));
    setEditDuration(String(ms.durationMinutes));
    setEditPhotoKeys(ms.photo ? [ms.photo] : []);
    setClearPhoto(false);
    setEditDescription(ms.description ?? '');
  };

  const closeEdit = () => {
    setEditingId(null);
    setEditPrice(''); setEditDuration(''); setEditPhotoKeys([]); setClearPhoto(false); setEditDescription('');
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      if (isNew) {
        return createMaster({ email, firstName, lastName, phone, photo: photoKeys[0] || undefined, description: description || undefined, autoApproveBookings });
      }
      return updateMaster(masterId!, { photo: photoKeys[0] || undefined, description: description || undefined, autoApproveBookings });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['masters'] });
      toast.success(isNew ? t('admin.masterForm.masterCreated') : t('admin.masterForm.masterUpdated'));
      navigate('/admin/masters');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg ?? t('admin.masterForm.failedToSave'));
    },
  });

  const addServiceMutation = useMutation({
    mutationFn: () => addMasterService(masterId!, {
      serviceId: addServiceId,
      price: Number(addPrice),
      durationMinutes: Number(addDuration),
      photo: addPhotoKeys[0] || undefined,
      description: addDescription || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['masterServices', masterId] });
      setAddServiceId(''); setAddPrice(''); setAddDuration(''); setAddPhotoKeys([]); setAddDescription('');
      toast.success(t('admin.masterForm.serviceAdded'));
    },
    onError: () => toast.error(t('admin.masterForm.failedToAddService')),
  });

  const updateServiceMutation = useMutation({
    mutationFn: (serviceId: string) => updateMasterService(masterId!, serviceId, {
      price: Number(editPrice),
      durationMinutes: Number(editDuration),
      photo: editPhotoKeys[0] || undefined,
      clearPhoto,
      description: editDescription || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['masterServices', masterId] });
      closeEdit();
      toast.success(t('admin.masterForm.serviceUpdated'));
    },
    onError: () => toast.error(t('admin.masterForm.failedToUpdateService')),
  });

  const removeServiceMutation = useMutation({
    mutationFn: (serviceId: string) => removeMasterService(masterId!, serviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['masterServices', masterId] });
      toast.success(t('admin.masterForm.serviceRemoved'));
    },
  });

  const updateScheduleMutation = useMutation({
    mutationFn: (salonId: string) => updateSalonMaster(salonId, masterId!, {
      workingHoursStart: schedHoursStart,
      workingHoursEnd: schedHoursEnd,
      workingDays: schedDays,
    }),
    onSuccess: (_, salonId) => {
      queryClient.invalidateQueries({ queryKey: ['masterSalons', masterId] });
      queryClient.invalidateQueries({ queryKey: ['salon', salonId] });
      closeScheduleEdit();
      toast.success(t('admin.masterForm.scheduleUpdated'));
    },
    onError: () => toast.error(t('admin.masterForm.failedToUpdateSchedule')),
  });

  if (!isNew && isLoading) return <Loader />;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-[var(--color-text)]">{isNew ? t('admin.masterForm.newMaster') : t('admin.masterForm.editMaster')}</h1>

      <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
        {isNew ? (
          <>
            <FormField label={t('admin.masterForm.email')} type="email" value={email} onChange={setEmail} required />
            <div className="grid grid-cols-2 gap-4">
              <FormField label={t('admin.masterForm.firstName')} value={firstName} onChange={setFirstName} required />
              <FormField label={t('admin.masterForm.lastName')} value={lastName} onChange={setLastName} required />
            </div>
            <FormField label={t('admin.masterForm.phone')} value={phone} onChange={setPhone} required />
          </>
        ) : (
          existing && (
            <div className="bg-[var(--color-bg)] rounded-lg px-4 py-3 text-sm text-[var(--color-text-secondary)] space-y-0.5">
              <p className="font-medium text-[var(--color-text)]">{existing.firstName} {existing.lastName}</p>
              <p className="text-xs text-[var(--color-text-tertiary)]">{existing.email ?? existing.phone ?? '\u2014'}</p>
              <p className="text-xs text-[var(--color-text-tertiary)] mt-1">{t('admin.masterForm.editNameNote' as any)}</p>
            </div>
          )
        )}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">{t('admin.masterForm.photo')}</label>
          <DragDropUpload folder="masters" accept="image" maxFiles={1} values={photoKeys} onChange={setPhotoKeys} />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">{t('admin.masterForm.description')}</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--color-primary)] resize-none"
          />
        </div>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={autoApproveBookings}
            onChange={e => setAutoApproveBookings(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
          />
          <span>
            <span className="text-sm font-medium text-[var(--color-text)]">{t('admin.masterForm.autoApprove')}</span>
            <span className="block text-xs text-[var(--color-text-secondary)] mt-0.5">
              {autoApproveBookings
                ? t('admin.masterForm.autoApproveOn')
                : t('admin.masterForm.autoApproveOff')}
            </span>
          </span>
        </label>
        <div className="flex gap-3">
          <Button type="button" variant="secondary" size="lg" onClick={() => navigate(-1)} className="flex-1">{t('admin.masterForm.cancel')}</Button>
          <Button type="submit" size="lg" loading={saveMutation.isPending} className="flex-1">
            {isNew ? t('admin.masterForm.create') : t('admin.masterForm.saveChanges')}
          </Button>
        </div>
      </form>

      {/* Salons & Schedule section (only when editing) */}
      {!isNew && masterSalons.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">{t('admin.masterForm.salonsAndSchedule')}</h2>
          <div className="space-y-3">
            {masterSalons.map(sm => {
              const isEditing = editingScheduleSalonId === sm.salonId;
              return (
                <div key={sm.salonId} className="border border-[var(--color-border)] rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 bg-[var(--color-surface)]">
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text)]">{sm.salonName}</p>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                        {sm.workingHoursStart.slice(0, 5)}–{sm.workingHoursEnd.slice(0, 5)}
                        {' · '}{sm.workingDays.map((d: string) => d.slice(0, 3)).join(', ')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => isEditing ? closeScheduleEdit() : openScheduleEdit(sm)}
                      className="text-sm font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]"
                    >
                      {isEditing ? t('admin.masterForm.cancel') : t('admin.availability.editSchedule')}
                    </button>
                  </div>

                  {isEditing && (
                    <div className="border-t border-[var(--color-divider)] bg-[var(--color-bg)] p-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField label={t('admin.masterForm.worksFrom')} value={schedHoursStart} onChange={setSchedHoursStart} type="time" />
                        <FormField label={t('admin.masterForm.worksUntil')} value={schedHoursEnd} onChange={setSchedHoursEnd} type="time" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[var(--color-text)] mb-2">{t('admin.masterForm.workingDays')}</label>
                        <div className="flex flex-wrap gap-2">
                          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                            <button
                              key={day}
                              type="button"
                              onClick={() => setSchedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-colors ${
                                schedDays.includes(day)
                                  ? 'border-[var(--color-primary)] bg-[var(--color-primary-subtle)] text-[var(--color-primary)]'
                                  : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-gray-400'
                              }`}
                            >
                              {day.slice(0, 3)}
                            </button>
                          ))}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => updateScheduleMutation.mutate(sm.salonId)}
                        disabled={schedDays.length === 0 || updateScheduleMutation.isPending}
                        className="w-full px-4 py-2 text-sm bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-hover)] disabled:opacity-50 transition-colors font-medium"
                      >
                        {updateScheduleMutation.isPending ? t('admin.masterForm.saving') : t('admin.masterForm.saveSchedule')}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Services section (only when editing) */}
      {!isNew && (
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">{t('admin.masterForm.services')}</h2>

          {/* Existing */}
          <div className="space-y-2 mb-4">
            {masterServices?.filter(s => s.isActive).map(ms => {
              const effectivePhoto = ms.photo ?? ms.servicePhoto;
              const isEditing = editingId === ms.serviceId;

              return (
                <div key={ms.id} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg overflow-hidden">
                  {/* Row */}
                  <div
                    className="flex items-center gap-3 px-3 py-3 cursor-pointer hover:bg-[var(--color-bg)] transition-colors"
                    onClick={() => isEditing ? closeEdit() : openEdit(ms)}
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-[var(--color-bg-subtle)] shrink-0">
                      <img
                        src={resolveMediaUrl(effectivePhoto)}
                        alt={ms.serviceName}
                        className="w-full h-full object-cover"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--color-text)]">{ms.serviceName}</p>
                      <p className="text-xs text-[var(--color-text-secondary)]">{ms.durationMinutes} min · {ms.price.toLocaleString()} ₾</p>
                      {ms.photo && <p className="text-xs text-[var(--color-primary)] mt-0.5">{t('admin.masterForm.customPhoto')}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); isEditing ? closeEdit() : openEdit(ms); }}>
                        {isEditing ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); removeServiceMutation.mutate(ms.serviceId); }}>
                        <Trash2 className="w-4 h-4 text-[var(--color-error)]" />
                      </Button>
                    </div>
                  </div>

                  {/* Inline edit form */}
                  {isEditing && (
                    <div className="border-t border-[var(--color-divider)] bg-[var(--color-bg)] p-4 space-y-3">
                      <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                        <div className="flex-1 space-y-2">
                          <p className="text-xs text-[var(--color-info-text)]">{t('admin.masterForm.defaultPhotoLabel')}</p>
                          <div className="w-14 h-14 rounded-lg overflow-hidden bg-[var(--color-bg-subtle)] border border-blue-200">
                            <ImageWithFallback src={ms.servicePhoto} alt="default" className="w-full h-full object-cover" />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-[var(--color-text-secondary)]">{t('admin.masterForm.customPhotoForMaster')}</p>
                        {(editPhotoKeys.length > 0 || (ms.photo && !clearPhoto)) && (
                          <button
                            type="button"
                            onClick={() => { setEditPhotoKeys([]); setClearPhoto(true); }}
                            className="text-xs text-[var(--color-error)] hover:text-[var(--color-error-text)]"
                          >
                            {t('admin.masterForm.resetToDefault')}
                          </button>
                        )}
                      </div>
                      <DragDropUpload
                        folder="master-services"
                        accept="image"
                        maxFiles={1}
                        values={clearPhoto ? [] : editPhotoKeys}
                        onChange={keys => { setEditPhotoKeys(keys); setClearPhoto(keys.length === 0); }}
                      />
                      <div>
                        <div className="flex justify-between mb-1">
                          <p className="text-xs font-medium text-[var(--color-text-secondary)]">{t('admin.masterForm.descriptionOptional')}</p>
                          <span className="text-xs text-[var(--color-text-tertiary)]">{editDescription.length}/300</span>
                        </div>
                        <textarea
                          value={editDescription}
                          onChange={e => setEditDescription(e.target.value)}
                          maxLength={300}
                          rows={2}
                          placeholder={t('admin.masterForm.descriptionPlaceholder')}
                          className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--color-primary)] resize-none"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <input type="number" placeholder={t('admin.masterForm.price')} value={editPrice} onChange={e => setEditPrice(e.target.value)}
                          className="px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--color-primary)]" />
                        <input type="number" placeholder={t('admin.masterForm.durationMin')} value={editDuration} onChange={e => setEditDuration(e.target.value)}
                          className="px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--color-primary)]" />
                        <Button size="sm" disabled={!editPrice || !editDuration} loading={updateServiceMutation.isPending}
                          onClick={() => updateServiceMutation.mutate(ms.serviceId)}>
                          <Check className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add new */}
          <div className="bg-[var(--color-bg)] rounded-lg p-4 space-y-3">
            <p className="text-sm font-medium text-[var(--color-text)]">{t('admin.masterForm.addService')}</p>
            <select
              value={addServiceId}
              onChange={e => { setAddServiceId(e.target.value); setAddPhotoKeys([]); }}
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--color-primary)] bg-[var(--color-surface)]"
            >
              <option value="">{t('admin.masterForm.selectService')}</option>
              {catalog?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>

            {addServiceId && (() => {
              const defaultPhoto = catalog?.find(s => s.id === addServiceId)?.photo;
              return (
                <div className="space-y-2">
                  <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <p className="text-xs text-[var(--color-info-text)]">
                        {t('admin.masterForm.defaultPhotoNote')}
                      </p>
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-[var(--color-bg-subtle)] border border-blue-200">
                        <ImageWithFallback src={defaultPhoto} alt="default" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  </div>
                  <p className="text-xs font-medium text-[var(--color-text-secondary)]">{t('admin.masterForm.customPhotoForMaster')}</p>
                  <DragDropUpload folder="master-services" accept="image" maxFiles={1} values={addPhotoKeys} onChange={setAddPhotoKeys} />
                </div>
              );
            })()}

            <div>
              <div className="flex justify-between mb-1">
                <p className="text-xs font-medium text-[var(--color-text-secondary)]">{t('admin.masterForm.descriptionOptional')}</p>
                <span className="text-xs text-[var(--color-text-tertiary)]">{addDescription.length}/300</span>
              </div>
              <textarea
                value={addDescription}
                onChange={e => setAddDescription(e.target.value)}
                maxLength={300}
                rows={2}
                placeholder={t('admin.masterForm.descriptionPlaceholder')}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--color-primary)] resize-none"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <input type="number" placeholder={t('admin.masterForm.price')} value={addPrice} onChange={e => setAddPrice(e.target.value)}
                className="px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--color-primary)]" />
              <input type="number" placeholder={t('admin.masterForm.durationMin')} value={addDuration} onChange={e => setAddDuration(e.target.value)}
                className="px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--color-primary)]" />
              <Button size="sm" disabled={!addServiceId || !addPrice || !addDuration} loading={addServiceMutation.isPending}
                onClick={() => addServiceMutation.mutate()}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

