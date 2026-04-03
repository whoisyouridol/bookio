import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { format, addDays, startOfDay } from 'date-fns';
import { getSalon } from '@/api/salons';
import { getMaster } from '@/api/masters';
import { getAvailableSlots } from '@/api/timeslots';
import { createBooking } from '@/api/bookings';
import { Header } from '@/components/Header';
import { TimeSlotGrid } from '@/components/booking/TimeSlotGrid';
import { BookingSummary } from '@/components/booking/BookingSummary';
import { Button } from '@/components/ui/Button';
import { DatePicker } from '@/components/ui/DatePicker';
import { FormField } from '@/components/ui/FormField';
import { Loader } from '@/components/ui/Loader';
import { useBooking } from '@/contexts/BookingContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSalonId } from '@/hooks/useSalonId';
import { toast } from 'sonner';
import type { TimeSlotDto } from '@/types';

type Step = 'datetime' | 'details' | 'review';

export default function BookingFlowPage() {
  const { t } = useTranslation();
  const { masterId } = useParams<{ masterId: string }>();
  const salonId = useSalonId();
  const navigate = useNavigate();
  const booking = useBooking();
  const { user } = useAuth();

  const [step, setStep] = useState<Step>('datetime');
  const [selectedDate, setSelectedDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const handleDateChange = (val: string) => {
    // Guard: never allow selecting a past date even if browser doesn't enforce min
    if (val < format(startOfDay(new Date()), 'yyyy-MM-dd')) return;
    setSelectedDate(val);
    setSelectedSlot(null);
  };
  const [selectedSlot, setSelectedSlot] = useState<TimeSlotDto | null>(null);
  const [clientName, setClientName] = useState(
    user ? [user.firstName, user.lastName].filter(Boolean).join(' ') : ''
  );
  const [clientPhone, setClientPhone] = useState(user?.phone ?? '');
  const [clientEmail, setClientEmail] = useState(user?.email ?? '');

  const { data: salon } = useQuery({ queryKey: ['salon', salonId], queryFn: () => getSalon(salonId!), enabled: !!salonId });
  const { data: master } = useQuery({ queryKey: ['master', masterId], queryFn: () => getMaster(masterId!), enabled: !!masterId });

  const serviceIds = booking.selectedServices.map(s => s.serviceId);

  const { data: slots, isLoading: loadingSlots } = useQuery({
    queryKey: ['slots', salonId, masterId, selectedDate, serviceIds],
    queryFn: () => getAvailableSlots(salonId!, masterId!, selectedDate, serviceIds),
    enabled: !!salonId && !!masterId && serviceIds.length > 0,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const created = await createBooking({
        salonId: salonId!,
        masterId: masterId!,
        clientName,
        clientPhone,
        clientEmail: clientEmail || undefined,
        bookingDate: selectedDate,
        startTime: selectedSlot!.startTime,
        serviceIds: serviceIds,
      });
      return created;
    },
    onSuccess: created => {
      booking.reset();
      navigate(`/booking/confirmation/${created.id}`);
    },
    onError: () => toast.error(t('booking.failedToCreate')),
  });

  if (booking.selectedServices.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)]">
        <Header title={t('booking.bookAppointment')} showBack />
        <div className="p-6 text-center text-[var(--color-text-secondary)]">
          {t('booking.noServicesSelected')}
        </div>
      </div>
    );
  }

  const today = startOfDay(new Date());
  const todayStr = format(today, 'yyyy-MM-dd');
  const minDate = todayStr;
  const maxDate = format(addDays(today, 60), 'yyyy-MM-dd');

  // For today, hide slots that have already passed (local time)
  const currentTimeStr = format(new Date(), 'HH:mm');
  const visibleSlots = selectedDate === todayStr
    ? (slots ?? []).filter(s => s.startTime > currentTimeStr)
    : (slots ?? []);

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Header title={t('booking.bookAppointment')} showBack />

      {/* Master quick info */}
      {master && (
        <div className="max-w-md mx-auto px-4 pt-4">
          <div
            className="bg-[var(--color-surface)] p-3 border border-[var(--color-border)] flex items-center gap-3 mb-4"
            style={{ borderRadius: 'var(--radius-lg)' }}
          >
            <div className="flex-1">
              <p className="font-semibold text-sm text-[var(--color-text)]">{master.firstName} {master.lastName}</p>
              {salon && <p className="text-xs text-[var(--color-text-secondary)]">{salon.name}</p>}
            </div>
            <div className="text-right">
              <p className="text-xs text-[var(--color-text-secondary)]">{booking.totalDuration} min</p>
              <p className="font-semibold text-sm text-[var(--color-primary)]">{booking.totalPrice.toLocaleString()} ₾</p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-md mx-auto px-4 pb-8 space-y-6">

        {/* STEP 1: Date & Time */}
        {step === 'datetime' && (
          <>
            <div>
              <DatePicker
                label={t('booking.selectDate')}
                value={selectedDate}
                min={minDate}
                max={maxDate}
                onChange={handleDateChange}
              />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-[var(--color-text)] mb-3">{t('booking.selectTime')}</h2>
              {loadingSlots ? (
                <Loader />
              ) : (
                <TimeSlotGrid
                  slots={visibleSlots}
                  selectedStartTime={selectedSlot?.startTime ?? null}
                  onSelect={setSelectedSlot}
                />
              )}
            </div>

            <Button
              fullWidth
              size="lg"
              disabled={!selectedSlot}
              onClick={() => setStep('details')}
            >
              {t('booking.continue')}
            </Button>
          </>
        )}

        {/* STEP 2: Client Details */}
        {step === 'details' && (
          <>
            <h2 className="text-lg font-semibold text-[var(--color-text)]">{t('booking.yourDetails')}</h2>
            <div
              className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4 space-y-4"
              style={{ borderRadius: 'var(--radius-lg)' }}
            >
              <FormField label={t('booking.fullName')} value={clientName} onChange={setClientName} placeholder={t('booking.namePlaceholder')} />
              <FormField label={t('booking.phone')} value={clientPhone} onChange={setClientPhone} placeholder={t('booking.phonePlaceholder')} type="tel" />
              <FormField label={t('booking.emailOptional')} value={clientEmail} onChange={setClientEmail} placeholder={t('booking.emailPlaceholder')} type="email" />
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" size="lg" onClick={() => setStep('datetime')} className="flex-1">{t('booking.back')}</Button>
              <Button
                size="lg"
                disabled={!clientName || !clientPhone}
                onClick={() => setStep('review')}
                className="flex-1"
              >
                {t('booking.review')}
              </Button>
            </div>
          </>
        )}

        {/* STEP 3: Review & Confirm */}
        {step === 'review' && selectedSlot && (
          <>
            <h2 className="text-lg font-semibold text-[var(--color-text)]">{t('booking.reviewBooking')}</h2>

            <BookingSummary
              salonName={salon?.name ?? ''}
              salonAddress={salon?.address}
              masterName={master ? `${master.firstName} ${master.lastName}` : ''}
              selectedDate={selectedDate}
              startTime={selectedSlot.startTime}
              selectedServices={booking.selectedServices}
              totalPrice={booking.totalPrice}
              totalDuration={booking.totalDuration}
            />

            <div
              className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4 space-y-2"
              style={{ borderRadius: 'var(--radius-lg)' }}
            >
              <p className="text-sm font-medium text-[var(--color-text)]">{clientName}</p>
              <p className="text-sm text-[var(--color-text-secondary)]">{clientPhone}</p>
              {clientEmail && <p className="text-sm text-[var(--color-text-secondary)]">{clientEmail}</p>}
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" size="lg" onClick={() => setStep('details')} className="flex-1">{t('booking.back')}</Button>
              <Button
                size="lg"
                loading={mutation.isPending}
                onClick={() => mutation.mutate()}
                className="flex-1"
              >
                {t('booking.confirmBooking')}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

