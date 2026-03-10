import { useParams, Link } from 'react-router';
import { CheckCircle2, Clock3, Calendar, Clock, MapPin, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getBooking } from '@/api/bookings';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { format } from 'date-fns';

export default function BookingConfirmationPage() {
  const { bookingId } = useParams<{ bookingId: string }>();

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => getBooking(bookingId!),
    enabled: !!bookingId,
  });

  if (isLoading) return <Loader />;
  if (!booking) return <div className="p-6 text-center text-[var(--color-text-secondary)]">Booking not found.</div>;

  const dateLabel = format(new Date(booking.bookingDate), 'EEEE, MMMM d, yyyy');
  const isPending = booking.status === 'Pending';

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Header title={isPending ? 'Booking Requested' : 'Booking Confirmed'} />

      <div className="max-w-md mx-auto px-4 py-8 space-y-6">
        {/* Success banner */}
        <div className="text-center py-4">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${isPending ? 'bg-yellow-100' : 'bg-green-100'}`}>
            {isPending
              ? <Clock3 className="w-10 h-10 text-yellow-500" />
              : <CheckCircle2 className="w-10 h-10 text-green-500" />}
          </div>
          <h2 className="text-2xl font-bold text-[var(--color-text)] mb-2">
            {isPending ? 'Awaiting approval' : "You're booked!"}
          </h2>
          <p className="text-[var(--color-text-secondary)]">
            {isPending
              ? 'The master will confirm your booking shortly.'
              : 'Your appointment is confirmed.'}
          </p>
          <p className="text-[var(--color-text-secondary)] mt-1 text-sm">
            Booking <span className="font-mono font-medium text-xs">{booking.id.slice(0, 8).toUpperCase()}</span>
          </p>
        </div>

        {/* Details card */}
        <div
          className="bg-[var(--color-surface)] border border-[var(--color-border)] divide-y divide-[var(--color-border)]"
          style={{ borderRadius: 'var(--border-radius)' }}
        >
          <div className="p-4 space-y-3">
            <InfoRow icon={<MapPin className="w-4 h-4" />} value={`${booking.salonName}`} />
            <InfoRow icon={<Calendar className="w-4 h-4" />} value={dateLabel} />
            <InfoRow icon={<Clock className="w-4 h-4" />}
              value={`${booking.startTime.slice(0, 5)} – ${booking.endTime.slice(0, 5)}`} />
          </div>

          <div className="p-4 space-y-2">
            <p className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide mb-2">Services</p>
            {booking.services.map(s => (
              <div key={s.id} className="flex justify-between text-sm">
                <span className="text-[var(--color-text)]">{s.serviceName}</span>
                <span className="text-[var(--color-text-secondary)]">{Number(s.price).toLocaleString()} ₾</span>
              </div>
            ))}
          </div>

          <div className="p-4 flex justify-between items-center">
            <div>
              <p className="text-xs text-[var(--color-text-secondary)]">{booking.totalDurationMinutes} min total</p>
              <p className="font-bold text-xl text-[var(--color-primary)]">
                {Number(booking.totalPrice).toLocaleString()} ₾
              </p>
            </div>
            <span className={`text-xs font-medium px-3 py-1 rounded-full ${isPending ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
              {booking.status}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link to={`/booking/${booking.id}`}>
            <Button variant="outline" fullWidth size="lg">
              View Booking Details <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
          <Link to="/">
            <Button variant="ghost" fullWidth size="lg">
              Book Another Appointment
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-[var(--color-text)]">
      <span className="text-[var(--color-text-secondary)]">{icon}</span>
      {value}
    </div>
  );
}
