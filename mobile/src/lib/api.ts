import { getBaseUrl, getToken } from './storage';
import { Incident, TokenResponse, URLItem, UserRead } from './types';

const API_KEY = 'dev-secret-key-change-in-production';

type Listener = () => void;
const unauthorizedListeners = new Set<Listener>();
export function onUnauthorized(listener: Listener): () => void {
  unauthorizedListeners.add(listener);
  return () => unauthorizedListeners.delete(listener);
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function normalizeDetail(detail: unknown, fallback: string): string {
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    const first = detail[0];
    if (first && typeof first.msg === 'string') return first.msg;
  }
  return fallback;
}

interface RequestOptions {
  method?: string;
  json?: unknown;
  form?: Record<string, string>;
  auth?: boolean;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const baseUrl = await getBaseUrl();
  if (!baseUrl) throw new ApiError(0, 'Server URL is not set. Open Settings and point the app at your server.');

  const headers: Record<string, string> = { 'X-API-Key': API_KEY };
  let body: string | undefined;
  if (options.form) {
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    body = new URLSearchParams(options.form).toString();
  } else if (options.json !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.json);
  }
  if (options.auth !== false) {
    const token = await getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body,
      signal: controller.signal,
    });
  } catch {
    throw new ApiError(0, 'Cannot reach the server — check the server URL and Wi-Fi.');
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 401 && options.auth !== false) {
    unauthorizedListeners.forEach((listener) => listener());
  }
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const data = await response.json();
      message = normalizeDetail(data?.detail, message);
    } catch {
      // keep fallback
    }
    throw new ApiError(response.status, message);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export function login(email: string, password: string): Promise<TokenResponse> {
  return request<TokenResponse>('/api/v1/auth/login', {
    method: 'POST',
    form: { username: email, password },
    auth: false,
  });
}

export function signup(fullName: string, email: string, password: string): Promise<UserRead> {
  return request<UserRead>('/api/v1/auth/signup', {
    method: 'POST',
    json: { full_name: fullName, email, password },
    auth: false,
  });
}

export function getMe(): Promise<UserRead> {
  return request<UserRead>('/api/v1/auth/me');
}

export function getUrls(): Promise<URLItem[]> {
  return request<URLItem[]>('/api/v1/urls');
}

export function getOpenIncidents(): Promise<Incident[]> {
  return request<Incident[]>('/api/v1/incidents?status=open');
}

export function acknowledgeIncident(id: number): Promise<Incident> {
  return request<Incident>(`/api/v1/incidents/${id}`, {
    method: 'PATCH',
    json: { acknowledged_at: new Date().toISOString() },
  });
}
