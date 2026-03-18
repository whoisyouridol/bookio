import { createBrowserRouter, RouterProvider, Outlet } from 'react-router';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { BookingProvider } from '@/contexts/BookingContext';
import { SalonSubdomainProvider } from '@/contexts/SalonSubdomainContext';
import { BottomNav } from '@/components/BottomNav';

// Pages (reused from client)
import MasterProfilePage from '@/pages/client/MasterProfilePage';
import BookingFlowPage from '@/pages/client/BookingFlowPage';
import BookingConfirmationPage from '@/pages/client/BookingConfirmationPage';
import ViewBookingPage from '@/pages/client/ViewBookingPage';
import MyBookingsPage from '@/pages/client/MyBookingsPage';
import SalonLandingPage from '@/pages/subdomain/SalonLandingPage';
import NotFoundPage from '@/pages/client/NotFoundPage';

// Auth pages
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';

function SubdomainRoot() {
  return (
    <ThemeProvider>
      <BookingProvider>
        <SalonSubdomainProvider>
          <div className="min-h-screen bg-[var(--color-background)] pb-16" style={{ fontFamily: 'var(--font-family)' }}>
            <Outlet />
            <BottomNav />
          </div>
        </SalonSubdomainProvider>
      </BookingProvider>
    </ThemeProvider>
  );
}

const subdomainRouter = createBrowserRouter([
  {
    path: '/',
    Component: SubdomainRoot,
    children: [
      { index: true, Component: SalonLandingPage },
      { path: 'master/:masterId', Component: MasterProfilePage },
      { path: 'master/:masterId/book', Component: BookingFlowPage },
      { path: 'booking/confirmation/:bookingId', Component: BookingConfirmationPage },
      { path: 'booking/:bookingId', Component: ViewBookingPage },
      { path: 'bookings', Component: MyBookingsPage },
      { path: 'login', Component: LoginPage },
      { path: 'register', Component: RegisterPage },
      { path: 'auth/forgot-password', Component: ForgotPasswordPage },
      { path: 'auth/reset-password', Component: ResetPasswordPage },
    ],
  },

  { path: '*', Component: NotFoundPage },
]);

export default function SubdomainApp() {
  return <RouterProvider router={subdomainRouter} />;
}
