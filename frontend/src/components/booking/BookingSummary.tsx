import { Calendar, Clock, MapPin, User } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import type { MasterServiceDto } from '@/types';

interface BookingSummaryProps {
  salonName: string;
  salonAddress?: string;
  masterName: string;
  selectedDate: string;
  startTime: string;
  selectedServices: MasterServiceDto[];
  totalPrice: number;
  totalDuration: number;
}

export function BookingSummary({
  salonName,
  salonAddress,
  masterName,
  selectedDate,
  startTime,
  selectedServices,
  totalPrice,
  totalDuration,
}: BookingSummaryProps) {
  const { t } = useTranslation();
  const dateLabel = format(new Date(selectedDate), 'EEEE, MMM d, yyyy');

  return (
    <div
      className="bg-[var(--color-surface)] border border-[var(--color-border)] divide-y divide-[var(--color-border)]"
      style={{ borderRadius: 'var(--border-radius)' }}
    >
      <div className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <MapPin className="w-4 h-4 text-[var(--color-text-secondary)] mt-0.5" />
          <div>
            <p className="font-medium text-sm text-[var(--color-text)]">{salonName}</p>
            {salonAddress && <p className="text-xs text-[var(--color-text-secondary)]">{salonAddress}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <User className="w-4 h-4 text-[var(--color-text-secondary)]" />
          <p className="text-sm text-[var(--color-text)]">{masterName}</p>
        </div>
        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4 text-[var(--color-text-secondary)]" />
          <p className="text-sm text-[var(--color-text)]">{dateLabel}</p>
        </div>
        <div className="flex items-center gap-3">
          <Clock className="w-4 h-4 text-[var(--color-text-secondary)]" />
          <p className="text-sm text-[var(--color-text)]">{startTime.slice(0, 5)}</p>
        </div>
      </div>

      <div className="p-4 space-y-2">
        <p className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide mb-2">{t('components.bookingSummary.services')}</p>
        {selectedServices.map(s => (
          <div key={s.id} className="flex items-center justify-between text-sm">
            <span className="text-[var(--color-text)]">{s.serviceName}</span>
            <span className="text-[var(--color-text-secondary)]">{s.price.toLocaleString()} ₾</span>
          </div>
        ))}
      </div>

      <div className="p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-[var(--color-text-secondary)]">{t('components.bookingSummary.minTotal', { duration: totalDuration })}</p>
          <p className="font-semibold text-lg text-[var(--color-primary)]">{totalPrice.toLocaleString()} ₾</p>
        </div>
      </div>
    </div>
  );
}
