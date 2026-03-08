import type { TimeSlotDto } from '@/types';

interface TimeSlotGridProps {
  slots: TimeSlotDto[];
  selectedId: string | null;
  onSelect: (slot: TimeSlotDto) => void;
}

export function TimeSlotGrid({ slots, selectedId, onSelect }: TimeSlotGridProps) {
  if (slots.length === 0) {
    return (
      <p className="text-sm text-[var(--color-text-secondary)] text-center py-4">
        No available slots for this date.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-2">
      {slots.map(slot => {
        const available = slot.status === 'Available';
        const selected = selectedId === slot.id;
        return (
          <button
            key={slot.id}
            type="button"
            disabled={!available}
            onClick={() => available && onSelect(slot)}
            className={`py-2 px-1 border-2 text-xs font-medium transition-all ${
              selected
                ? 'border-[var(--color-primary)] bg-purple-50 text-[var(--color-primary)]'
                : available
                ? 'border-[var(--color-border)] text-[var(--color-text)] hover:border-gray-400'
                : 'border-[var(--color-border)] bg-gray-50 text-gray-300 cursor-not-allowed'
            }`}
            style={{ borderRadius: 'var(--border-radius)' }}
          >
            {slot.startTime.slice(0, 5)}
          </button>
        );
      })}
    </div>
  );
}
