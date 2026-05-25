"use client";

/**
 * Thin HTTP client for the Django backend. Handles:
 * - Base URL from NEXT_PUBLIC_API_URL
 * - Automatic Authorization: Bearer <token>
 * - 401 refresh with stored refresh token
 * - Response format unification (backend wraps some endpoints in {code,data})
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const ACCESS_KEY = "huoll_access_token";
const REFRESH_KEY = "huoll_refresh_token";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: number | null,
    message: string,
  ) {
    super(message);
  }
}

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_KEY);
}

function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(access: string, refresh: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

async function doRefresh(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;
  try {
    const res = await fetch(`${API_BASE}/api/v1/auth/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { access?: string };
    if (body.access) {
      localStorage.setItem(ACCESS_KEY, body.access);
      return body.access;
    }
  } catch {
    // ignore
  }
  return null;
}

async function parseResponse<T>(res: Response): Promise<T> {
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    body = {};
  }

  if (!res.ok) {
    const wrapped = body as { message?: string; detail?: string; code?: number };
    const message = wrapped.message || wrapped.detail || `HTTP ${res.status}`;
    throw new ApiError(res.status, wrapped.code ?? null, message);
  }

  const wrapped = body as { code?: number; data?: unknown };
  if (typeof wrapped.code === "number" && "data" in wrapped) {
    return wrapped.data as T;
  }
  return body as T;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${path}`;
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  const token = getAccessToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let res = await fetch(url, { ...options, headers });

  if (res.status === 401 && getRefreshToken()) {
    const newAccess = await doRefresh();
    if (newAccess) {
      headers.set("Authorization", `Bearer ${newAccess}`);
      res = await fetch(url, { ...options, headers });
    } else {
      clearTokens();
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    }
  }

  return parseResponse<T>(res);
}

export const client = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
