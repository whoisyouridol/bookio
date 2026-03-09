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
import { useRole } from '@/contexts/RoleContext';
import { useRoleAccess } from '@/hooks/useRoleAccess';

const STATUSES = ['', 'Pending', 'Confirmed', 'Completed', 'CancelledByClient', 'CancelledByMaster'];

export default function BookingsAdminPage() {
  const { role, salonId, masterId } = useRole();
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

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Bookings</h1>

      {/* Filters — shown contextually by role */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* Salon filter: superadmin only */}
        {role === 'superadmin' && (
          <select value={filterSalon} onChange={e => setFilterSalon(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none">
            <option value="">All Salons</option>
            {salons?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}

        {/* Master filter: superadmin only */}
        {role === 'superadmin' && (
          <select value={filterMaster} onChange={e => setFilterMaster(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none">
            <option value="">All Masters</option>
            {masters?.map(m => <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>)}
          </select>
        )}

        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none col-span-1">
          {STATUSES.map(s => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
        </select>
        <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none" placeholder="From" />
        <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none" placeholder="To" />
      </div>

      {isLoading ? <Loader /> : !visibleBookings.length ? (
        <EmptyState icon={Calendar} title="No bookings found" />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Date & Time', 'Client', 'Salon', 'Master', 'Services', 'Total', 'Status', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {visibleBookings.map(b => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p>{format(new Date(b.bookingDate), 'MMM d, yyyy')}</p>
                      <p className="text-gray-400">{b.startTime.slice(0, 5)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{b.clientName}</p>
                      <p className="text-gray-400 text-xs">{b.clientPhone}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{b.salonName}</td>
                    <td className="px-4 py-3 text-gray-700">{b.masterName}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-32 truncate">
                      {b.services.map(s => s.serviceName).join(', ')}
                    </td>
                    <td className="px-4 py-3 font-semibold text-purple-600">{Number(b.totalPrice).toLocaleString()} ₾</td>
                    <td className="px-4 py-3"><Badge variant={bookingStatusBadge(b.status)}>{b.status}</Badge></td>
                    <td className="px-4 py-3">
                      <Link to={`/admin/bookings/${b.id}`} className="text-purple-600 hover:underline text-xs font-medium">
                        Details
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
