import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMaster, createMaster, updateMaster, getMasterServices, addMasterService, removeMasterService } from '@/api/masters';
import { getServices } from '@/api/services';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

export default function MasterFormPage() {
  const { masterId } = useParams<{ masterId: string }>();
  const isNew = !masterId || masterId === 'new';
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
  const [photo, setPhoto] = useState('');
  const [description, setDescription] = useState('');

  // Add-service form
  const [addServiceId, setAddServiceId] = useState('');
  const [addPrice, setAddPrice] = useState('');
  const [addDuration, setAddDuration] = useState('');

  useEffect(() => {
    if (existing) {
      setFirstName(existing.firstName);
      setLastName(existing.lastName);
      setPhone(existing.phone);
      setPhoto(existing.photo ?? '');
      setDescription(existing.description ?? '');
    }
  }, [existing]);

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = { firstName, lastName, phone, photo: photo || undefined, description: description || undefined };
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
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['masterServices', masterId] });
      setAddServiceId(''); setAddPrice(''); setAddDuration('');
      toast.success('Service added.');
    },
    onError: () => toast.error('Failed to add service.'),
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
        <Field label="Photo URL" value={photo} onChange={setPhoto} />
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
            {masterServices?.filter(s => s.isActive).map(ms => (
              <div key={ms.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{ms.serviceName}</p>
                  <p className="text-xs text-gray-500">{ms.durationMinutes} min · {ms.price.toLocaleString()} ₽</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeServiceMutation.mutate(ms.serviceId)}>
                  <Trash2 className="w-4 h-4 text-red-400" />
                </Button>
              </div>
            ))}
          </div>

          {/* Add new */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <p className="text-sm font-medium text-gray-700">Add Service</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-3">
                <select
                  value={addServiceId}
                  onChange={e => setAddServiceId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500 bg-white"
                >
                  <option value="">Select service…</option>
                  {catalog?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <input type="number" placeholder="Price ₽" value={addPrice} onChange={e => setAddPrice(e.target.value)}
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
