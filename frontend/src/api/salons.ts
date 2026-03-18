import type { SalonDto, SalonDetailDto, CreateSalonRequest, UpdateSalonRequest, SalonMasterDto } from '@/types';
import apiClient from './client';

export const getSalons = () =>
  apiClient.get<SalonDto[]>('/salons').then(r => r.data);

export const getSalon = (id: string) =>
  apiClient.get<SalonDetailDto>(`/salons/${id}`).then(r => r.data);

export const getSalonBySlug = (slug: string) =>
  apiClient.get<SalonDetailDto>(`/salons/by-slug/${slug}`).then(r => r.data);

export const createSalon = (data: CreateSalonRequest) =>
  apiClient.post<SalonDto>('/salons', data).then(r => r.data);

export const updateSalon = (id: string, data: UpdateSalonRequest) =>
  apiClient.put<SalonDto>(`/salons/${id}`, data).then(r => r.data);

export const deleteSalon = (id: string) =>
  apiClient.delete(`/salons/${id}`);

export const getSalonMasters = (salonId: string) =>
  apiClient.get<SalonMasterDto[]>(`/salons/${salonId}/masters`).then(r => r.data);

export const linkMasterToSalon = (salonId: string, data: { masterId: string; workingHoursStart: string; workingHoursEnd: string; workingDays: string[] }) =>
  apiClient.post<SalonMasterDto>(`/salons/${salonId}/masters`, data).then(r => r.data);

export const unlinkMasterFromSalon = (salonId: string, masterId: string) =>
  apiClient.delete(`/salons/${salonId}/masters/${masterId}`);
