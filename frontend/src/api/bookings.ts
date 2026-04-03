import type { BookingDto, CreateBookingRequest, CancelBookingRequest, BookingFilters } from '@/types';
import apiClient from './client';

export const getBookings = (filters?: BookingFilters) =>
  apiClient.get<BookingDto[]>('/bookings', { params: filters }).then(r => r.data);

export const getMyBookings = (salonId?: string) =>
  apiClient.get<BookingDto[]>('/bookings/my', { params: salonId ? { salonId } : undefined }).then(r => r.data);

export const getBooking = (id: string) =>
  apiClient.get<BookingDto>(`/bookings/${id}`).then(r => r.data);

export const createBooking = (data: CreateBookingRequest) =>
  apiClient.post<BookingDto>('/bookings', data).then(r => r.data);

export const confirmBooking = (id: string) =>
  apiClient.put<BookingDto>(`/bookings/${id}/confirm`).then(r => r.data);

export const completeBooking = (id: string) =>
  apiClient.put<BookingDto>(`/bookings/${id}/complete`).then(r => r.data);

export const cancelBooking = (id: string, data: CancelBookingRequest) =>
  apiClient.put<BookingDto>(`/bookings/${id}/cancel`, data).then(r => r.data);

export const getSalonBookings = (salonId: string) =>
  apiClient.get<BookingDto[]>(`/salons/${salonId}/bookings`).then(r => r.data);

export const getMasterBookings = (masterId: string) =>
  apiClient.get<BookingDto[]>(`/masters/${masterId}/bookings`).then(r => r.data);
