import { useParams, useNavigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBooking, confirmBooking, completeBooking, cancelBooking } from '@/api/bookings';
import { Badge, bookingStatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useState } from 'react';

export default function BookingDetailAdminPage() {
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
    onSuccess: () => { invalidate(); toast.success('Booking confirmed.'); },
    onError: (e: { response?: { data?: { error?: string } } }) => toast.error(e?.response?.data?.error ?? 'Failed.'),
  });

  const completeMutation = useMutation({
    mutationFn: () => completeBooking(bookingId!),
    onSuccess: () => { invalidate(); toast.success('Booking completed.'); },
    onError: (e: { response?: { data?: { error?: string } } }) => toast.error(e?.response?.data?.error ?? 'Failed.'),
  });

  const cancelMutation = useMutation({
    mutationFn: (reason: string) => cancelBooking(bookingId!, { side: 'Master', reason }),
    onSuccess: () => { invalidate(); toast.success('Booking cancelled.'); setCancelReason(''); },
    onError: () => toast.error('Failed to cancel.'),
  });

  if (isLoading) return <Loader />;
  if (!booking) return <div className="p-6 text-gray-400">Booking not found.</div>;

  const canConfirm = booking.status === 'Pending';
  const canComplete = booking.status === 'Confirmed';
  const canCancel = booking.status === 'Pending' || booking.status === 'Confirmed';

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-700 text-sm">← Back</button>
        <h1 className="text-2xl font-bold text-gray-900 flex-1">Booking Details</h1>
        <Badge variant={bookingStatusBadge(booking.status)}>{booking.status}</Badge>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {/* Overview */}
        <div className="p-5 grid grid-cols-2 gap-4">
          <InfoPair label="Reference" value={booking.id.slice(0, 8).toUpperCase()} mono />
          <InfoPair label="Date" value={format(new Date(booking.bookingDate), 'EEEE, MMM d, yyyy')} />
          <InfoPair label="Time" value={`${booking.startTime.slice(0, 5)} – ${booking.endTime.slice(0, 5)}`} />
          <InfoPair label="Duration" value={`${booking.totalDurationMinutes} min`} />
          <InfoPair label="Salon" value={booking.salonName} />
          <InfoPair label="Master" value={booking.masterName} />
        </div>

        {/* Client */}
        <div className="p-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Client</p>
          <div className="grid grid-cols-2 gap-4">
            <InfoPair label="Name" value={booking.clientName} />
            <InfoPair label="Phone" value={booking.clientPhone} />
            {booking.clientEmail && <InfoPair label="Email" value={booking.clientEmail} />}
          </div>
        </div>

        {/* Services */}
        <div className="p-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Services</p>
          <div className="space-y-2">
            {booking.services.map(s => (
              <div key={s.id} className="flex justify-between text-sm">
                <span className="text-gray-700">{s.serviceName} <span className="text-gray-400">· {s.durationMinutes} min</span></span>
                <span className="font-medium text-gray-900">{Number(s.price).toLocaleString()} ₽</span>
              </div>
            ))}
            <div className="flex justify-between font-semibold text-base pt-2 border-t border-gray-100">
              <span>Total</span>
              <span className="text-purple-600">{Number(booking.totalPrice).toLocaleString()} ₽</span>
            </div>
          </div>
        </div>

        {/* Cancellation info */}
        {booking.cancellationReason && (
          <div className="p-5">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Cancellation Reason</p>
            <p className="text-sm text-gray-700">{booking.cancellationReason}</p>
          </div>
        )}

        {/* Actions */}
        {(canConfirm || canComplete || canCancel) && (
          <div className="p-5 space-y-3">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Actions</p>
            <div className="flex flex-wrap gap-3">
              {canConfirm && (
                <Button size="sm" onClick={() => confirmMutation.mutate()} loading={confirmMutation.isPending}>
                  Confirm
                </Button>
              )}
              {canComplete && (
                <Button size="sm" variant="secondary" onClick={() => completeMutation.mutate()} loading={completeMutation.isPending}>
                  Mark Complete
                </Button>
              )}
            </div>
            {canCancel && (
              <div className="space-y-2">
                <input
                  type="text"
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  placeholder="Cancellation reason (optional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none"
                />
                <Button variant="danger" size="sm" loading={cancelMutation.isPending}
                  onClick={() => { if (confirm('Cancel this booking?')) cancelMutation.mutate(cancelReason); }}>
                  Cancel Booking
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
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className={`text-sm text-gray-900 ${mono ? 'font-mono' : 'font-medium'}`}>{value}</p>
    </div>
  );
}
