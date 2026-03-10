// ── Salon ─────────────────────────────────────────────────────────────────────

export interface SalonDto {
  id: string;
  name: string;
  address: string;
  googleMapsUrl?: string;
  yandexMapsUrl?: string;
  workingHoursStart: string;
  workingHoursEnd: string;
  workingDays: string[];
  photos: string[];
  videos: string[];
  isActive: boolean;
  createdAt: string;
}

export interface SalonDetailDto extends SalonDto {
  masters: SalonMasterDto[];
}

export interface CreateSalonRequest {
  name: string;
  address: string;
  googleMapsUrl?: string;
  yandexMapsUrl?: string;
  workingHoursStart: string;
  workingHoursEnd: string;
  workingDays: string[];
  photos?: string[];
  videos?: string[];
}

export type UpdateSalonRequest = CreateSalonRequest;

// ── Master ────────────────────────────────────────────────────────────────────

export interface MasterDto {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  photo?: string;
  description?: string;
  autoApproveBookings: boolean;
  isActive: boolean;
  createdAt: string;
  averageRating?: number;
  ratingCount: number;
}

export interface CreateMasterRequest {
  firstName: string;
  lastName: string;
  phone: string;
  photo?: string;
  description?: string;
  autoApproveBookings: boolean;
}

export type UpdateMasterRequest = CreateMasterRequest;

// ── SalonMaster ───────────────────────────────────────────────────────────────

export interface SalonMasterDto {
  id: string;
  salonId: string;
  masterId: string;
  masterFirstName: string;
  masterLastName: string;
  workingHoursStart: string;
  workingHoursEnd: string;
  workingDays: string[];
  isActive: boolean;
}

export interface LinkMasterToSalonRequest {
  masterId: string;
  workingHoursStart: string;
  workingHoursEnd: string;
  workingDays: string[];
}

export interface UpdateSalonMasterRequest {
  workingHoursStart: string;
  workingHoursEnd: string;
  workingDays: string[];
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
  status: 'Available' | 'Booked' | 'Blocked';
}

export interface GenerateSlotsRequest {
  startDate: string;
  endDate: string;
  slotDurationMinutes: number;
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
  clientPhone: string;
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
  clientPhone: string;
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
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  /** 'SuperAdmin' | 'SalonAdmin' | 'MasterAdmin' | 'Client' */
  role: string;
  salonId?: string;
  masterId?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: UserDto;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  /** 'Client' | 'SalonAdmin' | 'MasterAdmin' */
  role?: string;
}

// ── Theme ─────────────────────────────────────────────────────────────────────

export interface SalonTheme {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  fontFamily: string;
  borderRadius: string;
}
