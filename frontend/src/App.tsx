import { createBrowserRouter, RouterProvider } from 'react-router';
import { RoleGuard } from '@/router/RoleGuard';

// Auth pages
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import MasterRegisterPage from '@/pages/auth/MasterRegisterPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';

// Client layout + pages
import ClientRoot from '@/pages/client/Root';
import HomePage from '@/pages/client/HomePage';
import SalonDetailsPage from '@/pages/client/SalonDetailsPage';
import MasterProfilePage from '@/pages/client/MasterProfilePage';
import BookingFlowPage from '@/pages/client/BookingFlowPage';
import BookingConfirmationPage from '@/pages/client/BookingConfirmationPage';
import ViewBookingPage from '@/pages/client/ViewBookingPage';
import MyBookingsPage from '@/pages/client/MyBookingsPage';

// Admin layout + pages
import AdminLayout from '@/pages/admin/AdminLayout';
import DashboardPage from '@/pages/admin/DashboardPage';
import SalonsPage from '@/pages/admin/SalonsPage';
import SalonFormPage from '@/pages/admin/SalonFormPage';
import MastersPage from '@/pages/admin/MastersPage';
import MasterFormPage from '@/pages/admin/MasterFormPage';
import ServicesPage from '@/pages/admin/ServicesPage';
import BookingsAdminPage from '@/pages/admin/BookingsAdminPage';
import BookingDetailAdminPage from '@/pages/admin/BookingDetailAdminPage';

const router = createBrowserRouter([
  // ── Auth routes ────────────────────────────────────────────────────────────
  { path: '/login', Component: LoginPage },
  { path: '/register', Component: RegisterPage },
  { path: '/register/master', Component: MasterRegisterPage },
  { path: '/auth/forgot-password', Component: ForgotPasswordPage },
  { path: '/auth/reset-password', Component: ResetPasswordPage },

  // ── Client routes ──────────────────────────────────────────────────────────
  {
    path: '/',
    Component: ClientRoot,
    children: [
      { index: true, Component: HomePage },
      { path: 'salon/:salonId', Component: SalonDetailsPage },
      { path: 'salon/:salonId/master/:masterId', Component: MasterProfilePage },
      { path: 'salon/:salonId/master/:masterId/book', Component: BookingFlowPage },
      { path: 'booking/confirmation/:bookingId', Component: BookingConfirmationPage },
      { path: 'booking/:bookingId', Component: ViewBookingPage },
      { path: 'bookings', Component: MyBookingsPage },
    ],
  },
  // ── Admin routes ───────────────────────────────────────────────────────────
  {
    path: '/admin',
    element: (
      <RoleGuard allow={['superadmin', 'salon_admin', 'master_admin']} redirect="/login">
        <AdminLayout />
      </RoleGuard>
    ),
    children: [
      {
        index: true,
        element: (
          <RoleGuard
            allow={['superadmin']}
            redirect={(role, salonId, masterId) => {
              if (role === 'salon_admin' && salonId) return `/admin/salons/${salonId}`;
              if (role === 'master_admin' && masterId) return `/admin/masters/${masterId}`;
              return '/admin/bookings';
            }}
          >
            <DashboardPage />
          </RoleGuard>
        ),
      },

      {
        path: 'salons',
        element: (
          <RoleGuard
            allow={['superadmin']}
            redirect={(role, salonId) =>
              role === 'salon_admin' && salonId ? `/admin/salons/${salonId}` : '/admin'
            }
          >
            <SalonsPage />
          </RoleGuard>
        ),
      },

      { path: 'salons/new', element: <SalonFormPage /> },
      { path: 'salons/:salonId', element: <SalonFormPage /> },

      {
        path: 'masters',
        element: (
          <RoleGuard
            allow={['superadmin', 'salon_admin']}
            redirect={(role, _, masterId) =>
              role === 'master_admin' && masterId ? `/admin/masters/${masterId}` : '/admin'
            }
          >
            <MastersPage />
          </RoleGuard>
        ),
      },

      { path: 'masters/new', element: <MasterFormPage /> },
      { path: 'masters/:masterId', element: <MasterFormPage /> },

      { path: 'services', element: <ServicesPage /> },
      { path: 'bookings', element: <BookingsAdminPage /> },
      { path: 'bookings/:bookingId', element: <BookingDetailAdminPage /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
