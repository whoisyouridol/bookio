import { Clock, Check } from 'lucide-react';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import type { MasterServiceDto } from '@/types';

interface ServiceCardProps {
  service: MasterServiceDto;
  servicePhoto?: string;
  selected?: boolean;
  onToggle?: () => void;
}

export function ServiceCard({ service, servicePhoto, selected = false, onToggle }: ServiceCardProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative flex flex-col text-left w-full p-3 border-2 transition-all ${
        selected
          ? 'border-[var(--color-primary)] bg-purple-50'
          : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-gray-400'
      }`}
      style={{ borderRadius: 'var(--border-radius)' }}
    >
      {selected && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
          <Check className="w-3 h-3 text-white" />
        </div>
      )}

      <div className="relative h-20 bg-gray-100 overflow-hidden mb-3" style={{ borderRadius: 'calc(var(--border-radius) * 0.6)' }}>
        <ImageWithFallback
          src={servicePhoto}
          alt={service.serviceName}
          className="w-full h-full object-cover"
        />
      </div>

      <h4 className="font-medium text-sm text-[var(--color-text)] line-clamp-1 mb-1">{service.serviceName}</h4>

      <div className="flex items-center justify-between mt-auto pt-1">
        <span className="font-semibold text-sm text-[var(--color-primary)]">
          {service.price.toLocaleString()} ₾
        </span>
        <div className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)]">
          <Clock className="w-3 h-3" />
          <span>{service.durationMinutes} min</span>
        </div>
      </div>
    </button>
  );
}
