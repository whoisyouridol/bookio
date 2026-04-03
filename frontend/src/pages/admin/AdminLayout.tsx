import type React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { LayoutDashboard, Building2, Users, Scissors, Calendar, UserCircle, LogOut, ShieldCheck, CalendarClock } from 'lucide-react';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';
import { useAuth, type Role } from '@/contexts/AuthContext';
import { GlobalToolbar } from '@/components/GlobalToolbar';
import { toast } from 'sonner';

const allNav: { to: string; labelKey: string; icon: React.ElementType; exact?: boolean; roles: Role[] }[] = [
  { to: '/admin', labelKey: 'admin.nav.dashboard', icon: LayoutDashboard, exact: true, roles: ['superadmin', 'salon_admin'] },
  { to: '/admin/salons', labelKey: 'admin.nav.salons', icon: Building2, roles: ['superadmin'] },
  { to: '/admin/salon-masters', labelKey: 'admin.nav.masters', icon: Users, roles: ['salon_admin'] },
  { to: '/admin/masters', labelKey: 'admin.nav.masters', icon: Users, roles: ['master_admin'] },
  { to: '/admin/availability', labelKey: 'admin.nav.availability', icon: CalendarClock, roles: ['master_admin'] },
  { to: '/admin/services', labelKey: 'admin.nav.services', icon: Scissors, roles: ['superadmin'] },
  { to: '/admin/salon-bookings', labelKey: 'admin.nav.bookings', icon: Calendar, roles: ['salon_admin'] },
  { to: '/admin/bookings', labelKey: 'admin.nav.bookings', icon: Calendar, roles: ['superadmin', 'master_admin'] },
  { to: '/admin/users', labelKey: 'admin.nav.accounts', icon: ShieldCheck, roles: ['superadmin'] },
];

const ROLE_LABEL_KEYS: Record<Role, string> = {
  superadmin: 'admin.roles.superAdmin',
  salon_admin: 'admin.roles.salonAdmin',
  master_admin: 'admin.roles.master',
  client: 'admin.roles.client',
};

export default function AdminLayout() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { role, salonId, masterId, user, logout } = useAuth();

  const nav = allNav
    .filter(item => item.roles.includes(role))
    .map(item => {
      if (item.to === '/admin/masters' && role === 'master_admin') {
        return {
          ...item,
          to: masterId ? `/admin/masters/${masterId}` : '/admin/masters/new',
          labelKey: 'admin.nav.myProfile',
          icon: UserCircle as React.ElementType,
        };
      }
      if (item.to === '/admin/salons' && role === 'salon_admin') {
        return {
          ...item,
          to: salonId ? `/admin/salons/${salonId}` : '/admin/salons/new',
          labelKey: 'admin.nav.mySalon',
        };
      }
      return item;
    });

  const handleLogout = async () => {
    await logout();
    toast.success(t('admin.loggedOut'));
    navigate('/login', { replace: true });
  };

  const displayName = user
    ? (user.firstName ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}` : (user.email ?? user.phone ?? ''))
    : t(ROLE_LABEL_KEYS[role] as any);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex transition-colors" style={{ fontFamily: 'var(--font-body)' }}>
      {/* Sidebar */}
      <aside className="w-56 bg-[var(--color-surface)] border-r border-[var(--color-border)] flex flex-col fixed h-full z-10 hidden md:flex transition-colors">
        <div className="px-5 py-5 border-b border-[var(--color-divider)]">
          <h1 className="text-lg font-bold text-[var(--color-text)]" style={{ fontFamily: 'var(--font-heading)' }}>BookVisit</h1>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 truncate">{displayName as string}</p>
          <p className="text-xs text-[var(--color-text-tertiary)]">{t(ROLE_LABEL_KEYS[role] as any)}</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map(({ to, labelKey, icon: Icon, exact }) => {
            const active = exact ? pathname === to : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-sm font-medium transition-colors',
                  active
                    ? 'bg-[var(--color-primary-subtle)] text-[var(--color-primary)]'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text)]'
                )}
              >
                <Icon className="w-4 h-4" />
                {t(labelKey as any)}
              </Link>
            );
          })}
        </nav>
        <div className="px-3 py-4 border-t border-[var(--color-divider)] space-y-1">
          <div className="flex items-center justify-between px-3 py-1.5">
            <span className="text-xs text-[var(--color-text-tertiary)]">{t('admin.preferences')}</span>
            <GlobalToolbar />
          </div>
          <Link to="/" className="flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text)] hover:bg-[var(--color-hover)] transition-colors">
            ← {t('admin.backToClientView')}
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] text-xs text-[var(--color-error)] hover:bg-[var(--color-error-subtle)] transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            {t('admin.logOut')}
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-[var(--color-surface)] border-b border-[var(--color-border)] z-10 px-4 h-12 flex items-center justify-between transition-colors">
        <div>
          <span className="font-bold text-[var(--color-text)]" style={{ fontFamily: 'var(--font-heading)' }}>BookVisit</span>
          <span className="ml-2 text-xs text-[var(--color-text-tertiary)]">{t(ROLE_LABEL_KEYS[role] as any)}</span>
        </div>
        <div className="flex items-center gap-1">
          <GlobalToolbar />
          <Link to="/" className="text-xs text-[var(--color-text-tertiary)] px-1">{t('admin.clientView')} →</Link>
          <button onClick={handleLogout} className="text-xs text-[var(--color-error)] p-1">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--color-surface)] border-t border-[var(--color-border)] z-10 flex transition-colors">
        {nav.map(({ to, labelKey, icon: Icon, exact }) => {
          const active = exact ? pathname === to : pathname.startsWith(to);
          return (
            <Link key={to} to={to}
              className={clsx('flex flex-col items-center justify-center flex-1 py-2 text-xs font-medium transition-colors',
                active ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)]')}>
              <Icon className="w-5 h-5 mb-0.5" />
              {t(labelKey as any)}
            </Link>
          );
        })}
      </div>

      {/* Content */}
      <main className="flex-1 md:ml-56 mt-12 md:mt-0 mb-16 md:mb-0 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
