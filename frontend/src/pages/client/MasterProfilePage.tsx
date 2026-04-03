import { useParams, useNavigate } from 'react-router';
import { Star, Phone } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getMaster, getMasterServices, getMasterRatings } from '@/api/masters';
import { Header } from '@/components/Header';
import { ServiceCard } from '@/components/booking/ServiceCard';
import { ReviewCard } from '@/components/master/ReviewCard';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { useBooking } from '@/contexts/BookingContext';
import { useSalonId } from '@/hooks/useSalonId';
import { isOnSubdomain } from '@/lib/subdomain';
import type { MasterServiceDto } from '@/types';

export default function MasterProfilePage() {
  const { t } = useTranslation();
  const { masterId } = useParams<{ masterId: string }>();
  const salonId = useSalonId();
  const navigate = useNavigate();
  const booking = useBooking();
  const { setSalon, setMaster, toggleService, selectedServices, totalPrice, totalDuration } = booking;

  const { data: master, isLoading: loadingMaster } = useQuery({
    queryKey: ['master', masterId],
    queryFn: () => getMaster(masterId!),
    enabled: !!masterId,
  });

  const { data: services, isLoading: loadingServices } = useQuery({
    queryKey: ['masterServices', masterId],
    queryFn: () => getMasterServices(masterId!),
    enabled: !!masterId,
  });

  const { data: ratings } = useQuery({
    queryKey: ['masterRatings', masterId],
    queryFn: () => getMasterRatings(masterId!),
    enabled: !!masterId,
  });

  const activeServices = services?.filter(s => s.isActive) ?? [];
  const recentRatings = ratings?.slice(0, 3) ?? [];

  const handleToggle = (service: MasterServiceDto) => {
    if (!salonId || !master) return;
    // Only reset context when switching to a different master; otherwise just toggle
    if (booking.masterId !== masterId) {
      setSalon(salonId, '');
      setMaster(masterId!, `${master.firstName} ${master.lastName}`);
    }
    toggleService(service);
  };

  const handleBook = () => {
    navigate(isOnSubdomain() ? `/master/${masterId}/book` : `/salon/${salonId}/master/${masterId}/book`);
  };

  if (loadingMaster) return <Loader />;
  if (!master) return <div className="p-4 text-center text-[var(--color-text-secondary)]">{t('errors.masterNotFound')}</div>;

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Header title={t('master.title')} showBack />

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Master info */}
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] p-5 shadow-[var(--shadow-sm)] border border-[var(--color-border)]">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-[var(--color-bg-subtle)] flex-shrink-0">
              <ImageWithFallback
                src={master.photo}
                alt={`${master.firstName} ${master.lastName}`}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-[var(--color-text)] mb-1">
                {master.firstName} {master.lastName}
              </h2>
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-4 h-4 fill-[var(--color-warning)] text-[var(--color-warning)]" />
                <span className="font-medium text-[var(--color-text)]">
                  {master.averageRating ? master.averageRating.toFixed(1) : '—'}
                </span>
                <span className="text-sm text-[var(--color-text-secondary)]">({master.ratingCount} {t('master.reviews')})</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                <Phone className="w-3.5 h-3.5" />
                <span>{master.phone}</span>
              </div>
            </div>
          </div>
          {master.description && (
            <p className="text-sm text-[var(--color-text-secondary)]">{master.description}</p>
          )}
        </div>

        {/* Services */}
        <div>
          <h3 className="text-lg font-semibold mb-3 text-[var(--color-text)]">{t('master.services')}</h3>
          {loadingServices ? (
            <Loader />
          ) : activeServices.length === 0 ? (
            <p className="text-sm text-[var(--color-text-secondary)]">{t('master.noServicesListed')}</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {activeServices.map(service => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  servicePhoto={service.servicePhoto}
                  selected={selectedServices.some(s => s.id === service.id)}
                  onToggle={() => handleToggle(service)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Reviews */}
        {recentRatings.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3 text-[var(--color-text)]">{t('master.reviewsSection')}</h3>
            <div className="space-y-3">
              {recentRatings.map(r => (
                <ReviewCard key={r.id} rating={r} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky booking bar */}
      {selectedServices.length > 0 && (
        <div className="fixed bottom-16 left-0 right-0 z-20">
          <div className="max-w-md mx-auto px-4">
            <div
              className="bg-[var(--color-surface)] shadow-[var(--shadow-lg)] border border-[var(--color-border)] p-4 flex items-center justify-between gap-4 rounded-[var(--radius-lg)]"
            >
              <div>
                <p className="text-xs text-[var(--color-text-secondary)]">{totalDuration} min</p>
                <p className="font-semibold text-lg text-[var(--color-primary)]">{totalPrice.toLocaleString()} ₾</p>
              </div>
              <Button onClick={handleBook} size="lg" className="flex-1">
                {t('master.continueWithCount', { count: selectedServices.length })}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
