import apiClient from './client';
import type {
  SalonAdminDashboardDto,
  SalonAdminMasterDto,
  MasterDto,
  CreateMasterRequest,
  BookingDto,
  BookingFilters,
  SalonDetailDto,
  UpdateSalonRequest,
  CancelBookingRequest,
} from '@/types';

export async function getSalonAdminDashboard(): Promise<SalonAdminDashboardDto> {
  const { data } = await apiClient.get<SalonAdminDashboardDto>('/salon-admin/dashboard');
  return data;
}

export async function getSalonAdminBookings(filters?: BookingFilters): Promise<BookingDto[]> {
  const { data } = await apiClient.get<BookingDto[]>('/salon-admin/bookings', {
    params: {
      masterId: filters?.masterId || undefined,
      status: filters?.status || undefined,
      dateFrom: filters?.dateFrom || undefined,
      dateTo: filters?.dateTo || undefined,
    },
  });
  return data;
}

export async function confirmSalonAdminBooking(id: string): Promise<BookingDto> {
  const { data } = await apiClient.put<BookingDto>(`/salon-admin/bookings/${id}/confirm`);
  return data;
}

export async function completeSalonAdminBooking(id: string): Promise<BookingDto> {
  const { data } = await apiClient.put<BookingDto>(`/salon-admin/bookings/${id}/complete`);
  return data;
}

export async function cancelSalonAdminBooking(id: string, req: CancelBookingRequest): Promise<BookingDto> {
  const { data } = await apiClient.put<BookingDto>(`/salon-admin/bookings/${id}/cancel`, req);
  return data;
}

export async function getSalonAdminMasters(): Promise<SalonAdminMasterDto[]> {
  const { data } = await apiClient.get<SalonAdminMasterDto[]>('/salon-admin/masters');
  return data;
}

export async function searchAvailableMasters(q: string): Promise<MasterDto[]> {
  const { data } = await apiClient.get<MasterDto[]>('/salon-admin/masters/search', { params: { q } });
  return data;
}

export async function linkMasterToSalon(masterId: string): Promise<void> {
  await apiClient.post('/salon-admin/masters/link', { masterId });
}

export async function createSalonAdminMaster(data: CreateMasterRequest): Promise<MasterDto> {
  const { data: result } = await apiClient.post<MasterDto>('/salon-admin/masters', data);
  return result;
}

export async function removeSalonAdminMaster(masterId: string): Promise<void> {
  await apiClient.delete(`/salon-admin/masters/${masterId}`);
}

export async function getSalonAdminSettings(): Promise<SalonDetailDto> {
  const { data } = await apiClient.get<SalonDetailDto>('/salon-admin/settings');
  return data;
}

export async function updateSalonAdminSettings(req: UpdateSalonRequest): Promise<SalonDetailDto> {
  const { data } = await apiClient.put<SalonDetailDto>('/salon-admin/settings', req);
  return data;
}
