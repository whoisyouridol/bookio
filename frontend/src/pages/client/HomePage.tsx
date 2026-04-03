import { Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getSalons } from '@/api/salons';
import { Header } from '@/components/Header';
import { SalonCard } from '@/components/salon/SalonCard';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/ui/EmptyState';

export default function HomePage() {
  const { t } = useTranslation();
  const { data: salons, isLoading } = useQuery({
    queryKey: ['salons'],
    queryFn: getSalons,
  });

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Header title="BookVisit" />

      <div className="max-w-md mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-[var(--color-primary)]" />
            <h2 className="text-2xl font-bold text-[var(--color-text)]">{t('home.findYourStyle')}</h2>
          </div>
          <p className="text-[var(--color-text-secondary)]">{t('home.bookWithProfessionals')}</p>
        </div>

        {isLoading ? (
          <Loader />
        ) : !salons?.length ? (
          <EmptyState icon={Sparkles} title={t('home.noSalonsYet')} description={t('home.checkBackSoon')} />
        ) : (
          <div className="space-y-4">
            {salons.map(salon => (
              <SalonCard key={salon.id} salon={salon} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
