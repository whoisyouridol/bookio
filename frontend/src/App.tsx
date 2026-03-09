import { createBrowserRouter, RouterProvider } from 'react-router';
import { RoleGuard } from '@/router/RoleGuard';

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
    // Clients are never allowed into admin — redirect to homepage
    element: (
      <RoleGuard allow={['superadmin', 'salon_admin', 'master_admin']} redirect="/">
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

      // Salons list: only superadmin; salon_admin redirects to their own salon, master_admin to dashboard
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

      // Salon form: superadmin unrestricted; salon_admin only their own (guard inside page)
      { path: 'salons/new', element: <SalonFormPage /> },
      { path: 'salons/:salonId', element: <SalonFormPage /> },

      // Masters list: superadmin + salon_admin; master_admin redirects to own profile
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

      // Master form: superadmin + salon_admin can create; master_admin only their own (guard inside page)
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
