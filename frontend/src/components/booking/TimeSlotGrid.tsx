import { useTranslation } from 'react-i18next';
import type { TimeSlotDto } from '@/types';

interface TimeSlotGridProps {
  slots: TimeSlotDto[];
  selectedStartTime: string | null;
  onSelect: (slot: TimeSlotDto) => void;
}

export function TimeSlotGrid({ slots, selectedStartTime, onSelect }: TimeSlotGridProps) {
  const { t } = useTranslation();
  if (slots.length === 0) {
    return (
      <p className="text-sm text-[var(--color-text-secondary)] text-center py-4">
        {t('components.timeSlotGrid.noSlotsAvailable')}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-2">
      {slots.map(slot => {
        const available = slot.status === 'Available';
        const selected = selectedStartTime === slot.startTime;
        return (
          <button
            key={`${slot.date}-${slot.startTime}`}
            type="button"
            disabled={!available}
            onClick={() => available && onSelect(slot)}
            className={`py-2 px-1 border-2 text-xs font-medium rounded-[var(--radius-md)] transition-all ${
              selected
                ? 'border-[var(--color-selection-border)] bg-[var(--color-selection)] text-[var(--color-primary)]'
                : available
                ? 'border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-border-strong)]'
                : 'border-[var(--color-border)] bg-[var(--color-bg-subtle)] text-[var(--color-text-tertiary)] cursor-not-allowed'
            }`}
          >
            {slot.startTime.slice(0, 5)}
          </button>
        );
      })}
    </div>
  );
}
