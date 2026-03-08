import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Scissors } from 'lucide-react';
import { getServices, createService, updateService, deleteService } from '@/api/services';
import { Button } from '@/components/ui/Button';
import { DragDropUpload } from '@/components/ui/DragDropUpload';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { toast } from 'sonner';
import type { ServiceDto } from '@/types';

export default function ServicesPage() {
  const queryClient = useQueryClient();
  const { data: services, isLoading } = useQuery({ queryKey: ['services'], queryFn: getServices });

  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<ServiceDto | null>(null);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [photoKeys, setPhotoKeys] = useState<string[]>([]);

  const openCreate = () => { setEditing(null); setName(''); setDesc(''); setPhotoKeys([]); setModal(true); };
  const openEdit = (s: ServiceDto) => { setEditing(s); setName(s.name); setDesc(s.description ?? ''); setPhotoKeys(s.photo ? [s.photo] : []); setModal(true); };

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = { name, description: desc || undefined, photo: photoKeys[0] || undefined };
      return editing ? updateService(editing.id, payload) : createService(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setModal(false);
      toast.success(editing ? 'Service updated.' : 'Service created.');
    },
    onError: () => toast.error('Failed to save.'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteService,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['services'] }); toast.success('Service deleted.'); },
    onError: () => toast.error('Failed to delete.'),
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Service Catalog</h1>
        <Button size="sm" onClick={openCreate}><Plus className="w-4 h-4 mr-1" /> New Service</Button>
      </div>

      {isLoading ? <Loader /> : !services?.length ? (
        <EmptyState icon={Scissors} title="No services yet" action={
          <Button size="sm" onClick={openCreate}><Plus className="w-4 h-4 mr-1" />Add first</Button>
        } />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {services.map(s => (
            <div key={s.id} className="bg-white rounded-xl border border-gray-200 flex items-center gap-3 p-4">
              <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                <ImageWithFallback src={s.photo} alt={s.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{s.name}</p>
                {s.description && <p className="text-sm text-gray-500 line-clamp-1">{s.description}</p>}
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="sm" onClick={() => openEdit(s)}><Edit2 className="w-4 h-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => { if (confirm(`Delete "${s.name}"?`)) deleteMutation.mutate(s.id); }}>
                  <Trash2 className="w-4 h-4 text-red-400" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Service' : 'New Service'}>
        <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Photo</label>
            <DragDropUpload folder="services" accept="image" maxFiles={1} values={photoKeys} onChange={setPhotoKeys} />
          </div>
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" onClick={() => setModal(false)} className="flex-1">Cancel</Button>
            <Button type="submit" loading={saveMutation.isPending} className="flex-1">Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
