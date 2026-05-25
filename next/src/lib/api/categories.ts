"use client";

import { client } from "./client";

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  image?: string;
  parent?: string | null;
  type: "article" | "product";
  sort_order: number;
  is_active: boolean;
  article_count: number;
  created_at: string;
};

export type CategoryTree = Category & {
  children: CategoryTree[];
};

export async function listCategories(
  params?: Record<string, string>,
): Promise<{ items: Category[] }> {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return client.get(`/api/v1/articles/categories/${qs}`);
}

export async function getCategoryTree(): Promise<{
  items: CategoryTree[];
}> {
  return client.get("/api/v1/articles/categories/tree/");
}
