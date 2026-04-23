import { Link } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, MapPin, Clock } from 'lucide-react';
import { getSalons, deleteSalon } from '@/api/salons';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import type { SalonDto } from '@/types';

export default function SalonsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: salons, isLoading } = useQuery({ queryKey: ['salons'], queryFn: getSalons, refetchOnMount: 'always' });

  const deleteMutation = useMutation({
    mutationFn: deleteSalon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salons'] });
      toast.success(t('admin.salons.salonDeleted'));
    },
    onError: () => toast.error(t('admin.salons.failedToDelete')),
  });

  const handleDelete = (salon: SalonDto) => {
    if (confirm(t('admin.salons.deleteConfirm', { name: salon.name }))) {
      deleteMutation.mutate(salon.id);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-text)]">{t('admin.salons.title')}</h1>
        <Link to="/admin/salons/new">
          <Button size="sm"><Plus className="w-4 h-4 mr-1" /> {t('admin.salons.newSalon')}</Button>
        </Link>
      </div>

      {isLoading ? (
        <Loader />
      ) : !salons?.length ? (
        <EmptyState icon={MapPin} title={t('admin.salons.noSalonsYet')} action={
          <Link to="/admin/salons/new"><Button size="sm"><Plus className="w-4 h-4 mr-1" />{t('admin.salons.createFirst')}</Button></Link>
        } />
      ) : (
        <div className="space-y-4">
          {salons.map(salon => (
            <div key={salon.id} className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] overflow-hidden flex">
              <div className="w-24 h-24 shrink-0">
                <ImageWithFallback src={salon.coverPicture} alt={salon.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 p-4 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-[var(--color-text)]">{salon.name}</h3>
                    <div className="flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] mt-1">
                      <MapPin className="w-3.5 h-3.5" />{salon.address}
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] mt-0.5">
                      <Clock className="w-3.5 h-3.5" />
                      {salon.workingHoursStart.slice(0,5)} – {salon.workingHoursEnd.slice(0,5)}
                    </div>
                  </div>
                  <Badge variant={salon.isActive ? 'success' : 'error'}>
                    {salon.isActive ? t('admin.salons.active') : t('admin.salons.inactive')}
                  </Badge>
                </div>
              </div>
              <div className="flex flex-col justify-center gap-2 p-4 shrink-0 border-l border-[var(--color-divider)]">
                <Link to={`/admin/salons/${salon.id}`}>
                  <Button variant="ghost" size="sm"><Edit2 className="w-4 h-4" /></Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(salon)}>
                  <Trash2 className="w-4 h-4 text-[var(--color-error)]" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
