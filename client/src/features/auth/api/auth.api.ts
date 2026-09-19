import type { AuthResponse, MeResponse, RefreshResponse } from '../types';

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

async function readJson(response: Response) {
  return response.json().catch(() => null);
}

function errorFromResponse(response: Response, body: any) {
  const error = new Error(body?.message ?? `Request failed with status ${response.status}`);
  return Object.assign(error, { status: response.status, code: body?.code });
}

async function authPost<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const payload = await readJson(response);
  if (!response.ok) throw errorFromResponse(response, payload);
  return payload as T;
}

export function loginRequest(input: { email: string; password: string }) {
  return authPost<AuthResponse>('/auth/login', input);
}

export function registerRequest(input: { email: string; password: string; displayName?: string }) {
  return authPost<AuthResponse>('/auth/register', input);
}

let refreshPromise: Promise<RefreshResponse> | null = null;

export function refreshRequest() {
  if (!refreshPromise) {
    refreshPromise = authPost<RefreshResponse>('/auth/refresh').finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export async function meRequest(accessToken: string) {
  const response = await fetch(`${apiBaseUrl}/auth/me`, {
    credentials: 'include',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const payload = await readJson(response);
  if (!response.ok) throw errorFromResponse(response, payload);
  return payload as MeResponse;
}

export async function logoutRequest() {
  const response = await fetch(`${apiBaseUrl}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!response.ok && response.status !== 204) {
    const payload = await readJson(response);
    throw errorFromResponse(response, payload);
  }
}
