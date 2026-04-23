import apiClient from './client';

const API_BASE = '/api';

/**
 * If the value looks like an external URL, return it unchanged.
 * Otherwise treat it as a MinIO object key and route through the proxy endpoint.
 */
export function resolveMediaUrl(keyOrUrl?: string | null): string | undefined {
  if (!keyOrUrl) return undefined;
  if (keyOrUrl.startsWith('http://') || keyOrUrl.startsWith('https://')) return keyOrUrl;
  return `${API_BASE}/media/${keyOrUrl}`;
}

export interface UploadResult {
  key: string;
}

export async function uploadMedia(
  file: File,
  folder: string,
): Promise<UploadResult> {
  const form = new FormData();
  form.append('file', file);
  form.append('folder', folder);

  const { data } = await apiClient.post<UploadResult>('/media/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function deleteMedia(key: string): Promise<void> {
  await apiClient.delete(`/media/${key}`);
}
