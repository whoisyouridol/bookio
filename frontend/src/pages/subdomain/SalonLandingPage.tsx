import { MapPin, Clock, Calendar, ExternalLink } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getMasters } from '@/api/masters';
import { MasterCard } from '@/components/master/MasterCard';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { InfoRow } from '@/components/ui/InfoRow';
import { Loader } from '@/components/ui/Loader';
import { useSalonSubdomain } from '@/contexts/SalonSubdomainContext';
import { GlobalToolbar } from '@/components/GlobalToolbar';

export default function SalonLandingPage() {
  const { t } = useTranslation();
  const { salon, salonId } = useSalonSubdomain();

  const { data: allMasters, isLoading: loadingMasters } = useQuery({
    queryKey: ['masters'],
    queryFn: getMasters,
  });

  const linkedMasterIds = new Set(salon.masters.map(sm => sm.masterId));
  const masters = allMasters?.filter(m => linkedMasterIds.has(m.id)) ?? [];

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Hero */}
      <div className="max-w-md mx-auto">
        <div className="relative h-56 mx-4 mt-4 overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)]">
          {salon.coverPicture ? (
            <ImageWithFallback src={salon.coverPicture} alt={salon.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)]">
              <h1 className="text-3xl font-bold text-white">{salon.name}</h1>
            </div>
          )}
        </div>

        <div className="px-4 py-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-[var(--color-text)]">{salon.name}</h1>
            <GlobalToolbar />
          </div>

          {/* Info card */}
          <div
            className="bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)] border border-[var(--color-border)] space-y-3"
            style={{ borderRadius: 'var(--radius-lg)' }}
          >
            <InfoRow icon={<MapPin className="w-5 h-5" />} label={t('salon.address')} value={salon.address} />
            <InfoRow
              icon={<Clock className="w-5 h-5" />}
              label={t('salon.workingHours')}
              value={`${salon.workingHoursStart.slice(0, 5)} – ${salon.workingHoursEnd.slice(0, 5)}`}
            />
            <InfoRow
              icon={<Calendar className="w-5 h-5" />}
              label={t('salon.workingDays')}
              value={salon.workingDays.join(', ')}
            />
            {salon.googleMapsUrl && (
              <div className="flex gap-3 pt-1">
                <a href={salon.googleMapsUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-[var(--color-primary)] font-medium">
                  <ExternalLink className="w-3.5 h-3.5" /> {t('salon.googleMaps')}
                </a>
              </div>
            )}
          </div>

          {/* Masters */}
          <div>
            <h2 className="text-lg font-semibold mb-3 text-[var(--color-text)]">{t('salon.ourMasters')}</h2>
            {loadingMasters ? (
              <Loader />
            ) : masters.length === 0 ? (
              <p className="text-sm text-[var(--color-text-secondary)]">{t('salon.noMastersAvailable')}</p>
            ) : (
              <div className="space-y-3">
                {masters.map(m => (
                  <MasterCard key={m.id} master={m} salonId={salonId} linkPrefix="" />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
