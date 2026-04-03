import { Star } from 'lucide-react';
import { Link } from 'react-router';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import type { MasterDto } from '@/types';

interface MasterCardProps {
  master: MasterDto;
  salonId: string;
  linkPrefix?: string;
}

export function MasterCard({ master, salonId, linkPrefix }: MasterCardProps) {
  const basePath = linkPrefix !== undefined ? linkPrefix : `/salon/${salonId}`;
  return (
    <Link
      to={`${basePath}/master/${master.id}`}
      className="flex items-center gap-4 p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] hover:shadow-[var(--shadow-md)] transition-all"
    >
      <div className="w-16 h-16 rounded-full overflow-hidden bg-[var(--color-bg-subtle)] flex-shrink-0">
        <ImageWithFallback
          src={master.photo}
          alt={`${master.firstName} ${master.lastName}`}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-base text-[var(--color-text)] mb-0.5" style={{ fontFamily: 'var(--font-heading)' }}>
          {master.firstName} {master.lastName}
        </h3>
        {master.description && (
          <p className="text-sm text-[var(--color-text-secondary)] line-clamp-1 mb-1.5">
            {master.description}
          </p>
        )}
        <div className="flex items-center gap-1 text-sm">
          <Star className="w-4 h-4 fill-[var(--color-warning)] text-[var(--color-warning)]" />
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
