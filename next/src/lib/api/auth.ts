"use client";

import { client } from "./client";

export type User = {
  id: string;
  username: string;
  email: string;
  nickname?: string;
  avatar?: string;
  bio?: string;
  role?: string;
  follower_count?: number;
  following_count?: number;
  article_count?: number;
};

export type Tokens = {
  access: string;
  refresh: string;
};

export async function login(
  username: string,
  password: string,
): Promise<{ user: User; tokens: Tokens }> {
  const res = await client.post<{ user: User; tokens: Tokens }>(
    "/api/v1/auth/login/",
    { username, password },
  );
  return res;
}

export async function register(payload: {
  username: string;
  email: string;
  password: string;
  password2: string;
  nickname?: string;
  phone?: string;
}): Promise<{ user: User; tokens: Tokens }> {
  const res = await client.post<{ user: User; tokens: Tokens }>(
    "/api/v1/auth/register/",
    payload,
  );
  return res;
}

export async function getMe(): Promise<User> {
  return client.get<User>("/api/v1/users/users/me/");
}

export async function logout(): Promise<void> {
  const refresh =
    typeof window !== "undefined"
      ? localStorage.getItem("huoll_refresh_token")
      : null;
  if (refresh) {
    try {
      await client.post("/api/v1/auth/logout/", { refresh });
    } catch {
      // ignore
    }
  }
}
