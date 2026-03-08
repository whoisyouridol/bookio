import { Outlet, useLocation } from 'react-router';
import { useEffect } from 'react';
import { BottomNav } from '@/components/BottomNav';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { BookingProvider } from '@/context/BookingContext';


function RootContent() {
  const { pathname } = useLocation();
  const { resetTheme } = useTheme();

  useEffect(() => {
    // Reset to default theme on all client pages for now
    // When per-salon theming is needed, detect salonId from pathname here
    resetTheme();
  }, [pathname, resetTheme]);

  return (
    <div className="min-h-screen bg-[var(--color-background)] pb-16" style={{ fontFamily: 'var(--font-family)' }}>
      <Outlet />
      <BottomNav />
    </div>
  );
}


export default function ClientRoot() {
  return (
    <ThemeProvider>
      <BookingProvider>
        <RootContent />
      </BookingProvider>
    </ThemeProvider>
  );
}
