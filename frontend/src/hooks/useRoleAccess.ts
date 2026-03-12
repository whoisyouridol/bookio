import { useAuth } from '@/contexts/AuthContext';
import type { BookingDto } from '@/types';

export function useRoleAccess() {
  const { role, salonId, masterId } = useAuth();

  /** SuperAdmin can access any salon; SalonAdmin only their own. */
  const canAccessSalon = (id: string): boolean => {
    if (role === 'superadmin') return true;
    if (role === 'salon_admin') return id === salonId;
    return false;
  };

  /** SuperAdmin can access any master; MasterAdmin only their own. */
  const canAccessMaster = (id: string): boolean => {
    if (role === 'superadmin') return true;
    if (role === 'master_admin') return id === masterId;
    return false;
  };

  /**
   * SuperAdmin sees all bookings.
   * SalonAdmin sees bookings for their salon.
   * MasterAdmin sees bookings for their master profile.
   */
  const canAccessBooking = (booking: BookingDto): boolean => {
    if (role === 'superadmin') return true;
    if (role === 'salon_admin') return booking.salonId === salonId;
    if (role === 'master_admin') return booking.masterId === masterId;
    return false;
  };

  return { canAccessSalon, canAccessMaster, canAccessBooking };
}
