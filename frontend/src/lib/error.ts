/**
 * Extract a human-readable error message from an Axios error response.
 * Falls back to the provided default message if no backend error is found.
 */
export function getErrorMessage(err: unknown, fallback = 'An error occurred'): string {
  const axiosErr = err as { response?: { data?: { error?: string } } };
  return axiosErr?.response?.data?.error ?? fallback;
}
