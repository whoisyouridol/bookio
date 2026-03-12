import type React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { LayoutDashboard, Building2, Users, Scissors, Calendar, UserCircle, LogOut, ShieldCheck } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth, type Role } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const allNav: { to: string; label: string; icon: React.ElementType; exact?: boolean; roles: Role[] }[] = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true, roles: ['superadmin'] },
  { to: '/admin/salons', label: 'Salons', icon: Building2, roles: ['superadmin'] },
  { to: '/admin/masters', label: 'Masters', icon: Users, roles: ['superadmin', 'salon_admin', 'master_admin'] },
  { to: '/admin/services', label: 'Services', icon: Scissors, roles: ['superadmin', 'salon_admin'] },
  { to: '/admin/bookings', label: 'Bookings', icon: Calendar, roles: ['superadmin', 'salon_admin', 'master_admin'] },
  { to: '/admin/users', label: 'Users', icon: ShieldCheck, roles: ['superadmin'] },
];

const ROLE_LABELS: Record<Role, string> = {
  superadmin: 'Super Admin',
  salon_admin: 'Salon Admin',
  master_admin: 'Master',
  client: 'Client',
};

export default function AdminLayout() {
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
          label: 'My Profile',
          icon: UserCircle as React.ElementType,
        };
      }
      if (item.to === '/admin/salons' && role === 'salon_admin') {
        return {
          ...item,
          to: salonId ? `/admin/salons/${salonId}` : '/admin/salons/new',
          label: 'My Salon',
        };
      }
      return item;
    });

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/login', { replace: true });
  };

  const displayName = user
    ? (user.firstName ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}` : user.email)
    : ROLE_LABELS[role];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col fixed h-full z-10 hidden md:flex">
        <div className="px-5 py-5 border-b border-gray-100">
          <h1 className="text-lg font-bold text-gray-900">BookVisit</h1>
          <p className="text-xs text-gray-500 mt-0.5 truncate">{displayName}</p>
          <p className="text-xs text-gray-400">{ROLE_LABELS[role]}</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map(({ to, label, icon: Icon, exact }) => {
            const active = exact ? pathname === to : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  active
                    ? 'bg-purple-50 text-purple-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="px-3 py-4 border-t border-gray-100 space-y-1">
          <Link to="/" className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors">
            ← Back to client view
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Log out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-10 px-4 h-12 flex items-center justify-between">
        <div>
          <span className="font-bold text-gray-900">BookVisit</span>
          <span className="ml-2 text-xs text-gray-400">{ROLE_LABELS[role]}</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/" className="text-xs text-gray-400">Client →</Link>
          <button onClick={handleLogout} className="text-xs text-red-500">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10 flex">
        {nav.map(({ to, label, icon: Icon, exact }) => {
          const active = exact ? pathname === to : pathname.startsWith(to);
          return (
            <Link key={to} to={to}
              className={clsx('flex flex-col items-center justify-center flex-1 py-2 text-xs font-medium transition-colors',
                active ? 'text-purple-700' : 'text-gray-500')}>
              <Icon className="w-5 h-5 mb-0.5" />
              {label}
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
