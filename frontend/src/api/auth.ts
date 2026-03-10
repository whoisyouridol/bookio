import apiClient from './client';
import type { AuthResponse, UserDto, LoginRequest, RegisterRequest } from '@/types';

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

export async function loginWithFacebook(accessToken: string): Promise<AuthResponse> {
  const { data: res } = await apiClient.post<AuthResponse>('/auth/facebook', { accessToken });
  return res;
}

export async function refreshSession(): Promise<AuthResponse> {
  const { data: res } = await apiClient.post<AuthResponse>('/auth/refresh');
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

export async function forgotPassword(email: string): Promise<void> {
  await apiClient.post('/auth/forgot-password', { email });
}

export async function resetPassword(email: string, token: string, newPassword: string): Promise<void> {
  await apiClient.post('/auth/reset-password', { email, token, newPassword });
}
