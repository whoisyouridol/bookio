import { Outlet, Link, useLocation } from 'react-router';
import { LayoutDashboard, Building2, Users, Scissors, Calendar } from 'lucide-react';
import { clsx } from 'clsx';

const nav = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/admin/salons', label: 'Salons', icon: Building2 },
  { to: '/admin/masters', label: 'Masters', icon: Users },
  { to: '/admin/services', label: 'Services', icon: Scissors },
  { to: '/admin/bookings', label: 'Bookings', icon: Calendar },
];

export default function AdminLayout() {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col fixed h-full z-10 hidden md:flex">
        <div className="px-5 py-5 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Admin</p>
          <h1 className="text-lg font-bold text-gray-900 mt-0.5">BookVisit</h1>
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
        <div className="px-5 py-4 border-t border-gray-100">
          <Link to="/" className="text-xs text-gray-400 hover:text-gray-700">← Client view</Link>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-10 px-4 h-12 flex items-center justify-between">
        <h1 className="font-bold text-gray-900">BookVisit Admin</h1>
        <Link to="/" className="text-xs text-gray-400">Client →</Link>
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
