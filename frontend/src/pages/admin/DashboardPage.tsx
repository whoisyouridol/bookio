import { useQuery } from '@tanstack/react-query';
import { getSalons } from '@/api/salons';
import { getMasters } from '@/api/masters';
import { getBookings } from '@/api/bookings';
import { Link } from 'react-router';
import { Building2, Users, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Badge, bookingStatusBadge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';

export default function DashboardPage() {
  const { data: salons } = useQuery({ queryKey: ['salons'], queryFn: getSalons });
  const { data: masters } = useQuery({ queryKey: ['masters'], queryFn: getMasters });
  const { data: bookings, isLoading } = useQuery({ queryKey: ['bookings'], queryFn: () => getBookings() });

  const today = format(new Date(), 'yyyy-MM-dd');
  const todayBookings = bookings?.filter(b => b.bookingDate === today) ?? [];
  const recent = bookings?.slice(0, 10) ?? [];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<Building2 className="w-5 h-5 text-purple-600" />} label="Salons" value={salons?.length ?? 0} to="/admin/salons" />
        <StatCard icon={<Users className="w-5 h-5 text-blue-600" />} label="Masters" value={masters?.length ?? 0} to="/admin/masters" />
        <StatCard icon={<Calendar className="w-5 h-5 text-green-600" />} label="Today" value={todayBookings.length} to="/admin/bookings" />
        <StatCard icon={<Clock className="w-5 h-5 text-orange-500" />} label="Total" value={bookings?.length ?? 0} to="/admin/bookings" />
      </div>

      {/* Recent bookings */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Recent Bookings</h2>
        </div>
        {isLoading ? (
          <Loader />
        ) : recent.length === 0 ? (
          <p className="p-6 text-center text-sm text-gray-400">No bookings yet.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {recent.map(b => (
              <Link key={b.id} to={`/admin/bookings/${b.id}`}
                className="flex items-center px-5 py-3 hover:bg-gray-50 transition-colors gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{b.clientName}</p>
                  <p className="text-xs text-gray-500">{b.salonName} · {b.masterName}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-500">{b.bookingDate} {b.startTime.slice(0, 5)}</p>
                  <p className="text-sm font-semibold text-purple-600">{Number(b.totalPrice).toLocaleString()} ₽</p>
                </div>
                <Badge variant={bookingStatusBadge(b.status)}>{b.status}</Badge>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, to }: { icon: React.ReactNode; label: string; value: number; to: string }) {
  return (
    <Link to={to} className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-2 hover:shadow-sm transition-shadow">
      {icon}
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </Link>
  );
}
