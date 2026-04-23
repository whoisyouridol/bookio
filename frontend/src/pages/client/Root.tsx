import { Outlet } from 'react-router';
import { BottomNav } from '@/components/BottomNav';
import { BookingProvider } from '@/contexts/BookingContext';


function RootContent() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] pb-16" style={{ fontFamily: 'var(--font-body)' }}>
      <Outlet />
      <BottomNav />
    </div>
  );
}


export default function ClientRoot() {
  return (
    <BookingProvider>
      <RootContent />
    </BookingProvider>
  );
}
