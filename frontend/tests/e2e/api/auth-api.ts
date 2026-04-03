import { APIRequestContext } from '@playwright/test';

const BASE = '/api';

export interface LoginResponse {
  accessToken: string;
  user: { id: string; email: string; role: string; firstName?: string; lastName?: string };
}

/** Log in and return access token + user info. */
export async function apiLogin(
  request: APIRequestContext,
  identifier: string,
  password: string,
): Promise<LoginResponse> {
  const res = await request.post(`${BASE}/auth/login`, {
    data: { identifier, password },
  });
  if (!res.ok()) {
    const body = await res.text();
    throw new Error(`Login failed (${res.status()}): ${body}`);
  }
  return res.json();
}

/** Register a new master account (returns pending/inactive). */
export async function apiRegisterMaster(
  request: APIRequestContext,
  data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    salonId: string;
  },
): Promise<{ message: string }> {
  const res = await request.post(`${BASE}/auth/master/register`, { data });
  if (!res.ok()) {
    const body = await res.text();
    throw new Error(`Master register failed (${res.status()}): ${body}`);
  }
  return res.json();
}

/** Get a SuperAdmin access token. */
export async function getSuperAdminToken(request: APIRequestContext): Promise<string> {
  const { accessToken } = await apiLogin(request, 'admin@bookvisit.com', 'Admin123!');
  return accessToken;
}
