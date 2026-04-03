import { useParams, Link } from 'react-router';
import { Calendar, Clock, MapPin, User } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getBooking, cancelBooking } from '@/api/bookings';
import { Header } from '@/components/Header';
import { Badge, bookingStatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { InfoRow } from '@/components/ui/InfoRow';
import { Loader } from '@/components/ui/Loader';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function ViewBookingPage() {
  const { t } = useTranslation();
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
      toast.success(t('booking.bookingCancelled'));
    },
    onError: () => toast.error(t('booking.failedToCancel')),
  });

  if (isLoading) return <Loader />;
  if (!booking) return <div className="p-4 text-center text-[var(--color-text-secondary)]">{t('booking.bookingNotFound')}</div>;

  const canCancel = booking.status === 'Pending' || booking.status === 'Confirmed';

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Header title={t('bookingDetails.title')} showBack />

      <div className="max-w-md mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-mono text-[var(--color-text-secondary)]">{booking.id.slice(0, 8).toUpperCase()}</p>
          <Badge variant={bookingStatusBadge(booking.status)}>{t(`bookingStatus.${booking.status}`, booking.status)}</Badge>
        </div>

        <div
          className="bg-[var(--color-surface)] border border-[var(--color-border)] divide-y divide-[var(--color-border)]"
          style={{ borderRadius: 'var(--radius-lg)' }}
        >
          <div className="p-4 space-y-3">
            <InfoRow icon={<MapPin className="w-4 h-4" />} value={booking.salonName} />
            <InfoRow icon={<User className="w-4 h-4" />} value={booking.masterName} />
            <InfoRow icon={<Calendar className="w-4 h-4" />} value={format(new Date(booking.bookingDate), 'EEEE, MMM d, yyyy')} />
            <InfoRow icon={<Clock className="w-4 h-4" />}
              value={`${booking.startTime.slice(0, 5)} – ${booking.endTime.slice(0, 5)}`} />
          </div>

          <div className="p-4 space-y-2">
            <p className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide mb-2">{t('bookingDetails.services')}</p>
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
            onClick={() => { if (confirm(t('booking.cancelConfirm'))) cancelMutation.mutate(); }}
          >
            {t('booking.cancelBooking')}
          </Button>
        )}

        <Link to="/">
          <Button variant="ghost" fullWidth>{t('common.backToHome')}</Button>
        </Link>
      </div>
    </div>
  );
}

