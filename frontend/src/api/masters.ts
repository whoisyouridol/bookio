import type { MasterDto, CreateMasterRequest, UpdateMasterRequest, MasterServiceDto, RatingDto, AverageRatingDto, AddMasterServiceRequest, UpdateMasterServiceRequest, SalonMasterWithSalonDto } from '@/types';
import apiClient from './client';

export const getMasters = () =>
  apiClient.get<MasterDto[]>('/masters').then(r => r.data);

export const getMaster = (id: string) =>
  apiClient.get<MasterDto>(`/masters/${id}`).then(r => r.data);

export const createMaster = (data: CreateMasterRequest) =>
  apiClient.post<MasterDto>('/masters', data).then(r => r.data);

export const updateMaster = (id: string, data: UpdateMasterRequest) =>
  apiClient.put<MasterDto>(`/masters/${id}`, data).then(r => r.data);

export const deleteMaster = (id: string) =>
  apiClient.delete(`/masters/${id}`);

export const getMasterServices = (masterId: string) =>
  apiClient.get<MasterServiceDto[]>(`/masters/${masterId}/services`).then(r => r.data);

export const addMasterService = (masterId: string, data: AddMasterServiceRequest) =>
  apiClient.post<MasterServiceDto>(`/masters/${masterId}/services`, data).then(r => r.data);

export const updateMasterService = (masterId: string, serviceId: string, data: UpdateMasterServiceRequest) =>
  apiClient.put<MasterServiceDto>(`/masters/${masterId}/services/${serviceId}`, data).then(r => r.data);

export const removeMasterService = (masterId: string, serviceId: string) =>
  apiClient.delete(`/masters/${masterId}/services/${serviceId}`);

export const getMasterRatings = (masterId: string) =>
  apiClient.get<RatingDto[]>(`/masters/${masterId}/ratings`).then(r => r.data);

export const getMasterAverageRating = (masterId: string) =>
  apiClient.get<AverageRatingDto>(`/masters/${masterId}/average-rating`).then(r => r.data);

export const getMasterSalons = (masterId: string) =>
  apiClient.get<SalonMasterWithSalonDto[]>(`/masters/${masterId}/salons`).then(r => r.data);
