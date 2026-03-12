import { useParams, Link } from 'react-router';
import { Calendar, Clock, MapPin, User } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBooking, cancelBooking } from '@/api/bookings';
import { Header } from '@/components/Header';
import { Badge, bookingStatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { InfoRow } from '@/components/ui/InfoRow';
import { Loader } from '@/components/ui/Loader';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function ViewBookingPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const queryClient = useQueryClient();

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => getBooking(bookingId!),
    enabled: !!bookingId,
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelBooking(bookingId!, { side: 'Client', reason: 'Client cancelled' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
      toast.success('Booking cancelled.');
    },
    onError: () => toast.error('Failed to cancel.'),
  });

  if (isLoading) return <Loader />;
  if (!booking) return <div className="p-4 text-center text-[var(--color-text-secondary)]">Booking not found.</div>;

  const canCancel = booking.status === 'Pending' || booking.status === 'Confirmed';

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Header title="Booking Details" showBack />

      <div className="max-w-md mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-mono text-[var(--color-text-secondary)]">{booking.id.slice(0, 8).toUpperCase()}</p>
          <Badge variant={bookingStatusBadge(booking.status)}>{booking.status}</Badge>
        </div>

        <div
          className="bg-[var(--color-surface)] border border-[var(--color-border)] divide-y divide-[var(--color-border)]"
          style={{ borderRadius: 'var(--border-radius)' }}
        >
          <div className="p-4 space-y-3">
            <InfoRow icon={<MapPin className="w-4 h-4" />} value={booking.salonName} />
            <InfoRow icon={<User className="w-4 h-4" />} value={booking.masterName} />
            <InfoRow icon={<Calendar className="w-4 h-4" />} value={format(new Date(booking.bookingDate), 'EEEE, MMM d, yyyy')} />
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

          <div className="p-4 flex justify-between">
            <p className="text-sm text-[var(--color-text-secondary)]">{booking.totalDurationMinutes} min</p>
            <p className="font-bold text-lg text-[var(--color-primary)]">{Number(booking.totalPrice).toLocaleString()} ₾</p>
          </div>
        </div>

        {canCancel && (
          <Button
            variant="danger"
            fullWidth
            size="lg"
            loading={cancelMutation.isPending}
            onClick={() => { if (confirm('Cancel this booking?')) cancelMutation.mutate(); }}
          >
            Cancel Booking
          </Button>
        )}

        <Link to="/">
          <Button variant="ghost" fullWidth>Back to Home</Button>
        </Link>
      </div>
    </div>
  );
}

