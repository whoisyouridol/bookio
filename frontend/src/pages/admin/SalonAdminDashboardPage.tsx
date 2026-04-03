import { useQuery } from '@tanstack/react-query';
import { getSalonAdminDashboard, getSalonAdminBookings } from '@/api/salonAdmin';
import { Link } from 'react-router';
import { Users, Calendar, DollarSign, TrendingDown, Star } from 'lucide-react';
import { format } from 'date-fns';
import { Badge, bookingStatusBadge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { useTranslation } from 'react-i18next';

export default function SalonAdminDashboardPage() {
  const { t } = useTranslation();

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['salon-admin-dashboard'],
    queryFn: getSalonAdminDashboard,
    refetchOnMount: 'always',
  });

  const { data: todayBookings } = useQuery({
    queryKey: ['salon-admin-bookings-today'],
    queryFn: () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      return getSalonAdminBookings({ dateFrom: today, dateTo: today });
    },
    refetchOnMount: 'always',
  });

  if (isLoading) return <Loader />;
  if (!dashboard) return <p className="p-6 text-center text-[var(--color-text-secondary)]">{t('admin.salonDashboard.dashboardUnavailable')}</p>;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-[var(--color-text)]">{t('admin.salonDashboard.title')}</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Users className="w-5 h-5 text-[var(--color-primary)]" />}
          label={t('admin.salonDashboard.activeMasters')} value={dashboard.activeMasters} />
        <StatCard icon={<Calendar className="w-5 h-5 text-[var(--color-success)]" />}
          label={t('admin.salonDashboard.today')} value={dashboard.bookingsToday} />
        <StatCard icon={<Calendar className="w-5 h-5 text-blue-600" />}
          label={t('admin.salonDashboard.thisWeek')} value={dashboard.bookingsThisWeek} />
        <StatCard icon={<Star className="w-5 h-5 text-[var(--color-warning)]" />}
          label={t('admin.salonDashboard.avgRating')} value={dashboard.averageRating > 0 ? dashboard.averageRating.toFixed(1) : '—'} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard icon={<DollarSign className="w-5 h-5 text-[var(--color-success)]" />}
          label={t('admin.salonDashboard.revenueToday')} value={`${dashboard.revenueToday.toLocaleString()} ₾`} />
        <StatCard icon={<DollarSign className="w-5 h-5 text-blue-600" />}
          label={t('admin.salonDashboard.revenueWeek')} value={`${dashboard.revenueThisWeek.toLocaleString()} ₾`} />
        <StatCard icon={<TrendingDown className="w-5 h-5 text-[var(--color-error)]" />}
          label={t('admin.salonDashboard.cancelRate')} value={`${dashboard.cancellationRate30d}%`} />
      </div>

      {/* Today's Bookings */}
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--color-divider)] flex items-center justify-between">
          <h2 className="font-semibold text-[var(--color-text)]">{t('admin.salonDashboard.todaysBookings')}</h2>
          <Link to="/admin/salon-bookings" className="text-sm text-[var(--color-primary)] hover:underline">
            {t('admin.salonDashboard.viewAll')}
          </Link>
        </div>
        {!todayBookings?.length ? (
          <p className="p-6 text-center text-sm text-[var(--color-text-tertiary)]">{t('admin.salonDashboard.noBookingsToday')}</p>
        ) : (
          <div className="divide-y divide-[var(--color-divider)]">
            {todayBookings.map(b => (
              <Link key={b.id} to={`/admin/bookings/${b.id}`}
                className="flex items-center px-5 py-3 hover:bg-[var(--color-bg)] transition-colors gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-text)] truncate">{b.clientName}</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">{b.masterName}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-[var(--color-text-secondary)]">{b.startTime.slice(0, 5)} - {b.endTime.slice(0, 5)}</p>
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

function StatCard({ icon, label, value, highlight }: {
  icon: React.ReactNode; label: string; value: number | string; highlight?: boolean;
}) {
  return (
    <div className={`bg-[var(--color-surface)] rounded-[var(--radius-lg)] border p-4 flex flex-col gap-2 ${
      highlight ? 'border-amber-300 bg-amber-50' : 'border-[var(--color-border)]'
    }`}>
      {icon}
      <p className="text-2xl font-bold text-[var(--color-text)]">{value}</p>
      <p className="text-xs text-[var(--color-text-secondary)]">{label}</p>
    </div>
  );
}
