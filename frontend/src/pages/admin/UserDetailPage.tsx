import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ShieldCheck, ShieldOff, User, Scissors, Info, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { getAdminUser, updateUserProfile, setUserActive } from '@/api/auth';
import { getMaster, getMasterServices, updateMaster, addMasterService, updateMasterService, removeMasterService } from '@/api/masters';
import { getServices } from '@/api/services';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { DragDropUpload } from '@/components/ui/DragDropUpload';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { resolveMediaUrl } from '@/api/media';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/error';
import type { MasterServiceDto } from '@/types';

type Tab = 'account' | 'master';

export default function UserDetailPage() {
  const { t } = useTranslation();
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['admin-user', userId],
    queryFn: () => getAdminUser(userId!),
    enabled: !!userId,
  });

  const hasMaster = !!user?.masterId;
  const [tab, setTab] = useState<Tab>('account');

  // ── Master profile lazy queries (only when tab === 'master') ───────────────
  const { data: master } = useQuery({
    queryKey: ['master', user?.masterId],
    queryFn: () => getMaster(user!.masterId!),
    enabled: hasMaster && tab === 'master',
  });

  const { data: masterServices } = useQuery({
    queryKey: ['masterServices', user?.masterId],
    queryFn: () => getMasterServices(user!.masterId!),
    enabled: hasMaster && tab === 'master',
  });

  const { data: catalog = [] } = useQuery({
    queryKey: ['services'],
    queryFn: getServices,
    enabled: tab === 'master',
  });

  // ── Account form state ─────────────────────────────────────────────────────
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName ?? '');
      setLastName(user.lastName ?? '');
      setPhone(user.phone ?? '');
      setEmail(user.email ?? '');
    }
  }, [user]);

  // ── Master profile form state ──────────────────────────────────────────────
  const [masterPhotoKeys, setMasterPhotoKeys] = useState<string[]>([]);
  const [masterDescription, setMasterDescription] = useState('');
  const [masterAutoApprove, setMasterAutoApprove] = useState(true);

  useEffect(() => {
    if (master) {
      setMasterPhotoKeys(master.photo ? [master.photo] : []);
      setMasterDescription(master.description ?? '');
      setMasterAutoApprove(master.autoApproveBookings);
    }
  }, [master]);

  // ── Service editing state ──────────────────────────────────────────────────
  const [addServiceId, setAddServiceId] = useState('');
  const [addPrice, setAddPrice] = useState('');
  const [addDuration, setAddDuration] = useState('');
  const [addPhotoKeys, setAddPhotoKeys] = useState<string[]>([]);
  const [addSvcDesc, setAddSvcDesc] = useState('');

  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editDuration, setEditDuration] = useState('');
  const [editPhotoKeys, setEditPhotoKeys] = useState<string[]>([]);
  const [clearPhoto, setClearPhoto] = useState(false);
  const [editSvcDesc, setEditSvcDesc] = useState('');

  const openEditService = (ms: MasterServiceDto) => {
    setEditingServiceId(ms.serviceId);
    setEditPrice(String(ms.price));
    setEditDuration(String(ms.durationMinutes));
    setEditPhotoKeys(ms.photo ? [ms.photo] : []);
    setClearPhoto(false);
    setEditSvcDesc(ms.description ?? '');
  };
  const closeEditService = () => {
    setEditingServiceId(null);
    setEditPrice(''); setEditDuration(''); setEditPhotoKeys([]); setClearPhoto(false); setEditSvcDesc('');
  };

  // ── Account mutations ──────────────────────────────────────────────────────
  const updateProfileMutation = useMutation({
    mutationFn: () => updateUserProfile(userId!, { firstName, lastName, phone, email }),
    onSuccess: updated => {
      queryClient.setQueryData(['admin-user', userId], updated);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(t('admin.userDetail.profileUpdated'));
    },
    onError: err => toast.error(getErrorMessage(err)),
  });

  const activateMutation = useMutation({
    mutationFn: (isActive: boolean) => setUserActive(userId!, isActive),
    onSuccess: updated => {
      queryClient.setQueryData(['admin-user', userId], updated);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(updated.isActive ? t('admin.userDetail.userActivated') : t('admin.userDetail.userDeactivated'));
    },
    onError: err => toast.error(getErrorMessage(err)),
  });

  // ── Master profile mutations ───────────────────────────────────────────────
  const updateMasterMutation = useMutation({
    mutationFn: () => updateMaster(user!.masterId!, {
      photo: masterPhotoKeys[0] || undefined,
      description: masterDescription || undefined,
      autoApproveBookings: masterAutoApprove,
    }),
    onSuccess: updated => {
      queryClient.setQueryData(['master', user?.masterId], updated);
      toast.success(t('admin.userDetail.masterProfileUpdated'));
    },
    onError: err => toast.error(getErrorMessage(err)),
  });

  const addServiceMutation = useMutation({
    mutationFn: () => addMasterService(user!.masterId!, {
      serviceId: addServiceId,
      price: Number(addPrice),
      durationMinutes: Number(addDuration),
      photo: addPhotoKeys[0] || undefined,
      description: addSvcDesc || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['masterServices', user?.masterId] });
      setAddServiceId(''); setAddPrice(''); setAddDuration(''); setAddPhotoKeys([]); setAddSvcDesc('');
      toast.success(t('admin.userDetail.serviceAdded'));
    },
    onError: err => toast.error(getErrorMessage(err)),
  });

  const updateServiceMutation = useMutation({
    mutationFn: (serviceId: string) => updateMasterService(user!.masterId!, serviceId, {
      price: Number(editPrice),
      durationMinutes: Number(editDuration),
      photo: editPhotoKeys[0] || undefined,
      clearPhoto,
      description: editSvcDesc || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['masterServices', user?.masterId] });
      closeEditService();
      toast.success(t('admin.userDetail.serviceUpdated'));
    },
    onError: err => toast.error(getErrorMessage(err)),
  });

  const removeServiceMutation = useMutation({
    mutationFn: (serviceId: string) => removeMasterService(user!.masterId!, serviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['masterServices', user?.masterId] });
      toast.success(t('admin.userDetail.serviceRemoved'));
    },
  });

  if (isLoading) return <Loader />;
  if (!user) return <div className="p-6 text-[var(--color-text-secondary)]">{t('admin.userDetail.accountNotFound')}</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/admin/users')} className="p-1.5 hover:bg-[var(--color-bg-subtle)] rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-[var(--color-text-secondary)]" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-[var(--color-text)] truncate">
            {user.firstName || user.lastName ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() : (user.email ?? user.phone ?? '\u2014')}
          </h1>
          <p className="text-sm text-[var(--color-text-tertiary)]">{user.email ?? user.phone ?? '\u2014'}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={user.isActive ? 'success' : 'warning'}>{user.isActive ? t('admin.users.active') : t('admin.users.pending')}</Badge>
          <button
            onClick={() => activateMutation.mutate(!user.isActive)}
            disabled={activateMutation.isPending}
            title={user.isActive ? t('admin.userDetail.deactivate') : t('admin.userDetail.activate')}
            className={`p-2 rounded-lg transition-colors ${user.isActive ? 'text-[var(--color-success)] hover:bg-[var(--color-success-subtle)]' : 'text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-subtle)]'}`}
          >
            {user.isActive ? <ShieldCheck className="w-5 h-5" /> : <ShieldOff className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--color-border)] mb-6">
        <button
          onClick={() => setTab('account')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === 'account' ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
          }`}
        >
          <User className="w-4 h-4" /> {t('admin.userDetail.accountTab')}
        </button>
        {hasMaster && (
          <button
            onClick={() => setTab('master')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === 'master' ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
            }`}
          >
            <Scissors className="w-4 h-4" /> {t('admin.userDetail.masterProfileTab')}
          </button>
        )}
      </div>

      {/* ── Account tab ───────────────────────────────────────────────────────── */}
      {tab === 'account' && (
        <div className="space-y-6">
          <section className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] p-5 space-y-4">
            <h2 className="text-sm font-semibold text-[var(--color-text)] uppercase tracking-wide">{t('admin.userDetail.profileTab')}</h2>
            <div className="grid grid-cols-2 gap-4">
              <Field label={t('admin.userDetail.firstName')} value={firstName} onChange={setFirstName} />
              <Field label={t('admin.userDetail.lastName')} value={lastName} onChange={setLastName} />
            </div>
            <Field label={t('admin.userDetail.email')} value={email} onChange={setEmail} type="email" />
            <Field label={t('admin.userDetail.phone')} value={phone} onChange={setPhone} type="tel" />
            {user.externalProvider && (
              <p className="text-xs text-[var(--color-text-tertiary)]">
                {t('admin.userDetail.linkedVia')} <span className="font-medium">{user.externalProvider}</span> {t('admin.userDetail.noPasswordLogin')}
              </p>
            )}
            <Button onClick={() => updateProfileMutation.mutate()} loading={updateProfileMutation.isPending} size="sm">
              {t('admin.userDetail.saveProfile')}
            </Button>
          </section>

          <section className="bg-[var(--color-bg)] rounded-[var(--radius-lg)] border border-[var(--color-divider)] p-4 text-xs text-[var(--color-text-tertiary)] space-y-1">
            <p><span className="font-medium text-[var(--color-text-secondary)]">{t('admin.userDetail.userId')}</span> {user.id}</p>
            <p><span className="font-medium text-[var(--color-text-secondary)]">{t('admin.userDetail.created')}</span> {new Date(user.createdAt).toLocaleString()}</p>
          </section>
        </div>
      )}

      {/* ── Master Profile tab ────────────────────────────────────────────────── */}
      {tab === 'master' && hasMaster && (
        <div className="space-y-6">
          {/* Master profile fields */}
          <section className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] p-5 space-y-4">
            <h2 className="text-sm font-semibold text-[var(--color-text)] uppercase tracking-wide">{t('admin.userDetail.masterProfile')}</h2>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">{t('admin.userDetail.photo')}</label>
              <DragDropUpload folder="masters" accept="image" maxFiles={1} values={masterPhotoKeys} onChange={setMasterPhotoKeys} />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">{t('admin.userDetail.description')}</label>
              <textarea
                value={masterDescription}
                onChange={e => setMasterDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--color-primary)] resize-none"
              />
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={masterAutoApprove} onChange={e => setMasterAutoApprove(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]" />
              <span>
                <span className="text-sm font-medium text-[var(--color-text)]">{t('admin.userDetail.autoApprove')}</span>
                <span className="block text-xs text-[var(--color-text-secondary)] mt-0.5">
                  {masterAutoApprove ? t('admin.userDetail.autoApproveOn') : t('admin.userDetail.autoApproveOff')}
                </span>
              </span>
            </label>

            <Button onClick={() => updateMasterMutation.mutate()} loading={updateMasterMutation.isPending} size="sm">
              {t('admin.userDetail.saveProfile')}
            </Button>
          </section>

          {/* Services */}
          <section className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] p-5 space-y-4">
            <h2 className="text-sm font-semibold text-[var(--color-text)] uppercase tracking-wide">{t('admin.userDetail.services')}</h2>

            <div className="space-y-2">
              {masterServices?.filter(s => s.isActive).map(ms => {
                const effectivePhoto = ms.photo ?? ms.servicePhoto;
                const isEditing = editingServiceId === ms.serviceId;
                return (
                  <div key={ms.id} className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg overflow-hidden">
                    <div className="flex items-center gap-3 px-3 py-3 cursor-pointer hover:bg-[var(--color-bg-subtle)] transition-colors"
                      onClick={() => isEditing ? closeEditService() : openEditService(ms)}>
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-[var(--color-bg-subtle)] shrink-0">
                        <img src={resolveMediaUrl(effectivePhoto)} alt={ms.serviceName}
                          className="w-full h-full object-cover"
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--color-text)]">{ms.serviceName}</p>
                        <p className="text-xs text-[var(--color-text-secondary)]">{ms.durationMinutes} min · {ms.price.toLocaleString()} ₾</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); isEditing ? closeEditService() : openEditService(ms); }}>
                          {isEditing ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); removeServiceMutation.mutate(ms.serviceId); }}>
                          <Trash2 className="w-4 h-4 text-[var(--color-error)]" />
                        </Button>
                      </div>
                    </div>

                    {isEditing && (
                      <div className="border-t border-[var(--color-divider)] bg-[var(--color-surface)] p-4 space-y-3">
                        <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                          <div className="flex-1 space-y-2">
                            <p className="text-xs text-[var(--color-info-text)]">{t('admin.userDetail.defaultPhoto')}</p>
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-[var(--color-bg-subtle)] border border-blue-200">
                              <ImageWithFallback src={ms.servicePhoto} alt="default" className="w-full h-full object-cover" />
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium text-[var(--color-text-secondary)]">{t('admin.userDetail.customPhotoOptional')}</p>
                          {(editPhotoKeys.length > 0 || (ms.photo && !clearPhoto)) && (
                            <button type="button" onClick={() => { setEditPhotoKeys([]); setClearPhoto(true); }}
                              className="text-xs text-[var(--color-error)] hover:text-[var(--color-error-text)]">{t('admin.userDetail.resetToDefault')}</button>
                          )}
                        </div>
                        <DragDropUpload folder="master-services" accept="image" maxFiles={1}
                          values={clearPhoto ? [] : editPhotoKeys}
                          onChange={keys => { setEditPhotoKeys(keys); setClearPhoto(keys.length === 0); }} />
                        <textarea value={editSvcDesc} onChange={e => setEditSvcDesc(e.target.value)} maxLength={300} rows={2}
                          placeholder={t('admin.userDetail.descriptionOptional')}
                          className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--color-primary)] resize-none" />
                        <div className="grid grid-cols-3 gap-3">
                          <input type="number" placeholder={t('admin.userDetail.price')} value={editPrice} onChange={e => setEditPrice(e.target.value)}
                            className="px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--color-primary)]" />
                          <input type="number" placeholder={t('admin.userDetail.durationMin')} value={editDuration} onChange={e => setEditDuration(e.target.value)}
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

            {/* Add service */}
            <div className="bg-[var(--color-bg)] rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium text-[var(--color-text)]">{t('admin.userDetail.addService')}</p>
              <select value={addServiceId} onChange={e => { setAddServiceId(e.target.value); setAddPhotoKeys([]); }}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--color-primary)] bg-[var(--color-surface)]">
                <option value="">{t('admin.userDetail.selectService')}</option>
                {catalog.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>

              {addServiceId && (() => {
                const defaultPhoto = catalog.find(s => s.id === addServiceId)?.photo;
                return (
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                      <div className="space-y-1">
                        <p className="text-xs text-[var(--color-info-text)]">{t('admin.userDetail.defaultPhoto')}</p>
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-[var(--color-bg-subtle)] border border-blue-200">
                          <ImageWithFallback src={defaultPhoto} alt="default" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    </div>
                    <p className="text-xs font-medium text-[var(--color-text-secondary)]">{t('admin.userDetail.customPhotoOptional')}</p>
                    <DragDropUpload folder="master-services" accept="image" maxFiles={1} values={addPhotoKeys} onChange={setAddPhotoKeys} />
                  </div>
                );
              })()}

              <textarea value={addSvcDesc} onChange={e => setAddSvcDesc(e.target.value)} maxLength={300} rows={2}
                placeholder={t('admin.userDetail.descriptionOptional')}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--color-primary)] resize-none" />
              <div className="grid grid-cols-3 gap-3">
                <input type="number" placeholder={t('admin.userDetail.price')} value={addPrice} onChange={e => setAddPrice(e.target.value)}
                  className="px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--color-primary)]" />
                <input type="number" placeholder={t('admin.userDetail.durationMin')} value={addDuration} onChange={e => setAddDuration(e.target.value)}
                  className="px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--color-primary)]" />
                <Button size="sm" disabled={!addServiceId || !addPrice || !addDuration} loading={addServiceMutation.isPending}
                  onClick={() => addServiceMutation.mutate()}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20" />
    </div>
  );
}
