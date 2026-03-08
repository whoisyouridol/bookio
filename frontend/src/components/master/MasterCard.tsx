import { Star } from 'lucide-react';
import { Link } from 'react-router';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import type { MasterDto } from '@/types';

interface MasterCardProps {
  master: MasterDto;
  salonId: string;
}

export function MasterCard({ master, salonId }: MasterCardProps) {
  return (
    <Link
      to={`/salon/${salonId}/master/${master.id}`}
      className="flex items-center gap-4 p-4 bg-[var(--color-surface)] border border-[var(--color-border)] hover:shadow-md transition-shadow"
      style={{ borderRadius: 'var(--border-radius)' }}
    >
      <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
        <ImageWithFallback
          src={master.photo}
          alt={`${master.firstName} ${master.lastName}`}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-base text-[var(--color-text)] mb-0.5">
          {master.firstName} {master.lastName}
        </h3>
        {master.description && (
          <p className="text-sm text-[var(--color-text-secondary)] line-clamp-1 mb-1.5">
            {master.description}
          </p>
        )}
        <div className="flex items-center gap-1 text-sm">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          <span className="font-medium text-[var(--color-text)]">
            {master.averageRating ? master.averageRating.toFixed(1) : '—'}
          </span>
          <span className="text-[var(--color-text-secondary)]">({master.ratingCount})</span>
        </div>
      </div>

      <div className="text-[var(--color-primary)] text-sm font-medium">Book →</div>
    </Link>
  );
}
