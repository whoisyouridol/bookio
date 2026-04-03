import { useParams, useNavigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBooking, confirmBooking, completeBooking, cancelBooking } from '@/api/bookings';
import { Badge, bookingStatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function BookingDetailAdminPage() {
  const { t } = useTranslation();
  const { bookingId } = useParams<{ bookingId: string }>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [cancelReason, setCancelReason] = useState('');

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => getBooking(bookingId!),
    enabled: !!bookingId,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });

  const confirmMutation = useMutation({
    mutationFn: () => confirmBooking(bookingId!),
    onSuccess: () => { invalidate(); toast.success(t('admin.bookingDetail.bookingConfirmed')); },
    onError: (e: { response?: { data?: { error?: string } } }) => toast.error(e?.response?.data?.error ?? t('admin.bookingDetail.failed')),
  });

  const completeMutation = useMutation({
    mutationFn: () => completeBooking(bookingId!),
    onSuccess: () => { invalidate(); toast.success(t('admin.bookingDetail.bookingCompleted')); },
    onError: (e: { response?: { data?: { error?: string } } }) => toast.error(e?.response?.data?.error ?? t('admin.bookingDetail.failed')),
  });

  const cancelMutation = useMutation({
    mutationFn: (reason: string) => cancelBooking(bookingId!, { side: 'Master', reason }),
    onSuccess: () => { invalidate(); toast.success(t('admin.bookingDetail.bookingCancelled')); setCancelReason(''); },
    onError: () => toast.error(t('admin.bookingDetail.failedToCancel')),
  });

  if (isLoading) return <Loader />;
  if (!booking) return <div className="p-6 text-[var(--color-text-tertiary)]">{t('admin.bookingDetail.bookingNotFound')}</div>;

  const canConfirm = booking.status === 'Pending';
  const canComplete = booking.status === 'Confirmed';
  const canCancel = booking.status === 'Pending' || booking.status === 'Confirmed';

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text)] text-sm">{t('admin.bookingDetail.back')}</button>
        <h1 className="text-2xl font-bold text-[var(--color-text)] flex-1">{t('admin.bookingDetail.title')}</h1>
        <Badge variant={bookingStatusBadge(booking.status)}>{t(`bookingStatus.${booking.status}`, booking.status)}</Badge>
      </div>

      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] divide-y divide-[var(--color-divider)]">
        {/* Overview */}
        <div className="p-5 grid grid-cols-2 gap-4">
          <InfoPair label={t('admin.bookingDetail.reference')} value={booking.id.slice(0, 8).toUpperCase()} mono />
          <InfoPair label={t('admin.bookingDetail.date')} value={format(new Date(booking.bookingDate), 'EEEE, MMM d, yyyy')} />
          <InfoPair label={t('admin.bookingDetail.time')} value={`${booking.startTime.slice(0, 5)} – ${booking.endTime.slice(0, 5)}`} />
          <InfoPair label={t('admin.bookingDetail.duration')} value={`${booking.totalDurationMinutes} min`} />
          <InfoPair label={t('admin.bookingDetail.salon')} value={booking.salonName} />
          <InfoPair label={t('admin.bookingDetail.master')} value={booking.masterName} />
        </div>

        {/* Client */}
        <div className="p-5">
          <p className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide mb-3">{t('admin.bookingDetail.client')}</p>
          <div className="grid grid-cols-2 gap-4">
            <InfoPair label={t('admin.bookingDetail.name')} value={booking.clientName} />
            <InfoPair label={t('admin.bookingDetail.phone')} value={booking.clientPhone} />
            {booking.clientEmail && <InfoPair label={t('admin.bookingDetail.email')} value={booking.clientEmail} />}
          </div>
        </div>

        {/* Services */}
        <div className="p-5">
          <p className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide mb-3">{t('admin.bookingDetail.services')}</p>
          <div className="space-y-2">
            {booking.services.map(s => (
              <div key={s.id} className="flex justify-between text-sm">
                <span className="text-[var(--color-text)]">{s.serviceName} <span className="text-[var(--color-text-tertiary)]">· {s.durationMinutes} min</span></span>
                <span className="font-medium text-[var(--color-text)]">{Number(s.price).toLocaleString()} ₾</span>
              </div>
            ))}
            <div className="flex justify-between font-semibold text-base pt-2 border-t border-[var(--color-divider)]">
              <span>{t('admin.bookingDetail.total')}</span>
              <span className="text-[var(--color-primary)]">{Number(booking.totalPrice).toLocaleString()} ₾</span>
            </div>
          </div>
        </div>

        {/* Cancellation info */}
        {booking.cancellationReason && (
          <div className="p-5">
            <p className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide mb-2">{t('admin.bookingDetail.cancellationReason')}</p>
            <p className="text-sm text-[var(--color-text)]">{booking.cancellationReason}</p>
          </div>
        )}

        {/* Actions */}
        {(canConfirm || canComplete || canCancel) && (
          <div className="p-5 space-y-3">
            <p className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide mb-3">{t('admin.bookingDetail.actions')}</p>
            <div className="flex flex-wrap gap-3">
              {canConfirm && (
                <Button size="sm" onClick={() => confirmMutation.mutate()} loading={confirmMutation.isPending}>
                  {t('admin.bookingDetail.confirm')}
                </Button>
              )}
              {canComplete && (
                <Button size="sm" variant="secondary" onClick={() => completeMutation.mutate()} loading={completeMutation.isPending}>
                  {t('admin.bookingDetail.markComplete')}
                </Button>
              )}
            </div>
            {canCancel && (
              <div className="space-y-2">
                <input
                  type="text"
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  placeholder={t('admin.bookingDetail.cancelReasonOptional')}
                  className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none"
                />
                <Button variant="danger" size="sm" loading={cancelMutation.isPending}
                  onClick={() => { if (confirm(t('admin.salonBookings.cancelBookingConfirm'))) cancelMutation.mutate(cancelReason); }}>
                  {t('admin.bookingDetail.cancelBooking')}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoPair({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-[var(--color-text-tertiary)] mb-0.5">{label}</p>
      <p className={`text-sm text-[var(--color-text)] ${mono ? 'font-mono' : 'font-medium'}`}>{value}</p>
    </div>
  );
}
