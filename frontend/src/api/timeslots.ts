import type { TimeSlotDto } from '@/types';
import apiClient from './client';

export const getAvailableSlots = (salonId: string, masterId: string, date: string, serviceIds: string[]) =>
  apiClient.get<TimeSlotDto[]>(`/salons/${salonId}/masters/${masterId}/slots`, {
    params: { date, serviceIds },
    paramsSerializer: { indexes: null },
  }).then(r => r.data);
