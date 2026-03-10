import { Calendar, Clock } from 'lucide-react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { getMyBookings } from '@/api/bookings';
import { Header } from '@/components/Header';
import { Badge, bookingStatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Loader } from '@/components/ui/Loader';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

export default function MyBookingsPage() {
  const { isAuthenticated } = useAuth();

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: getMyBookings,
    enabled: isAuthenticated,
  });

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Header title="My Bookings" />

      <div className="max-w-md mx-auto px-4 py-6">
        {!isAuthenticated ? (
          <EmptyState
            icon={Calendar}
            title="Sign in to see your bookings"
            description="Create an account or sign in to track your appointments"
            action={
              <Link to="/login" className="text-sm text-[var(--color-primary)] font-medium">
                Sign in →
              </Link>
            }
          />
        ) : isLoading ? (
          <Loader />
        ) : !bookings?.length ? (
          <EmptyState
            icon={Calendar}
            title="No bookings yet"
            description="Book your first appointment to get started"
            action={
              <Link to="/" className="text-sm text-[var(--color-primary)] font-medium">
                Browse salons →
              </Link>
            }
          />
        ) : (
          <div className="space-y-4">
            {bookings.map(booking => (
              <Link
                key={booking.id}
                to={`/booking/${booking.id}`}
                className="block bg-[var(--color-surface)] rounded-[var(--border-radius)] p-4 shadow-sm border border-[var(--color-border)] hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-[var(--color-text)]">{booking.salonName}</h3>
                    <p className="text-sm text-[var(--color-text-secondary)]">{booking.masterName}</p>
                  </div>
                  <Badge variant={bookingStatusBadge(booking.status)}>{booking.status}</Badge>
                </div>

                <div className="flex items-center gap-4 text-sm text-[var(--color-text-secondary)]">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    <span>{format(new Date(booking.bookingDate), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>{booking.startTime.slice(0, 5)}</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-[var(--color-border)] flex justify-between items-center">
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {booking.services.map(s => s.serviceName).join(', ')}
                  </p>
                  <p className="font-semibold text-sm text-[var(--color-primary)]">
                    {Number(booking.totalPrice).toLocaleString()} ₾
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
