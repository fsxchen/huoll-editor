"use client";

import { client } from "./client";

export type Tag = {
  id: string;
  name: string;
  slug: string;
  description: string;
  article_count: number;
};

export async function listTags(
  params?: Record<string, string>,
): Promise<Tag[]> {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return client.get<Tag[]>(`/api/v1/articles/tags/${qs}`);
}
