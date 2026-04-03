import { useState, useEffect } from 'react';
import { Clock, Check, Info, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { resolveMediaUrl } from '@/api/media';
import type { MasterServiceDto } from '@/types';

interface ServiceCardProps {
  service: MasterServiceDto;
  servicePhoto?: string;
  selected?: boolean;
  onToggle?: () => void;
}

export function ServiceCard({ service, servicePhoto, selected = false, onToggle }: ServiceCardProps) {
  const { t } = useTranslation();
  const [sheetMounted, setSheetMounted] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
  const effectivePhoto = service.photo ?? servicePhoto;
  const hasDescription = !!service.description;

  const openSheet = () => {
    setSheetMounted(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setSheetVisible(true)));
  };

  const closeSheet = () => {
    setSheetVisible(false);
    setTimeout(() => setSheetMounted(false), 300);
  };

  const handleCardClick = () => {
    if (window.matchMedia('(max-width: 767px)').matches) {
      openSheet();
    } else {
      onToggle?.();
    }
  };

  const handleAdd = () => {
    onToggle?.();
    closeSheet();
  };

  useEffect(() => {
    if (!sheetMounted) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeSheet(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sheetMounted]);

  return (
    <>
      <button
        type="button"
        onClick={handleCardClick}
        className={`relative flex flex-col text-left w-full p-3 border-2 rounded-[var(--radius-lg)] transition-all ${
          selected
            ? 'border-[var(--color-selection-border)] bg-[var(--color-selection)]'
            : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-strong)]'
        }`}
      >
        {selected && (
          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
            <Check className="w-3 h-3 text-[var(--color-primary-text)]" />
          </div>
        )}

        <div className="relative h-20 bg-[var(--color-bg-subtle)] overflow-hidden mb-3 rounded-[var(--radius-md)]">
          <ImageWithFallback
            src={effectivePhoto}
            alt={service.serviceName}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex items-start justify-between gap-1 mb-1">
          <h4 className="font-medium text-sm text-[var(--color-text)] line-clamp-1 flex-1">{service.serviceName}</h4>

          {hasDescription && (
            <div className="relative group shrink-0 -mt-0.5 hidden md:block">
              <Info className="w-3.5 h-3.5 text-[var(--color-text-secondary)]" />
              <div className="absolute bottom-full right-0 mb-2 w-52 bg-[var(--color-surface-raised)] text-[var(--color-text)] text-xs rounded-[var(--radius-md)] p-2.5 leading-relaxed
                              opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-[var(--shadow-lg)] border border-[var(--color-border)]">
                {service.description}
              </div>
            </div>
          )}
        </div>

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

      {/* Mobile bottom sheet */}
      {sheetMounted && (
        <div
          className={`fixed inset-0 z-50 flex items-end md:hidden transition-opacity duration-300 ${sheetVisible ? 'opacity-100' : 'opacity-0'}`}
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={closeSheet}
        >
          <div
            className={`bg-[var(--color-surface)] rounded-t-[var(--radius-xl)] w-full shadow-[var(--shadow-xl)] transition-transform duration-300 ease-out ${sheetVisible ? 'translate-y-0' : 'translate-y-full'}`}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-[var(--color-border)]" />
            </div>

            <div className="relative h-64 bg-[var(--color-bg-subtle)] overflow-hidden">
              <img
                src={resolveMediaUrl(effectivePhoto) ?? ''}
                alt={service.serviceName}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={closeSheet}
                className="absolute top-3 right-3 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 pt-4 pb-8 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-semibold text-[var(--color-text)] leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>
                  {service.serviceName}
                </h3>
                <div className="text-right shrink-0">
                  <p className="font-bold text-[var(--color-primary)]">{service.price.toLocaleString()} ₾</p>
                  <div className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)] justify-end mt-0.5">
                    <Clock className="w-3 h-3" />
                    <span>{service.durationMinutes} min</span>
                  </div>
                </div>
              </div>

              {hasDescription && (
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{service.description}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeSheet}
                  className="flex-1 py-3.5 rounded-[var(--radius-lg)] border-2 border-[var(--color-border)] text-sm font-semibold text-[var(--color-text)] hover:bg-[var(--color-hover)] transition-colors"
                >
                  {t('components.serviceCard.back')}
                </button>
                <button
                  type="button"
                  onClick={handleAdd}
                  className="flex-1 py-3.5 rounded-[var(--radius-lg)] text-sm font-semibold text-[var(--color-primary-text)] bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] transition-colors"
                >
                  {selected ? t('components.serviceCard.remove') : t('components.serviceCard.addToBooking')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
