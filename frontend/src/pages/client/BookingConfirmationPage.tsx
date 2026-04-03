import { useParams, Link } from 'react-router';
import { CheckCircle2, Clock3, Calendar, Clock, MapPin, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getBooking } from '@/api/bookings';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/Button';
import { InfoRow } from '@/components/ui/InfoRow';
import { Loader } from '@/components/ui/Loader';
import { format } from 'date-fns';

export default function BookingConfirmationPage() {
  const { t } = useTranslation();
  const { bookingId } = useParams<{ bookingId: string }>();

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => getBooking(bookingId!),
    enabled: !!bookingId,
  });

  if (isLoading) return <Loader />;
  if (!booking) return <div className="p-6 text-center text-[var(--color-text-secondary)]">{t('booking.bookingNotFound')}</div>;

  const dateLabel = format(new Date(booking.bookingDate), 'EEEE, MMMM d, yyyy');
  const isPending = booking.status === 'Pending';

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Header title={isPending ? t('booking.bookingRequested') : t('booking.bookingConfirmed')} />

      <div className="max-w-md mx-auto px-4 py-8 space-y-6">
        {/* Success banner */}
        <div className="text-center py-4">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${isPending ? 'bg-[var(--color-warning-subtle)]' : 'bg-[var(--color-success-subtle)]'}`}>
            {isPending
              ? <Clock3 className="w-10 h-10 text-[var(--color-warning)]" />
              : <CheckCircle2 className="w-10 h-10 text-[var(--color-success)]" />}
          </div>
          <h2 className="text-2xl font-bold text-[var(--color-text)] mb-2">
            {isPending ? t('booking.awaitingApproval') : t('booking.youreBooked')}
          </h2>
          <p className="text-[var(--color-text-secondary)]">
            {isPending
              ? t('booking.masterConfirmShortly')
              : t('booking.yourAppointmentConfirmed')}
          </p>
          <p className="text-[var(--color-text-secondary)] mt-1 text-sm">
            {t('booking.bookingLabel')} <span className="font-mono font-medium text-xs">{booking.id.slice(0, 8).toUpperCase()}</span>
          </p>
        </div>

        {/* Details card */}
        <div
          className="bg-[var(--color-surface)] border border-[var(--color-border)] divide-y divide-[var(--color-border)]"
          style={{ borderRadius: 'var(--radius-lg)' }}
        >
          <div className="p-4 space-y-3">
            <InfoRow icon={<MapPin className="w-4 h-4" />} value={`${booking.salonName}`} />
            <InfoRow icon={<Calendar className="w-4 h-4" />} value={dateLabel} />
            <InfoRow icon={<Clock className="w-4 h-4" />}
              value={`${booking.startTime.slice(0, 5)} – ${booking.endTime.slice(0, 5)}`} />
          </div>

          <div className="p-4 space-y-2">
            <p className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide mb-2">{t('booking.services')}</p>
            {booking.services.map(s => (
              <div key={s.id} className="flex justify-between text-sm">
                <span className="text-[var(--color-text)]">{s.serviceName}</span>
                <span className="text-[var(--color-text-secondary)]">{Number(s.price).toLocaleString()} ₾</span>
              </div>
            ))}
          </div>

          <div className="p-4 flex justify-between items-center">
            <div>
              <p className="text-xs text-[var(--color-text-secondary)]">{booking.totalDurationMinutes} {t('booking.minTotal')}</p>
              <p className="font-bold text-xl text-[var(--color-primary)]">
                {Number(booking.totalPrice).toLocaleString()} ₾
              </p>
            </div>
            <span className={`text-xs font-medium px-3 py-1 rounded-full ${isPending ? 'bg-[var(--color-warning-subtle)] text-[var(--color-warning-text)]' : 'bg-[var(--color-success-subtle)] text-[var(--color-success-text)]'}`}>
              {t(`bookingStatus.${booking.status}`, booking.status)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link to={`/booking/${booking.id}`}>
            <Button variant="outline" fullWidth size="lg">
              {t('booking.viewBookingDetails')} <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
          <Link to="/">
            <Button variant="ghost" fullWidth size="lg">
              {t('booking.bookAnotherAppointment')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

