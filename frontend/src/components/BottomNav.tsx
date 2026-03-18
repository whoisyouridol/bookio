import { Home, Calendar, Settings, LogIn, LogOut } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import { isOnSubdomain } from '@/lib/subdomain';

export function BottomNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { role, isAuthenticated, logout } = useAuth();

  const isAdmin = role !== 'client';
  const subdomain = isOnSubdomain();

  const items = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/bookings', icon: Calendar, label: 'My Bookings' },
    ...(!subdomain && isAdmin ? [{ path: '/admin', icon: Settings, label: 'Admin' }] : []),
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

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

        {isAuthenticated ? (
          <button
            onClick={handleLogout}
            className="flex flex-col items-center justify-center flex-1 h-full transition-colors text-[var(--color-text-secondary)] hover:text-red-500"
          >
            <LogOut className="w-6 h-6 stroke-2" />
            <span className="text-xs mt-1 font-medium">Logout</span>
          </button>
        ) : (
          <Link
            to="/login"
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              pathname === '/login' ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)]'
            }`}
          >
            <LogIn className="w-6 h-6 stroke-2" />
            <span className="text-xs mt-1 font-medium">Login</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
