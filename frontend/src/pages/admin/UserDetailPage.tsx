import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ShieldCheck, ShieldOff, User, Scissors, Info, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { getAdminUser, updateUserProfile, setUserActive, updateUserRole } from '@/api/auth';
import { getMaster, getMasterServices, updateMaster, addMasterService, updateMasterService, removeMasterService } from '@/api/masters';
import { getServices } from '@/api/services';
import { getSalons } from '@/api/salons';
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

const ROLES = ['Client', 'Master', 'SalonAdmin', 'SuperAdmin'];
const ROLE_LABELS: Record<string, string> = {
  SuperAdmin: 'Super Admin',
  SalonAdmin: 'Salon Admin',
  Master: 'Master',
  Client: 'Client',
};

export default function UserDetailPage() {
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

  const { data: salons = [] } = useQuery({
    queryKey: ['salons-public'],
    queryFn: getSalons,
  });

  // ── Account form state ─────────────────────────────────────────────────────
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [salonId, setSalonId] = useState('');
  const [masterId, setMasterId] = useState('');

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName ?? '');
      setLastName(user.lastName ?? '');
      setPhone(user.phone ?? '');
      setEmail(user.email);
      setRole(user.role);
      setSalonId(user.salonId ?? '');
      setMasterId(user.masterId ?? '');
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
      toast.success('Profile updated');
    },
    onError: err => toast.error(getErrorMessage(err)),
  });

  const updateRoleMutation = useMutation({
    mutationFn: () => updateUserRole(userId!, { role, salonId: salonId || undefined, masterId: masterId || undefined }),
    onSuccess: updated => {
      queryClient.setQueryData(['admin-user', userId], updated);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Role updated');
    },
    onError: err => toast.error(getErrorMessage(err)),
  });

  const activateMutation = useMutation({
    mutationFn: (isActive: boolean) => setUserActive(userId!, isActive),
    onSuccess: updated => {
      queryClient.setQueryData(['admin-user', userId], updated);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(updated.isActive ? 'User activated' : 'User deactivated');
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
      toast.success('Master profile updated');
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
      toast.success('Service added');
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
      toast.success('Service updated');
    },
    onError: err => toast.error(getErrorMessage(err)),
  });

  const removeServiceMutation = useMutation({
    mutationFn: (serviceId: string) => removeMasterService(user!.masterId!, serviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['masterServices', user?.masterId] });
      toast.success('Service removed');
    },
  });

  if (isLoading) return <Loader />;
  if (!user) return <div className="p-6 text-gray-500">Account not found.</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/admin/users')} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">
            {user.firstName || user.lastName ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() : user.email}
          </h1>
          <p className="text-sm text-gray-400">{user.email}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={user.isActive ? 'success' : 'warning'}>{user.isActive ? 'Active' : 'Pending'}</Badge>
          <button
            onClick={() => activateMutation.mutate(!user.isActive)}
            disabled={activateMutation.isPending}
            title={user.isActive ? 'Deactivate' : 'Activate'}
            className={`p-2 rounded-lg transition-colors ${user.isActive ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
          >
            {user.isActive ? <ShieldCheck className="w-5 h-5" /> : <ShieldOff className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setTab('account')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === 'account' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <User className="w-4 h-4" /> Account
        </button>
        {hasMaster && (
          <button
            onClick={() => setTab('master')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === 'master' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Scissors className="w-4 h-4" /> Master Profile
          </button>
        )}
      </div>

      {/* ── Account tab ───────────────────────────────────────────────────────── */}
      {tab === 'account' && (
        <div className="space-y-6">
          <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Profile</h2>
            <div className="grid grid-cols-2 gap-4">
              <Field label="First Name" value={firstName} onChange={setFirstName} />
              <Field label="Last Name" value={lastName} onChange={setLastName} />
            </div>
            <Field label="Email" value={email} onChange={setEmail} type="email" />
            <Field label="Phone" value={phone} onChange={setPhone} type="tel" />
            {user.externalProvider && (
              <p className="text-xs text-gray-400">
                Linked via <span className="font-medium">{user.externalProvider}</span> — password login not available
              </p>
            )}
            <Button onClick={() => updateProfileMutation.mutate()} loading={updateProfileMutation.isPending} size="sm">
              Save Profile
            </Button>
          </section>

          <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Role & Links</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
              <select value={role} onChange={e => setRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white">
                {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r] ?? r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Salon</label>
              <select value={salonId} onChange={e => setSalonId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white">
                <option value="">— None —</option>
                {salons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Master ID</label>
              <input type="text" value={masterId} onChange={e => setMasterId(e.target.value)}
                placeholder="UUID of linked master record"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono" />
            </div>
            <Button onClick={() => updateRoleMutation.mutate()} loading={updateRoleMutation.isPending} size="sm" variant="secondary">
              Save Role & Links
            </Button>
          </section>

          <section className="bg-gray-50 rounded-xl border border-gray-100 p-4 text-xs text-gray-400 space-y-1">
            <p><span className="font-medium text-gray-500">User ID:</span> {user.id}</p>
            <p><span className="font-medium text-gray-500">Created:</span> {new Date(user.createdAt).toLocaleString()}</p>
          </section>
        </div>
      )}

      {/* ── Master Profile tab ────────────────────────────────────────────────── */}
      {tab === 'master' && hasMaster && (
        <div className="space-y-6">
          {/* Master profile fields */}
          <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Master Profile</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Photo</label>
              <DragDropUpload folder="masters" accept="image" maxFiles={1} values={masterPhotoKeys} onChange={setMasterPhotoKeys} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
              <textarea
                value={masterDescription}
                onChange={e => setMasterDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={masterAutoApprove} onChange={e => setMasterAutoApprove(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
              <span>
                <span className="text-sm font-medium text-gray-700">Auto-approve bookings</span>
                <span className="block text-xs text-gray-500 mt-0.5">
                  {masterAutoApprove ? 'New bookings are confirmed automatically.' : 'New bookings require manual approval.'}
                </span>
              </span>
            </label>

            <Button onClick={() => updateMasterMutation.mutate()} loading={updateMasterMutation.isPending} size="sm">
              Save Profile
            </Button>
          </section>

          {/* Services */}
          <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Services</h2>

            <div className="space-y-2">
              {masterServices?.filter(s => s.isActive).map(ms => {
                const effectivePhoto = ms.photo ?? ms.servicePhoto;
                const isEditing = editingServiceId === ms.serviceId;
                return (
                  <div key={ms.id} className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                    <div className="flex items-center gap-3 px-3 py-3 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => isEditing ? closeEditService() : openEditService(ms)}>
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                        <img src={resolveMediaUrl(effectivePhoto)} alt={ms.serviceName}
                          className="w-full h-full object-cover"
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{ms.serviceName}</p>
                        <p className="text-xs text-gray-500">{ms.durationMinutes} min · {ms.price.toLocaleString()} ₾</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); isEditing ? closeEditService() : openEditService(ms); }}>
                          {isEditing ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); removeServiceMutation.mutate(ms.serviceId); }}>
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </Button>
                      </div>
                    </div>

                    {isEditing && (
                      <div className="border-t border-gray-100 bg-white p-4 space-y-3">
                        <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                          <div className="flex-1 space-y-2">
                            <p className="text-xs text-blue-700">Default service photo:</p>
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 border border-blue-200">
                              <ImageWithFallback src={ms.servicePhoto} alt="default" className="w-full h-full object-cover" />
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium text-gray-600">Custom photo (optional)</p>
                          {(editPhotoKeys.length > 0 || (ms.photo && !clearPhoto)) && (
                            <button type="button" onClick={() => { setEditPhotoKeys([]); setClearPhoto(true); }}
                              className="text-xs text-red-500 hover:text-red-700">Reset to default</button>
                          )}
                        </div>
                        <DragDropUpload folder="master-services" accept="image" maxFiles={1}
                          values={clearPhoto ? [] : editPhotoKeys}
                          onChange={keys => { setEditPhotoKeys(keys); setClearPhoto(keys.length === 0); }} />
                        <textarea value={editSvcDesc} onChange={e => setEditSvcDesc(e.target.value)} maxLength={300} rows={2}
                          placeholder="Description (optional)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500 resize-none" />
                        <div className="grid grid-cols-3 gap-3">
                          <input type="number" placeholder="Price ₾" value={editPrice} onChange={e => setEditPrice(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500" />
                          <input type="number" placeholder="Duration min" value={editDuration} onChange={e => setEditDuration(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500" />
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
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium text-gray-700">Add Service</p>
              <select value={addServiceId} onChange={e => { setAddServiceId(e.target.value); setAddPhotoKeys([]); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500 bg-white">
                <option value="">Select service…</option>
                {catalog.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>

              {addServiceId && (() => {
                const defaultPhoto = catalog.find(s => s.id === addServiceId)?.photo;
                return (
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                      <div className="space-y-1">
                        <p className="text-xs text-blue-700">Default photo:</p>
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 border border-blue-200">
                          <ImageWithFallback src={defaultPhoto} alt="default" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    </div>
                    <p className="text-xs font-medium text-gray-600">Custom photo (optional)</p>
                    <DragDropUpload folder="master-services" accept="image" maxFiles={1} values={addPhotoKeys} onChange={setAddPhotoKeys} />
                  </div>
                );
              })()}

              <textarea value={addSvcDesc} onChange={e => setAddSvcDesc(e.target.value)} maxLength={300} rows={2}
                placeholder="Description (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500 resize-none" />
              <div className="grid grid-cols-3 gap-3">
                <input type="number" placeholder="Price ₾" value={addPrice} onChange={e => setAddPrice(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500" />
                <input type="number" placeholder="Duration min" value={addDuration} onChange={e => setAddDuration(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500" />
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
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
    </div>
  );
}
