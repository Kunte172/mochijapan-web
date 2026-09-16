const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    credentials: 'include',
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const message = body?.message ?? `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return body as T;
}
