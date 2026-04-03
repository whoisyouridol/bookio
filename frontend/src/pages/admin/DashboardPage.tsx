import { useQuery } from '@tanstack/react-query';
import { getSalons } from '@/api/salons';
import { getMasters } from '@/api/masters';
import { getBookings } from '@/api/bookings';
import { Link } from 'react-router';
import { Building2, Users, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Badge, bookingStatusBadge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { useTranslation } from 'react-i18next';

export default function DashboardPage() {
  const { t } = useTranslation();
  const { data: salons } = useQuery({ queryKey: ['salons'], queryFn: getSalons, refetchOnMount: 'always' });
  const { data: masters } = useQuery({ queryKey: ['masters'], queryFn: getMasters, refetchOnMount: 'always' });
  const { data: bookings, isLoading } = useQuery({ queryKey: ['bookings'], queryFn: () => getBookings(), refetchOnMount: 'always' });

  const today = format(new Date(), 'yyyy-MM-dd');
  const todayBookings = bookings?.filter(b => b.bookingDate === today) ?? [];
  const recent = bookings?.slice(0, 10) ?? [];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-[var(--color-text)] mb-6">{t('admin.dashboard.title')}</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<Building2 className="w-5 h-5 text-[var(--color-primary)]" />} label={t('admin.dashboard.salons')} value={salons?.length ?? 0} to="/admin/salons" />
        <StatCard icon={<Users className="w-5 h-5 text-blue-600" />} label={t('admin.dashboard.masters')} value={masters?.length ?? 0} to="/admin/masters" />
        <StatCard icon={<Calendar className="w-5 h-5 text-[var(--color-success)]" />} label={t('admin.dashboard.today')} value={todayBookings.length} to="/admin/bookings" />
        <StatCard icon={<Clock className="w-5 h-5 text-orange-500" />} label={t('admin.dashboard.total')} value={bookings?.length ?? 0} to="/admin/bookings" />
      </div>

      {/* Recent bookings */}
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--color-divider)]">
          <h2 className="font-semibold text-[var(--color-text)]">{t('admin.dashboard.recentBookings')}</h2>
        </div>
        {isLoading ? (
          <Loader />
        ) : recent.length === 0 ? (
          <p className="p-6 text-center text-sm text-[var(--color-text-tertiary)]">{t('admin.dashboard.noBookingsYet')}</p>
        ) : (
          <div className="divide-y divide-[var(--color-divider)]">
            {recent.map(b => (
              <Link key={b.id} to={`/admin/bookings/${b.id}`}
                className="flex items-center px-5 py-3 hover:bg-[var(--color-bg)] transition-colors gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-text)] truncate">{b.clientName}</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">{b.salonName} · {b.masterName}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-[var(--color-text-secondary)]">{b.bookingDate} {b.startTime.slice(0, 5)}</p>
                  <p className="text-sm font-semibold text-[var(--color-primary)]">{Number(b.totalPrice).toLocaleString()} ₾</p>
                </div>
                <Badge variant={bookingStatusBadge(b.status)}>{t(`bookingStatus.${b.status}`, b.status)}</Badge>
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
    <Link to={to} className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] p-4 flex flex-col gap-2 hover:shadow-[var(--shadow-sm)] transition-shadow">
      {icon}
      <p className="text-2xl font-bold text-[var(--color-text)]">{value}</p>
      <p className="text-xs text-[var(--color-text-secondary)]">{label}</p>
    </Link>
  );
}
