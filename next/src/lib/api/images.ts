"use client";

import { client } from "./client";

export type ImageItem = {
  url: string;
  name: string;
  size: number;
  created_at: string;
};

export async function listImages(): Promise<{ items: ImageItem[] }> {
  return client.get("/api/v1/articles/images/");
}

export async function deleteImage(url: string): Promise<void> {
  const qs = new URLSearchParams({ url });
  return client.del(`/api/v1/articles/images/delete/?${qs.toString()}`);
}
