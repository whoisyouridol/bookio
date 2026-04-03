import { Star } from 'lucide-react';
import { format } from 'date-fns';
import type { RatingDto } from '@/types';

export function ReviewCard({ rating }: { rating: RatingDto }) {
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-sm text-[var(--color-text)]">{rating.clientName}</span>
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-3.5 h-3.5 ${i < rating.rating ? 'fill-[var(--color-warning)] text-[var(--color-warning)]' : 'text-[var(--color-border)]'}`}
            />
          ))}
        </div>
      </div>
      {rating.comment && (
        <p className="text-sm text-[var(--color-text-secondary)] mb-2">{rating.comment}</p>
      )}
      <p className="text-xs text-[var(--color-text-tertiary)]">
        {format(new Date(rating.createdAt), 'MMM d, yyyy')}
      </p>
    </div>
  );
}
