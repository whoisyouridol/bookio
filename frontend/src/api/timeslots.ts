import type { TimeSlotDto, GenerateSlotsRequest } from '@/types';
import apiClient from './client';

export const getAvailableSlots = (salonId: string, masterId: string, date: string, serviceIds: string[]) =>
  apiClient.get<TimeSlotDto[]>(`/salons/${salonId}/masters/${masterId}/slots`, {
    params: { date, serviceIds },
    paramsSerializer: { indexes: null },
  }).then(r => r.data);

export const generateSlots = (salonId: string, masterId: string, data: GenerateSlotsRequest) =>
  apiClient.post(`/salons/${salonId}/masters/${masterId}/slots/generate`, data).then(r => r.data);
