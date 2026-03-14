import apiClient from './client';
import type {
  WeeklySlotDto,
  SetWeeklyScheduleRequest,
  DateOverrideDto,
  UpsertDateOverrideRequest,
  TimeOffDto,
  CreateTimeOffRequest,
  UpdateTimeOffRequest,
  ResolvedDayAvailability,
} from '@/types';

const base = (salonId: string, masterId: string) =>
  `/salons/${salonId}/masters/${masterId}/availability`;

// ── Weekly Schedule ──────────────────────────────────────────────────────────

export async function getWeeklySchedule(salonId: string, masterId: string): Promise<WeeklySlotDto[]> {
  const { data } = await apiClient.get<WeeklySlotDto[]>(`${base(salonId, masterId)}/weekly`);
  return data;
}

export async function setWeeklySchedule(
  salonId: string, masterId: string, req: SetWeeklyScheduleRequest,
): Promise<WeeklySlotDto[]> {
  const { data } = await apiClient.put<WeeklySlotDto[]>(`${base(salonId, masterId)}/weekly`, req);
  return data;
}

// ── Date Overrides ───────────────────────────────────────────────────────────

export async function getDateOverrides(
  salonId: string, masterId: string, from?: string, to?: string,
): Promise<DateOverrideDto[]> {
  const { data } = await apiClient.get<DateOverrideDto[]>(`${base(salonId, masterId)}/overrides`, {
    params: { from, to },
  });
  return data;
}

export async function upsertDateOverride(
  salonId: string, masterId: string, req: UpsertDateOverrideRequest,
): Promise<DateOverrideDto> {
  const { data } = await apiClient.put<DateOverrideDto>(`${base(salonId, masterId)}/overrides`, req);
  return data;
}

export async function deleteDateOverride(
  salonId: string, masterId: string, overrideId: string,
): Promise<void> {
  await apiClient.delete(`${base(salonId, masterId)}/overrides/${overrideId}`);
}

// ── Time Off ─────────────────────────────────────────────────────────────────

export async function getTimeOffs(salonId: string, masterId: string): Promise<TimeOffDto[]> {
  const { data } = await apiClient.get<TimeOffDto[]>(`${base(salonId, masterId)}/timeoff`);
  return data;
}

export async function createTimeOff(
  salonId: string, masterId: string, req: CreateTimeOffRequest,
): Promise<TimeOffDto> {
  const { data } = await apiClient.post<TimeOffDto>(`${base(salonId, masterId)}/timeoff`, req);
  return data;
}

export async function updateTimeOff(
  salonId: string, masterId: string, timeOffId: string, req: UpdateTimeOffRequest,
): Promise<TimeOffDto> {
  const { data } = await apiClient.put<TimeOffDto>(`${base(salonId, masterId)}/timeoff/${timeOffId}`, req);
  return data;
}

export async function deleteTimeOff(
  salonId: string, masterId: string, timeOffId: string,
): Promise<void> {
  await apiClient.delete(`${base(salonId, masterId)}/timeoff/${timeOffId}`);
}

// ── Resolved Availability ────────────────────────────────────────────────────

export async function resolveAvailability(
  salonId: string, masterId: string, startDate: string, endDate: string,
): Promise<ResolvedDayAvailability[]> {
  const { data } = await apiClient.get<ResolvedDayAvailability[]>(`${base(salonId, masterId)}/resolve`, {
    params: { startDate, endDate },
  });
  return data;
}
