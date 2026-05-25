"use client";

import { ApiError } from "./client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function uploadImage(
  file: File,
): Promise<{ url: string; name: string; size: number }> {
  const formData = new FormData();
  formData.append("file", file);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("huoll_access_token")
      : null;

  const res = await fetch(`${API_BASE}/api/v1/articles/upload/`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    body = {};
  }

  if (!res.ok) {
    const wrapped = body as { message?: string; detail?: string };
    throw new ApiError(
      res.status,
      null,
      wrapped.message || wrapped.detail || `Upload failed (${res.status})`,
    );
  }

  const wrapped = body as { code?: number; data?: { url: string; name: string; size: number } };
  if (wrapped.data) {
    return wrapped.data;
  }
  throw new ApiError(res.status, null, "Invalid upload response");
}
