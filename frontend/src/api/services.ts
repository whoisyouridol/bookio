import type { ServiceDto, CreateServiceRequest, UpdateServiceRequest } from '@/types';
import apiClient from './client';

export const getServices = () =>
  apiClient.get<ServiceDto[]>('/services').then(r => r.data);

export const createService = (data: CreateServiceRequest) =>
  apiClient.post<ServiceDto>('/services', data).then(r => r.data);

export const updateService = (id: string, data: UpdateServiceRequest) =>
  apiClient.put<ServiceDto>(`/services/${id}`, data).then(r => r.data);

export const deleteService = (id: string) =>
  apiClient.delete(`/services/${id}`);
