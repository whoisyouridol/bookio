import { Link } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Star, Users } from 'lucide-react';
import { getMasters, deleteMaster } from '@/api/masters';
import { getSalonMasters } from '@/api/salons';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { toast } from 'sonner';
import { useRole } from '@/contexts/RoleContext';
import type { MasterDto } from '@/types';

export default function MastersPage() {
  const queryClient = useQueryClient();
  const { role, salonId } = useRole();

  const { data: masters, isLoading: loadingMasters } = useQuery({
    queryKey: ['masters'],
    queryFn: getMasters,
  });

  // For salon_admin: fetch the master IDs linked to their salon for client-side filtering
  const { data: salonMasters, isLoading: loadingSalonMasters } = useQuery({
    queryKey: ['salonMasters', salonId],
    queryFn: () => getSalonMasters(salonId!),
    enabled: role === 'salon_admin' && !!salonId,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMaster,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['masters'] }); toast.success('Master deleted.'); },
    onError: () => toast.error('Failed to delete.'),
  });

  const handleDelete = (m: MasterDto) => {
    if (confirm(`Delete "${m.firstName} ${m.lastName}"?`)) deleteMutation.mutate(m.id);
  };

  const isLoading = loadingMasters || (role === 'salon_admin' && loadingSalonMasters);

  // Filter masters based on role
  const visibleMasters = (() => {
    if (!masters) return [];
    if (role === 'superadmin') return masters;
    if (role === 'salon_admin' && salonMasters) {
      const allowedIds = new Set(salonMasters.map(sm => sm.masterId));
      return masters.filter(m => allowedIds.has(m.id));
    }
    return masters;
  })();

  const canCreate = role === 'superadmin' || role === 'salon_admin';
  const canDelete = role === 'superadmin';

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Masters</h1>
        {canCreate && (
          <Link to="/admin/masters/new">
            <Button size="sm"><Plus className="w-4 h-4 mr-1" /> New Master</Button>
          </Link>
        )}
      </div>

      {isLoading ? <Loader /> : !visibleMasters.length ? (
        <EmptyState icon={Users} title="No masters yet" action={
          canCreate
            ? <Link to="/admin/masters/new"><Button size="sm"><Plus className="w-4 h-4 mr-1" />Add first</Button></Link>
            : undefined
        } />
      ) : (
        <div className="space-y-3">
          {visibleMasters.map(m => (
            <div key={m.id} className="bg-white rounded-xl border border-gray-200 flex items-center gap-4 p-4">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 shrink-0">
                <ImageWithFallback src={m.photo} alt={`${m.firstName} ${m.lastName}`} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{m.firstName} {m.lastName}</p>
                <p className="text-sm text-gray-500">{m.phone}</p>
                <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                  <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                  {m.averageRating ? m.averageRating.toFixed(1) : '—'}
                  <span className="text-gray-400">({m.ratingCount})</span>
                </div>
              </div>
              <Badge variant={m.isActive ? 'success' : 'error'}>{m.isActive ? 'Active' : 'Inactive'}</Badge>
              <div className="flex gap-1">
                <Link to={`/admin/masters/${m.id}`}>
                  <Button variant="ghost" size="sm"><Edit2 className="w-4 h-4" /></Button>
                </Link>
                {canDelete && (
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(m)}>
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
