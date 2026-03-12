import { APIRequestContext } from '@playwright/test';

const BASE = '/api';

export interface AdminUser {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  firstName?: string;
  lastName?: string;
}

/** Get all admin users, optionally filtered by role. Requires SuperAdmin token. */
export async function getAdminUsers(
  request: APIRequestContext,
  token: string,
  role?: string,
): Promise<AdminUser[]> {
  const url = role ? `${BASE}/admin/users?role=${role}` : `${BASE}/admin/users`;
  const res = await request.get(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok()) throw new Error(`getAdminUsers failed (${res.status()})`);
  return res.json();
}

/** Activate or deactivate a user. Requires SuperAdmin token. */
export async function setUserActive(
  request: APIRequestContext,
  token: string,
  userId: string,
  isActive: boolean,
): Promise<AdminUser> {
  const res = await request.put(`${BASE}/admin/users/${userId}/active`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { isActive },
  });
  if (!res.ok()) throw new Error(`setUserActive failed (${res.status()})`);
  return res.json();
}

/** Delete a user. Requires SuperAdmin token. */
export async function deleteUser(
  request: APIRequestContext,
  token: string,
  userId: string,
): Promise<void> {
  const res = await request.delete(`${BASE}/admin/users/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok()) throw new Error(`deleteUser failed (${res.status()})`);
}

/** Get public salons list (no auth needed). */
export async function getSalons(
  request: APIRequestContext,
): Promise<{ id: string; name: string }[]> {
  const res = await request.get(`${BASE}/salons`);
  if (!res.ok()) throw new Error(`getSalons failed (${res.status()})`);
  return res.json();
}
