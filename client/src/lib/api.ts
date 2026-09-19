import { refreshRequest } from '../features/auth/api/auth.api';
import { useAuthStore } from '../features/auth/store/auth.store';

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

async function readJson(response: Response) {
  return response.json().catch(() => null);
}

function requestError(response: Response, body: any) {
  const error = new Error(body?.message ?? `Request failed with status ${response.status}`);
  return Object.assign(error, { status: response.status, code: body?.code });
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    credentials: 'include',
  });
  const body = await readJson(response);
  if (!response.ok) throw requestError(response, body);
  return body as T;
}

export async function apiAuthRequest<T>(
  path: string,
  init: RequestInit = {},
  retried = false,
): Promise<T> {
  const state = useAuthStore.getState();
  const headers = new Headers(init.headers);

  if (state.accessToken) {
    headers.set('Authorization', `Bearer ${state.accessToken}`);
  }

  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    credentials: 'include',
    headers,
  });

  if (response.status === 401 && !retried) {
    try {
      const refreshed = await refreshRequest();
      useAuthStore.getState().setAccessToken(refreshed.accessToken);
      return apiAuthRequest<T>(path, init, true);
    } catch {
      useAuthStore.getState().clearAuth();
    }
  }

  const body = response.status === 204 ? null : await readJson(response);
  if (!response.ok) throw requestError(response, body);
  return body as T;
}
