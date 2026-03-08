import type { RatingDto, CreateRatingRequest } from '@/types';
import apiClient from './client';

export const addRating = (masterId: string, data: CreateRatingRequest) =>
  apiClient.post<RatingDto>(`/masters/${masterId}/ratings`, data).then(r => r.data);

export const deleteRating = (id: string) =>
  apiClient.delete(`/ratings/${id}`);
