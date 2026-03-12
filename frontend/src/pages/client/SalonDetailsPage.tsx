import { useParams } from 'react-router';
import { MapPin, Clock, Calendar, ExternalLink } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getSalon } from '@/api/salons';
import { getMasters } from '@/api/masters';
import { Header } from '@/components/Header';
import { MasterCard } from '@/components/master/MasterCard';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { InfoRow } from '@/components/ui/InfoRow';
import { Loader } from '@/components/ui/Loader';

export default function SalonDetailsPage() {
  const { salonId } = useParams<{ salonId: string }>();

  const { data: salon, isLoading: loadingSalon } = useQuery({
    queryKey: ['salon', salonId],
    queryFn: () => getSalon(salonId!),
    enabled: !!salonId,
  });

  const { data: allMasters, isLoading: loadingMasters } = useQuery({
    queryKey: ['masters'],
    queryFn: getMasters,
  });

  const linkedMasterIds = new Set(salon?.masters.map(sm => sm.masterId) ?? []);
  const masters = allMasters?.filter(m => linkedMasterIds.has(m.id)) ?? [];

  if (loadingSalon) return <Loader />;
  if (!salon) return <div className="p-4 text-center text-[var(--color-text-secondary)]">Salon not found.</div>;

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Header title={salon.name} showBack />

      <div className="max-w-md mx-auto">
        {/* Hero image */}
        <div className="relative h-56 bg-gray-100">
          <ImageWithFallback
            src={salon.photos[0]}
            alt={salon.name}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="px-4 py-6 space-y-6">
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
                  <MasterCard key={m.id} master={m} salonId={salonId!} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

