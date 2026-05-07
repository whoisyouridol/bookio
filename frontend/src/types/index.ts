// ── Salon ─────────────────────────────────────────────────────────────────────

export interface SalonDto {
  id: string;
  name: string;
  slug?: string;
  address: string;
  googleMapsUrl?: string;
  workingHoursStart: string;
  workingHoursEnd: string;
  workingDays: string[];
  coverPicture?: string;
  isActive: boolean;
  createdAt: string;
}

export interface SalonDetailDto extends SalonDto {
  masters: SalonMasterDto[];
}

export interface CreateSalonRequest {
  name: string;
  slug?: string;
  address: string;
  googleMapsUrl?: string;
  workingHoursStart: string;
  workingHoursEnd: string;
  workingDays: string[];
  coverPicture?: string;
}

export type UpdateSalonRequest = CreateSalonRequest;

// ── Master ────────────────────────────────────────────────────────────────────

export interface MasterDto {
  id: string;
  email?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  photo?: string;
  description?: string;
  autoApproveBookings: boolean;
  isDeleted: boolean;
  isUserActive: boolean;
  createdAt: string;
  averageRating?: number;
  ratingCount: number;
}

export interface CreateMasterRequest {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  photo?: string;
  description?: string;
  autoApproveBookings: boolean;
}

export interface UpdateMasterRequest {
  photo?: string;
  description?: string;
  autoApproveBookings: boolean;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export interface CreateClientAccountRequest {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

// ── SalonMaster ───────────────────────────────────────────────────────────────

export interface SalonMasterDto {
  id: string;
  salonId: string;
  masterId: string;
  masterFirstName: string;
  masterLastName: string;
  isActive: boolean;
}

export interface SalonMasterWithSalonDto {
  id: string;
  salonId: string;
  masterId: string;
  salonName: string;
  isActive: boolean;
}

export interface LinkMasterToSalonRequest {
  masterId: string;
}

// ── Service ───────────────────────────────────────────────────────────────────

export interface ServiceDto {
  id: string;
  name: string;
  description?: string;
  photo?: string;
  createdAt: string;
}

export interface CreateServiceRequest {
  name: string;
  description?: string;
  photo?: string;
}

export type UpdateServiceRequest = CreateServiceRequest;

// ── MasterService ─────────────────────────────────────────────────────────────

export interface MasterServiceDto {
  id: string;
  masterId: string;
  serviceId: string;
  serviceName: string;
  servicePhoto?: string;
  photo?: string;
  description?: string;
  price: number;
  durationMinutes: number;
  isActive: boolean;
}

export interface AddMasterServiceRequest {
  serviceId: string;
  price: number;
  durationMinutes: number;
  photo?: string;
  description?: string;
}

export interface UpdateMasterServiceRequest {
  price: number;
  durationMinutes: number;
  photo?: string;
  clearPhoto?: boolean;
  description?: string;
}

// ── TimeSlot ──────────────────────────────────────────────────────────────────

export interface TimeSlotDto {
  id: string;
  salonMasterId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
}

// ── Booking ───────────────────────────────────────────────────────────────────

export interface BookingServiceDto {
  id: string;
  serviceId: string;
  serviceName: string;
  price: number;
  durationMinutes: number;
}

export interface BookingDto {
  id: string;
  salonId: string;
  salonName: string;
  masterId: string;
  masterName: string;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  totalDurationMinutes: number;
  status: string;
  createdAt: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  services: BookingServiceDto[];
}

export interface CreateBookingRequest {
  salonId: string;
  masterId: string;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  bookingDate: string;
  startTime: string;
  serviceIds: string[];
}

export interface CancelBookingRequest {
  side: 'Client' | 'Master';
  reason?: string;
}

export interface BookingFilters {
  salonId?: string;
  masterId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

// ── Rating ────────────────────────────────────────────────────────────────────

export interface RatingDto {
  id: string;
  masterId: string;
  bookingId?: string;
  clientName: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface CreateRatingRequest {
  bookingId?: string;
  clientName: string;
  rating: number;
  comment?: string;
}

export interface AverageRatingDto {
  average: number;
  count: number;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface UserDto {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  /** 'SuperAdmin' | 'SalonAdmin' | 'MasterAdmin' | 'Client' */
  role: string;
  salonId?: string;
  masterId?: string;
  mustChangePassword?: boolean;
}

export interface AdminUserDto {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: string;
  salonId?: string;
  masterId?: string;
  externalProvider?: string;
  isActive: boolean;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: UserDto;
}

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface RegisterRequest {
  email?: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  /** 'Client' | 'SalonAdmin' | 'MasterAdmin' */
  role?: string;
}

// ── Salon Admin Dashboard ────────────────────────────────────────────────────

export interface SalonAdminDashboardDto {
  activeMasters: number;
  pendingMasters: number;
  bookingsToday: number;
  bookingsThisWeek: number;
  bookingsThisMonth: number;
  revenueToday: number;
  revenueThisWeek: number;
  revenueThisMonth: number;
  cancellationRate30d: number;
  averageRating: number;
  pendingMastersList: PendingMasterDto[];
}

export interface PendingMasterDto {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  externalProvider?: string;
  createdAt: string;
}

export interface SalonAdminMasterDto {
  masterId: string;
  userId?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  photo?: string;
  isUserActive: boolean;
  isDeleted: boolean;
  averageRating?: number;
  ratingCount: number;
  servicesCount: number;
  createdAt: string;
}

// ── Availability ─────────────────────────────────────────────────────────────

export interface WeeklySlotDto {
  id: string;
  salonMasterId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

export interface SetWeeklyScheduleRequest {
  slots: WeeklySlotItemRequest[];
}

export interface WeeklySlotItemRequest {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

export interface DateOverrideDto {
  id: string;
  salonMasterId: string;
  date: string;
  isDayOff: boolean;
  slots: DateOverrideSlotDto[];
}

export interface DateOverrideSlotDto {
  id: string;
  startTime: string;
  endTime: string;
}

export interface UpsertDateOverrideRequest {
  date: string;
  isDayOff: boolean;
  slots?: DateOverrideSlotItemRequest[];
}

export interface DateOverrideSlotItemRequest {
  startTime: string;
  endTime: string;
}

export interface TimeOffDto {
  id: string;
  salonMasterId: string;
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface CreateTimeOffRequest {
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface UpdateTimeOffRequest {
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface ResolvedDayAvailability {
  date: string;
  source: 'weekly' | 'override' | 'off' | 'timeoff';
  windows: TimeWindow[];
}

export interface TimeWindow {
  startTime: string;
  endTime: string;
}
