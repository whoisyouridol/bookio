import apiClient from './client';
import type { AuthResponse, UserDto, LoginRequest, RegisterRequest, AdminUserDto, CreateClientAccountRequest } from '@/types';

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const { data: res } = await apiClient.post<AuthResponse>('/auth/login', data);
  return res;
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const { data: res } = await apiClient.post<AuthResponse>('/auth/register', data);
  return res;
}

export async function loginWithGoogle(credential: string): Promise<AuthResponse> {
  const { data: res } = await apiClient.post<AuthResponse>('/auth/google', { credential });
  return res;
}

export async function loginWithGoogleAccessToken(accessToken: string): Promise<AuthResponse> {
  const { data: res } = await apiClient.post<AuthResponse>('/auth/google', { accessToken });
  return res;
}

export async function loginWithFacebook(accessToken: string): Promise<AuthResponse> {
  const { data: res } = await apiClient.post<AuthResponse>('/auth/facebook', { accessToken });
  return res;
}

export async function refreshSession(): Promise<AuthResponse> {
  const { data: res } = await apiClient.post<AuthResponse>('/auth/refresh');
  return res;
}

export async function reissueSession(): Promise<AuthResponse> {
  const { data: res } = await apiClient.post<AuthResponse>('/auth/reissue');
  return res;
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
}

export async function getMe(): Promise<UserDto> {
  const { data } = await apiClient.get<UserDto>('/auth/me');
  return data;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await apiClient.post('/auth/change-password', { currentPassword, newPassword });
}

export async function forgotPassword(identifier: string): Promise<void> {
  await apiClient.post('/auth/forgot-password', { identifier });
}

export async function resetPassword(email: string, token: string, newPassword: string): Promise<void> {
  await apiClient.post('/auth/reset-password', { email, token, newPassword });
}

export async function registerMaster(data: {
  email?: string; password: string; firstName: string; lastName: string; phone?: string; salonId: string;
}): Promise<{ message: string }> {
  const { data: res } = await apiClient.post<{ message: string }>('/auth/master/register', data);
  return res;
}

export async function registerMasterWithGoogle(credential: string, salonId: string): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>('/auth/master/google', { credential, salonId });
  return data;
}

export async function registerMasterWithGoogleAccessToken(accessToken: string, salonId: string): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>('/auth/master/google', { accessToken, salonId });
  return data;
}

export async function registerMasterWithFacebook(accessToken: string, salonId: string): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>('/auth/master/facebook', { accessToken, salonId });
  return data;
}

export async function registerSalonAdmin(data: {
  email?: string; password: string; firstName: string; lastName: string; phone?: string; salonId: string;
}): Promise<{ message: string }> {
  const { data: res } = await apiClient.post<{ message: string }>('/auth/salon-admin/register', data);
  return res;
}

export async function registerSalonAdminWithNewSalon(data: {
  email?: string; password: string; firstName: string; lastName: string; phone?: string;
  salonName: string; salonAddress: string; workingHoursStart: string; workingHoursEnd: string; workingDays: string[];
}): Promise<{ message: string }> {
  const { data: res } = await apiClient.post<{ message: string }>('/auth/salon-admin/register-with-salon', data);
  return res;
}

export async function registerSalonAdminWithGoogle(credential: string, salonId: string): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>('/auth/salon-admin/google', { credential, salonId });
  return data;
}

export async function registerSalonAdminWithGoogleAccessToken(accessToken: string, salonId: string): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>('/auth/salon-admin/google', { accessToken, salonId });
  return data;
}

export async function registerSalonAdminWithFacebook(accessToken: string, salonId: string): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>('/auth/salon-admin/facebook', { accessToken, salonId });
  return data;
}

export async function getAdminUsers(role?: string): Promise<AdminUserDto[]> {
  const { data } = await apiClient.get<AdminUserDto[]>('/admin/users', {
    params: role ? { role } : undefined,
  });
  return data;
}

export async function getAdminUser(id: string): Promise<AdminUserDto> {
  const { data } = await apiClient.get<AdminUserDto>(`/admin/users/${id}`);
  return data;
}

export async function updateUserProfile(id: string, data: {
  firstName?: string; lastName?: string; phone?: string; email?: string;
}): Promise<AdminUserDto> {
  const { data: res } = await apiClient.put<AdminUserDto>(`/admin/users/${id}`, data);
  return res;
}

export async function setUserActive(id: string, isActive: boolean): Promise<AdminUserDto> {
  const { data } = await apiClient.put<AdminUserDto>(`/admin/users/${id}/active`, { isActive });
  return data;
}

export async function updateUserRole(id: string, data: {
  role: string; salonId?: string; masterId?: string;
}): Promise<AdminUserDto> {
  const { data: res } = await apiClient.put<AdminUserDto>(`/admin/users/${id}/role`, data);
  return res;
}

export async function deleteAdminUser(id: string): Promise<void> {
  await apiClient.delete(`/admin/users/${id}`);
}

export async function createClientAccount(data: CreateClientAccountRequest): Promise<AdminUserDto> {
  const { data: res } = await apiClient.post<AdminUserDto>('/admin/users', { ...data, role: 'Client' });
  return res;
}
