import { createBrowserRouter, RouterProvider } from 'react-router';

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
    Component: AdminLayout,
    children: [
      { index: true, Component: DashboardPage },
      { path: 'salons', Component: SalonsPage },
      { path: 'salons/new', Component: SalonFormPage },
      { path: 'salons/:salonId', Component: SalonFormPage },
      { path: 'masters', Component: MastersPage },
      { path: 'masters/new', Component: MasterFormPage },
      { path: 'masters/:masterId', Component: MasterFormPage },
      { path: 'services', Component: ServicesPage },
      { path: 'bookings', Component: BookingsAdminPage },
      { path: 'bookings/:bookingId', Component: BookingDetailAdminPage },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
