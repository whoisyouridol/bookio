import { useState } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { getBookings } from '@/api/bookings';
import { getSalons } from '@/api/salons';
import { getMasters } from '@/api/masters';
import { Badge, bookingStatusBadge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { DatePicker } from '@/components/ui/DatePicker';
import { useAuth } from '@/contexts/AuthContext';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { useTranslation } from 'react-i18next';

const STATUSES = ['', 'Pending', 'Confirmed', 'Completed', 'CancelledByClient', 'CancelledByMaster'];

export default function BookingsAdminPage() {
  const { t } = useTranslation();
  const { role, salonId, masterId } = useAuth();
  const { canAccessBooking } = useRoleAccess();

  const [filterSalon, setFilterSalon] = useState(role === 'salon_admin' ? (salonId ?? '') : '');
  const [filterMaster, setFilterMaster] = useState(role === 'master_admin' ? (masterId ?? '') : '');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  const { data: salons } = useQuery({
    queryKey: ['salons'],
    queryFn: getSalons,
    enabled: role === 'superadmin',
  });
  const { data: masters } = useQuery({
    queryKey: ['masters'],
    queryFn: getMasters,
    enabled: role === 'superadmin',
  });

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['bookings', filterSalon, filterMaster, filterStatus, filterDateFrom, filterDateTo],
    refetchOnMount: 'always',
    queryFn: () => getBookings({
      salonId: filterSalon || undefined,
      masterId: filterMaster || undefined,
      status: filterStatus || undefined,
      dateFrom: filterDateFrom || undefined,
      dateTo: filterDateTo || undefined,
    }),
  });

  // Client-side access filter on top of API results
  const visibleBookings = bookings?.filter(b => canAccessBooking(b)) ?? [];

  const isMaster = role === 'master_admin';
  const showMasterCol = !isMaster;
  const showSalonCol = !isMaster || new Set(visibleBookings.map(b => b.salonId)).size > 1;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-[var(--color-text)] mb-6">{t('admin.bookings.title')}</h1>

      {/* Filters — shown contextually by role */}
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] p-4 mb-6 grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* Salon filter: superadmin only */}
        {role === 'superadmin' && (
          <select value={filterSalon} onChange={e => setFilterSalon(e.target.value)}
            className="px-3 py-2 border border-[var(--color-border)] rounded-[var(--radius-md)] text-sm bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors">
            <option value="">{t('admin.bookings.allSalons')}</option>
            {salons?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}

        {/* Master filter: superadmin only */}
        {role === 'superadmin' && (
          <select value={filterMaster} onChange={e => setFilterMaster(e.target.value)}
            className="px-3 py-2 border border-[var(--color-border)] rounded-[var(--radius-md)] text-sm bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors">
            <option value="">{t('admin.bookings.allMasters')}</option>
            {masters?.map(m => <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>)}
          </select>
        )}

        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none col-span-1">
          {STATUSES.map(s => <option key={s} value={s}>{s ? t(`bookingStatus.${s}`, s) : t('admin.bookings.allStatuses')}</option>)}
        </select>
        <DatePicker value={filterDateFrom} onChange={setFilterDateFrom} placeholder={t('admin.bookings.from')} />
        <DatePicker value={filterDateTo} onChange={setFilterDateTo} placeholder={t('admin.bookings.to')} />
      </div>

      {isLoading ? <Loader /> : !visibleBookings.length ? (
        <EmptyState icon={Calendar} title={t('admin.bookings.noBookingsFound')} />
      ) : (
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[var(--color-bg)] border-b border-[var(--color-border)]">
                <tr>
                  {[t('admin.bookings.dateTime'), t('admin.bookings.client'), ...(showSalonCol ? [t('admin.bookings.salon')] : []), ...(showMasterCol ? [t('admin.bookings.master')] : []), t('admin.bookings.services'), t('admin.bookings.total'), t('admin.bookings.status'), ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-divider)]">
                {visibleBookings.map(b => (
                  <tr key={b.id} className="hover:bg-[var(--color-bg)]">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p>{format(new Date(b.bookingDate), 'MMM d, yyyy')}</p>
                      <p className="text-[var(--color-text-tertiary)]">{b.startTime.slice(0, 5)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{b.clientName}</p>
                      <p className="text-[var(--color-text-tertiary)] text-xs">{b.clientPhone}</p>
                    </td>
                    {showSalonCol && <td className="px-4 py-3 text-[var(--color-text)]">{b.salonName}</td>}
                    {showMasterCol && <td className="px-4 py-3 text-[var(--color-text)]">{b.masterName}</td>}
                    <td className="px-4 py-3 text-[var(--color-text-secondary)] text-xs max-w-32 truncate">
                      {b.services.map(s => s.serviceName).join(', ')}
                    </td>
                    <td className="px-4 py-3 font-semibold text-[var(--color-primary)]">{Number(b.totalPrice).toLocaleString()} ₾</td>
                    <td className="px-4 py-3"><Badge variant={bookingStatusBadge(b.status)}>{t(`bookingStatus.${b.status}`, b.status)}</Badge></td>
                    <td className="px-4 py-3">
                      <Link to={`/admin/bookings/${b.id}`} className="text-[var(--color-primary)] hover:underline text-xs font-medium">
                        {t('admin.bookings.details')}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
