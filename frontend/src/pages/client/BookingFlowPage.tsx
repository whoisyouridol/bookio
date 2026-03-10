import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format, addDays, startOfDay } from 'date-fns';
import { getSalon } from '@/api/salons';
import { getMaster } from '@/api/masters';
import { getAvailableSlots } from '@/api/timeslots';
import { createBooking } from '@/api/bookings';
import { Header } from '@/components/Header';
import { TimeSlotGrid } from '@/components/booking/TimeSlotGrid';
import { BookingSummary } from '@/components/booking/BookingSummary';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { useBooking } from '@/context/BookingContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { TimeSlotDto } from '@/types';

type Step = 'datetime' | 'details' | 'review';

export default function BookingFlowPage() {
  const { salonId, masterId } = useParams<{ salonId: string; masterId: string }>();
  const navigate = useNavigate();
  const booking = useBooking();
  const { user } = useAuth();

  const [step, setStep] = useState<Step>('datetime');
  const [selectedDate, setSelectedDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
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
    onError: () => toast.error('Failed to create booking. Please try again.'),
  });

  if (booking.selectedServices.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--color-background)]">
        <Header title="Book Appointment" showBack />
        <div className="p-6 text-center text-[var(--color-text-secondary)]">
          No services selected. Please go back and select services.
        </div>
      </div>
    );
  }

  const today = startOfDay(new Date());

  // Generate next 30 days to show in date picker
  const minDate = format(addDays(today, 0), 'yyyy-MM-dd');
  const maxDate = format(addDays(today, 60), 'yyyy-MM-dd');

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Header title="Book Appointment" showBack />

      {/* Master quick info */}
      {master && (
        <div className="max-w-md mx-auto px-4 pt-4">
          <div
            className="bg-[var(--color-surface)] p-3 border border-[var(--color-border)] flex items-center gap-3 mb-4"
            style={{ borderRadius: 'var(--border-radius)' }}
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
              <h2 className="text-lg font-semibold text-[var(--color-text)] mb-3">Select Date</h2>
              <input
                type="date"
                value={selectedDate}
                min={minDate}
                max={maxDate}
                onChange={e => { setSelectedDate(e.target.value); setSelectedSlot(null); }}
                className="w-full p-3 border border-[var(--color-border)] text-[var(--color-text)] bg-[var(--color-surface)] focus:outline-none focus:border-[var(--color-primary)]"
                style={{ borderRadius: 'var(--border-radius)' }}
              />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-[var(--color-text)] mb-3">Select Time</h2>
              {loadingSlots ? (
                <Loader />
              ) : (
                <TimeSlotGrid
                  slots={slots ?? []}
                  selectedId={selectedSlot?.id ?? null}
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
              Continue
            </Button>
          </>
        )}

        {/* STEP 2: Client Details */}
        {step === 'details' && (
          <>
            <h2 className="text-lg font-semibold text-[var(--color-text)]">Your Details</h2>
            <div
              className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4 space-y-4"
              style={{ borderRadius: 'var(--border-radius)' }}
            >
              <Field label="Full Name *" value={clientName} onChange={setClientName} placeholder="Your name" />
              <Field label="Phone *" value={clientPhone} onChange={setClientPhone} placeholder="+7 000 000 00 00" type="tel" />
              <Field label="Email (optional)" value={clientEmail} onChange={setClientEmail} placeholder="your@email.com" type="email" />
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" size="lg" onClick={() => setStep('datetime')} className="flex-1">Back</Button>
              <Button
                size="lg"
                disabled={!clientName || !clientPhone}
                onClick={() => setStep('review')}
                className="flex-1"
              >
                Review
              </Button>
            </div>
          </>
        )}

        {/* STEP 3: Review & Confirm */}
        {step === 'review' && selectedSlot && (
          <>
            <h2 className="text-lg font-semibold text-[var(--color-text)]">Review Booking</h2>

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
              style={{ borderRadius: 'var(--border-radius)' }}
            >
              <p className="text-sm font-medium text-[var(--color-text)]">{clientName}</p>
              <p className="text-sm text-[var(--color-text-secondary)]">{clientPhone}</p>
              {clientEmail && <p className="text-sm text-[var(--color-text-secondary)]">{clientEmail}</p>}
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" size="lg" onClick={() => setStep('details')} className="flex-1">Back</Button>
              <Button
                size="lg"
                loading={mutation.isPending}
                onClick={() => mutation.mutate()}
                className="flex-1"
              >
                Confirm Booking
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full p-3 border border-[var(--color-border)] text-[var(--color-text)] placeholder-gray-400 focus:outline-none focus:border-[var(--color-primary)] bg-[var(--color-surface)]"
        style={{ borderRadius: 'var(--border-radius)' }}
      />
    </div>
  );
}
