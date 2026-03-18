import { MapPin, Clock, Calendar, ExternalLink } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getMasters } from '@/api/masters';
import { MasterCard } from '@/components/master/MasterCard';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { InfoRow } from '@/components/ui/InfoRow';
import { Loader } from '@/components/ui/Loader';
import { useSalonSubdomain } from '@/contexts/SalonSubdomainContext';

export default function SalonLandingPage() {
  const { salon, salonId } = useSalonSubdomain();

  const { data: allMasters, isLoading: loadingMasters } = useQuery({
    queryKey: ['masters'],
    queryFn: getMasters,
  });

  const linkedMasterIds = new Set(salon.masters.map(sm => sm.masterId));
  const masters = allMasters?.filter(m => linkedMasterIds.has(m.id)) ?? [];

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      {/* Hero */}
      <div className="max-w-md mx-auto">
        <div className="relative h-56 bg-gray-100">
          {salon.logoUrl ? (
            <ImageWithFallback src={salon.logoUrl} alt={salon.name} className="w-full h-full object-cover" />
          ) : salon.photos[0] ? (
            <ImageWithFallback src={salon.photos[0]} alt={salon.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)]">
              <h1 className="text-3xl font-bold text-white">{salon.name}</h1>
            </div>
          )}
        </div>

        <div className="px-4 py-6 space-y-6">
          <h1 className="text-2xl font-bold text-[var(--color-text)]">{salon.name}</h1>

          {/* Info card */}
          <div
            className="bg-[var(--color-surface)] p-4 shadow-sm border border-[var(--color-border)] space-y-3"
            style={{ borderRadius: 'calc(var(--border-radius) * 1.2)' }}
          >
            <InfoRow icon={<MapPin className="w-5 h-5" />} label="Address" value={salon.address} />
            <InfoRow
              icon={<Clock className="w-5 h-5" />}
              label="Working Hours"
              value={`${salon.workingHoursStart.slice(0, 5)} – ${salon.workingHoursEnd.slice(0, 5)}`}
            />
            <InfoRow
              icon={<Calendar className="w-5 h-5" />}
              label="Working Days"
              value={salon.workingDays.join(', ')}
            />
            {(salon.googleMapsUrl || salon.yandexMapsUrl) && (
              <div className="flex gap-3 pt-1">
                {salon.googleMapsUrl && (
                  <a href={salon.googleMapsUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-[var(--color-primary)] font-medium">
                    <ExternalLink className="w-3.5 h-3.5" /> Google Maps
                  </a>
                )}
                {salon.yandexMapsUrl && (
                  <a href={salon.yandexMapsUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-[var(--color-primary)] font-medium">
                    <ExternalLink className="w-3.5 h-3.5" /> Yandex Maps
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Masters */}
          <div>
            <h2 className="text-lg font-semibold mb-3 text-[var(--color-text)]">Our Masters</h2>
            {loadingMasters ? (
              <Loader />
            ) : masters.length === 0 ? (
              <p className="text-sm text-[var(--color-text-secondary)]">No masters available.</p>
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
