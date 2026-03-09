import { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMaster, createMaster, updateMaster, getMasterServices, addMasterService, updateMasterService, removeMasterService } from '@/api/masters';
import { getServices } from '@/api/services';
import { Button } from '@/components/ui/Button';
import { DragDropUpload } from '@/components/ui/DragDropUpload';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { Loader } from '@/components/ui/Loader';
import { resolveMediaUrl } from '@/api/media';
import { toast } from 'sonner';
import { Plus, Trash2, Info, Edit2, Check, X } from 'lucide-react';
import type { MasterServiceDto } from '@/types';
import { useRole } from '@/contexts/RoleContext';

export default function MasterFormPage() {
  const { masterId } = useParams<{ masterId: string }>();
  const isNew = !masterId || masterId === 'new';
  const { role, masterId: ownMasterId } = useRole();

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

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [photoKeys, setPhotoKeys] = useState<string[]>([]);
  const [description, setDescription] = useState('');

  // Add-service form
  const [addServiceId, setAddServiceId] = useState('');
  const [addPrice, setAddPrice] = useState('');
  const [addDuration, setAddDuration] = useState('');
  const [addPhotoKeys, setAddPhotoKeys] = useState<string[]>([]);
  const [addDescription, setAddDescription] = useState('');

  // Edit-service inline state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editDuration, setEditDuration] = useState('');
  const [editPhotoKeys, setEditPhotoKeys] = useState<string[]>([]);
  const [clearPhoto, setClearPhoto] = useState(false);
  const [editDescription, setEditDescription] = useState('');

  useEffect(() => {
    if (existing) {
      setFirstName(existing.firstName);
      setLastName(existing.lastName);
      setPhone(existing.phone);
      setPhotoKeys(existing.photo ? [existing.photo] : []);
      setDescription(existing.description ?? '');
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
      const payload = { firstName, lastName, phone, photo: photoKeys[0] || undefined, description: description || undefined };
      return isNew ? createMaster(payload) : updateMaster(masterId!, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['masters'] });
      toast.success(isNew ? 'Master created!' : 'Master updated!');
      navigate('/admin/masters');
    },
    onError: () => toast.error('Failed to save.'),
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
      toast.success('Service added.');
    },
    onError: () => toast.error('Failed to add service.'),
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
      toast.success('Service updated.');
    },
    onError: () => toast.error('Failed to update service.'),
  });

  const removeServiceMutation = useMutation({
    mutationFn: (serviceId: string) => removeMasterService(masterId!, serviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['masterServices', masterId] });
      toast.success('Service removed.');
    },
  });

  if (!isNew && isLoading) return <Loader />;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">{isNew ? 'New Master' : 'Edit Master'}</h1>

      <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="First Name *" value={firstName} onChange={setFirstName} required />
          <Field label="Last Name *" value={lastName} onChange={setLastName} required />
        </div>
        <Field label="Phone *" value={phone} onChange={setPhone} required />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Photo</label>
          <DragDropUpload folder="masters" accept="image" maxFiles={1} values={photoKeys} onChange={setPhotoKeys} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500 resize-none"
          />
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="secondary" size="lg" onClick={() => navigate(-1)} className="flex-1">Cancel</Button>
          <Button type="submit" size="lg" loading={saveMutation.isPending} className="flex-1">
            {isNew ? 'Create' : 'Save Changes'}
          </Button>
        </div>
      </form>

      {/* Services section (only when editing) */}
      {!isNew && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Services</h2>

          {/* Existing */}
          <div className="space-y-2 mb-4">
            {masterServices?.filter(s => s.isActive).map(ms => {
              const effectivePhoto = ms.photo ?? ms.servicePhoto;
              const isEditing = editingId === ms.serviceId;

              return (
                <div key={ms.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  {/* Row */}
                  <div
                    className="flex items-center gap-3 px-3 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => isEditing ? closeEdit() : openEdit(ms)}
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                      <img
                        src={resolveMediaUrl(effectivePhoto)}
                        alt={ms.serviceName}
                        className="w-full h-full object-cover"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{ms.serviceName}</p>
                      <p className="text-xs text-gray-500">{ms.durationMinutes} min · {ms.price.toLocaleString()} ₾</p>
                      {ms.photo && <p className="text-xs text-purple-600 mt-0.5">Custom photo</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); isEditing ? closeEdit() : openEdit(ms); }}>
                        {isEditing ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); removeServiceMutation.mutate(ms.serviceId); }}>
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    </div>
                  </div>

                  {/* Inline edit form */}
                  {isEditing && (
                    <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-3">
                      <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                        <div className="flex-1 space-y-2">
                          <p className="text-xs text-blue-700">Default service photo:</p>
                          <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 border border-blue-200">
                            <ImageWithFallback src={ms.servicePhoto} alt="default" className="w-full h-full object-cover" />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-gray-600">Custom photo for this master (optional)</p>
                        {(editPhotoKeys.length > 0 || (ms.photo && !clearPhoto)) && (
                          <button
                            type="button"
                            onClick={() => { setEditPhotoKeys([]); setClearPhoto(true); }}
                            className="text-xs text-red-500 hover:text-red-700"
                          >
                            Reset to default
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
                          <p className="text-xs font-medium text-gray-600">Description (optional)</p>
                          <span className="text-xs text-gray-400">{editDescription.length}/300</span>
                        </div>
                        <textarea
                          value={editDescription}
                          onChange={e => setEditDescription(e.target.value)}
                          maxLength={300}
                          rows={2}
                          placeholder="e.g. Includes wash, cut and blow-dry…"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500 resize-none"
                        />
                      </div>
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

          {/* Add new */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <p className="text-sm font-medium text-gray-700">Add Service</p>
            <select
              value={addServiceId}
              onChange={e => { setAddServiceId(e.target.value); setAddPhotoKeys([]); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500 bg-white"
            >
              <option value="">Select service…</option>
              {catalog?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>

            {addServiceId && (() => {
              const defaultPhoto = catalog?.find(s => s.id === addServiceId)?.photo;
              return (
                <div className="space-y-2">
                  <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <p className="text-xs text-blue-700">
                        If no photo is uploaded, the default service photo will be used:
                      </p>
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 border border-blue-200">
                        <ImageWithFallback src={defaultPhoto} alt="default" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  </div>
                  <p className="text-xs font-medium text-gray-600">Custom photo for this master (optional)</p>
                  <DragDropUpload folder="master-services" accept="image" maxFiles={1} values={addPhotoKeys} onChange={setAddPhotoKeys} />
                </div>
              );
            })()}

            <div>
              <div className="flex justify-between mb-1">
                <p className="text-xs font-medium text-gray-600">Description (optional)</p>
                <span className="text-xs text-gray-400">{addDescription.length}/300</span>
              </div>
              <textarea
                value={addDescription}
                onChange={e => setAddDescription(e.target.value)}
                maxLength={300}
                rows={2}
                placeholder="e.g. Includes wash, cut and blow-dry…"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>
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
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, required = false }: {
  label: string; value: string; onChange: (v: string) => void; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} required={required}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500" />
    </div>
  );
}
