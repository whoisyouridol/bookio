import { Home, Calendar, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router';

const items = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/bookings', icon: Calendar, label: 'My Bookings' },
  { path: '/admin', icon: Settings, label: 'Admin' },
];

export function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[var(--color-surface)] border-t border-[var(--color-border)] z-10">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        {items.map(({ path, icon: Icon, label }) => {
          const active = path === '/' ? pathname === '/' : pathname.startsWith(path);
          return (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                active ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)]'
              }`}
            >
              <Icon className={`w-6 h-6 ${active ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-xs mt-1 font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
