import type { ApiResponse } from "@na-flow/shared-types";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1";

export interface SessionUser {
  sub: string;
  email: string;
  name: string;
  role: string;
  assignedVehicleId?: string;
  assignedRoute?: string;
  passwordChangeAllowed?: boolean;
}

export interface LoginResult {
  user: SessionUser;
  accessToken: string;
  refreshToken: string;
}

export class ApiClientError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
  }
}

export function getStoredToken(): string | null {
  return window.localStorage.getItem("na-flow-token");
}

export function setStoredToken(token: string | null): void {
  if (token) {
    window.localStorage.setItem("na-flow-token", token);
    return;
  }

  window.localStorage.removeItem("na-flow-token");
}

export async function apiGet<T>(path: string): Promise<T> {
  return apiRequest<T>(path, { method: "GET" });
}

export async function apiPatch<T>(path: string): Promise<T> {
  return apiRequest<T>(path, { method: "PATCH" });
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const init: RequestInit = { method: "POST" };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }
  return apiRequest<T>(path, init);
}

async function apiRequest<T>(path: string, init: RequestInit): Promise<T> {
  const token = getStoredToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers
    }
  });
  const payload = (await response.json()) as ApiResponse<T>;

  if (!payload.success) {
    throw new ApiClientError(payload.error.code, payload.error.message);
  }

  return payload.data;
}

export async function login(identifier: string, password: string): Promise<LoginResult> {
  return apiPost<LoginResult>("/auth/login", { identifier, password });
}
