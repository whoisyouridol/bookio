import { MapPin, Clock } from 'lucide-react';
import { Link } from 'react-router';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import type { SalonDto } from '@/types';

export function SalonCard({ salon }: { salon: SalonDto }) {
  const workingDaysShort = salon.workingDays
    .map(d => d.slice(0, 3))
    .join(', ');

  return (
    <Link
      to={`/salon/${salon.id}`}
      className="block bg-[var(--color-surface)] rounded-[var(--border-radius)] overflow-hidden shadow-sm border border-[var(--color-border)] hover:shadow-md transition-shadow"
    >
      <div className="relative h-48 bg-gray-100">
        <ImageWithFallback
          src={salon.photos[0]}
          alt={salon.name}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-lg text-[var(--color-text)] mb-2">{salon.name}</h3>

        <div className="flex items-start text-sm text-[var(--color-text-secondary)] mb-2 gap-1.5">
          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span className="line-clamp-1">{salon.address}</span>
        </div>

        <div className="flex items-center text-sm text-[var(--color-text-secondary)] gap-1.5">
          <Clock className="w-4 h-4 flex-shrink-0" />
          <span>{salon.workingHoursStart.slice(0, 5)} – {salon.workingHoursEnd.slice(0, 5)}</span>
          <span className="mx-1 text-[var(--color-border)]">·</span>
          <span className="truncate">{workingDaysShort}</span>
        </div>
      </div>
    </Link>
  );
}
