import type { ApiResult } from '@models/api';

const API_BASE = import.meta.env.VITE_API_BASE_URL as string | undefined;

if (!API_BASE) {
  
  console.warn('VITE_API_BASE_URL not set. Using http://localhost:5186 as default.');
}

const baseUrl = (API_BASE ?? 'http://localhost:5186').replace(/\/$/, '');


export const apiBaseUrl = baseUrl;

const demoSession =
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export async function getJson<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  const res = await fetch(`${baseUrl}${path}`, {
    headers: { Accept: 'application/json', 'X-Demo-Session': demoSession },
    credentials: 'include',
    ...init,
  });
  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  if (!isJson) {
    return { status: 'error', error: { title: 'Invalid response', detail: 'Expected JSON response from API' } } as ApiResult<T>;
  }
  const body = await res.json();
  return body as ApiResult<T>;
}

export async function postJson<T, B = unknown>(path: string, body?: B): Promise<ApiResult<T>> {
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-Demo-Session': demoSession },
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  return data as ApiResult<T>;
}

export async function putJson<T, B = unknown>(path: string, body: B): Promise<ApiResult<T>> {
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'PUT',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-Demo-Session': demoSession },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return data as ApiResult<T>;
}

export async function patchJson<T, B = unknown>(path: string, body: B): Promise<ApiResult<T>> {
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'PATCH',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-Demo-Session': demoSession },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return data as ApiResult<T>;
}

export async function deleteJson<T>(path: string): Promise<ApiResult<T>> {
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json', 'X-Demo-Session': demoSession },
    credentials: 'include',
  });
  const data = await res.json();
  return data as ApiResult<T>;
}
