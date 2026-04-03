import { useState } from 'react';
import { Link } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSalonAdminBookings,
  getSalonAdminMasters,
  confirmSalonAdminBooking,
  completeSalonAdminBooking,
  cancelSalonAdminBooking,
} from '@/api/salonAdmin';
import { Badge, bookingStatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Calendar, CheckCircle, XCircle, Play } from 'lucide-react';
import { format } from 'date-fns';
import { DatePicker } from '@/components/ui/DatePicker';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/error';
import { useTranslation } from 'react-i18next';

const STATUSES = ['', 'Pending', 'Confirmed', 'Completed', 'CancelledByClient', 'CancelledByMaster'];

export default function SalonAdminBookingsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [filterMaster, setFilterMaster] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: masters } = useQuery({
    queryKey: ['salon-admin-masters'],
    queryFn: getSalonAdminMasters,
  });

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['salon-admin-bookings', filterMaster, filterStatus, filterDateFrom, filterDateTo],
    refetchOnMount: 'always',
    queryFn: () => getSalonAdminBookings({
      masterId: filterMaster || undefined,
      status: filterStatus || undefined,
      dateFrom: filterDateFrom || undefined,
      dateTo: filterDateTo || undefined,
    }),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['salon-admin-bookings'] });
    setSelected(new Set());
  };

  const confirmMut = useMutation({
    mutationFn: confirmSalonAdminBooking,
    onSuccess: () => { invalidate(); toast.success(t('admin.salonBookings.bookingConfirmed')); },
    onError: (err) => toast.error(getErrorMessage(err, t('admin.salonBookings.failed'))),
  });

  const completeMut = useMutation({
    mutationFn: completeSalonAdminBooking,
    onSuccess: () => { invalidate(); toast.success(t('admin.salonBookings.bookingCompleted')); },
    onError: (err) => toast.error(getErrorMessage(err, t('admin.salonBookings.failed'))),
  });

  const cancelMut = useMutation({
    mutationFn: (id: string) => cancelSalonAdminBooking(id, { side: 'Master' }),
    onSuccess: () => { invalidate(); toast.success(t('admin.salonBookings.bookingCancelled')); },
    onError: (err) => toast.error(getErrorMessage(err, t('admin.salonBookings.failed'))),
  });

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (!bookings) return;
    const cancellable = bookings.filter(b => b.status === 'Pending' || b.status === 'Confirmed');
    if (selected.size === cancellable.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(cancellable.map(b => b.id)));
    }
  };

  const handleBulkCancel = async () => {
    if (!selected.size) return;
    if (!confirm(t('admin.salonBookings.cancelBulkConfirm', { count: selected.size }))) return;
    for (const id of selected) {
      try {
        await cancelSalonAdminBooking(id, { side: 'Master', reason: 'Bulk cancel by salon admin' });
      } catch { /* continue */ }
    }
    invalidate();
    toast.success(t('admin.salonBookings.bookingsCancelled', { count: selected.size }));
  };

  const isBusy = confirmMut.isPending || completeMut.isPending || cancelMut.isPending;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-text)]">{t('admin.salonBookings.title')}</h1>
        {selected.size > 0 && (
          <Button variant="danger" size="sm" onClick={handleBulkCancel} disabled={isBusy}>
            <XCircle className="w-4 h-4 mr-1" /> {t('admin.salonBookings.cancelSelected', { count: selected.size })}
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] p-4 mb-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        <select value={filterMaster} onChange={e => setFilterMaster(e.target.value)}
          className="px-3 py-2 border border-[var(--color-border)] rounded-[var(--radius-md)] text-sm bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors">
          <option value="">{t('admin.salonBookings.allMasters')}</option>
          {masters?.map(m => (
            <option key={m.masterId} value={m.masterId}>{m.firstName} {m.lastName}</option>
          ))}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-[var(--color-border)] rounded-[var(--radius-md)] text-sm bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors">
          {STATUSES.map(s => <option key={s} value={s}>{s ? t(`bookingStatus.${s}`, s) : t('admin.salonBookings.allStatuses')}</option>)}
        </select>
        <DatePicker value={filterDateFrom} onChange={setFilterDateFrom} placeholder={t('admin.salonBookings.from')} />
        <DatePicker value={filterDateTo} onChange={setFilterDateTo} placeholder={t('admin.salonBookings.to')} />
      </div>

      {isLoading ? <Loader /> : !bookings?.length ? (
        <EmptyState icon={Calendar} title={t('admin.salonBookings.noBookingsFound')} />
      ) : (
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[var(--color-bg)] border-b border-[var(--color-border)]">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input type="checkbox" onChange={toggleAll}
                      checked={selected.size > 0 && selected.size === bookings.filter(b => b.status === 'Pending' || b.status === 'Confirmed').length}
                      className="rounded border-[var(--color-border)]" />
                  </th>
                  {[t('admin.salonBookings.dateTime'), t('admin.salonBookings.client'), t('admin.salonBookings.master'), t('admin.salonBookings.services'), t('admin.salonBookings.total'), t('admin.salonBookings.status'), t('admin.salonBookings.actions')].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-divider)]">
                {bookings.map(b => {
                  const cancellable = b.status === 'Pending' || b.status === 'Confirmed';
                  return (
                    <tr key={b.id} className="hover:bg-[var(--color-bg)]">
                      <td className="px-4 py-3">
                        {cancellable && (
                          <input type="checkbox" checked={selected.has(b.id)}
                            onChange={() => toggleSelect(b.id)}
                            className="rounded border-[var(--color-border)]" />
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p>{format(new Date(b.bookingDate), 'MMM d, yyyy')}</p>
                        <p className="text-[var(--color-text-tertiary)]">{b.startTime.slice(0, 5)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{b.clientName}</p>
                        <p className="text-[var(--color-text-tertiary)] text-xs">{b.clientPhone}</p>
                      </td>
                      <td className="px-4 py-3 text-[var(--color-text)]">{b.masterName}</td>
                      <td className="px-4 py-3 text-[var(--color-text-secondary)] text-xs max-w-32 truncate">
                        {b.services.map(s => s.serviceName).join(', ')}
                      </td>
                      <td className="px-4 py-3 font-semibold text-[var(--color-primary)]">
                        {Number(b.totalPrice).toLocaleString()} ₾
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={bookingStatusBadge(b.status)}>{t(`bookingStatus.${b.status}`, b.status)}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {b.status === 'Pending' && (
                            <Button size="sm" variant="ghost" disabled={isBusy}
                              onClick={() => confirmMut.mutate(b.id)}
                              title={t('admin.salonBookings.confirm')}>
                              <CheckCircle className="w-4 h-4 text-[var(--color-success)]" />
                            </Button>
                          )}
                          {b.status === 'Confirmed' && (
                            <Button size="sm" variant="ghost" disabled={isBusy}
                              onClick={() => completeMut.mutate(b.id)}
                              title={t('admin.salonBookings.complete')}>
                              <Play className="w-4 h-4 text-blue-600" />
                            </Button>
                          )}
                          {cancellable && (
                            <Button size="sm" variant="ghost" disabled={isBusy}
                              onClick={() => {
                                if (confirm(t('admin.salonBookings.cancelBookingConfirm'))) cancelMut.mutate(b.id);
                              }}
                              title={t('admin.salonBookings.cancel')}>
                              <XCircle className="w-4 h-4 text-[var(--color-error)]" />
                            </Button>
                          )}
                          <Link to={`/admin/bookings/${b.id}`}
                            className="text-[var(--color-primary)] hover:underline text-xs font-medium py-1 px-2">
                            {t('admin.salonBookings.details')}
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
