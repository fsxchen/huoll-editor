"use client";

import { client } from "./client";

export type Article = {
  id: string;
  title: string;
  slug: string;
  author: {
    id: string;
    username: string;
    nickname?: string;
    avatar?: string;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  };
  cover_image?: string;
  summary: string;
  content: string;
  content_type: "markdown" | "html" | "richtext";
  doc_type: "blog" | "docs" | "report" | "presentation" | "landing";
  tags: { id: string; name: string; slug: string }[];
  status: "draft" | "published" | "archived";
  is_featured: boolean;
  is_top: boolean;
  is_original: boolean;
  source_url: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  collect_count: number;
  share_count: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ArticleList = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Article[];
};

export type CreateArticlePayload = {
  title: string;
  category?: string;
  cover_image?: string;
  summary?: string;
  content?: string;
  content_type?: "markdown" | "html" | "richtext";
  doc_type?: "blog" | "docs" | "report" | "presentation" | "landing";
  tags?: string[];
  status?: "draft" | "published" | "archived";
  is_original?: boolean;
  source_url?: string;
};

export async function listArticles(
  params?: Record<string, string>,
): Promise<ArticleList> {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return client.get<ArticleList>(`/api/v1/articles/${qs}`);
}

export async function createArticle(
  payload: CreateArticlePayload,
): Promise<Article> {
  return client.post<Article>("/api/v1/articles/", payload);
}

export async function getArticle(id: string): Promise<Article> {
  return client.get<Article>(`/api/v1/articles/${id}/`);
}

export async function updateArticle(
  id: string,
  payload: Partial<CreateArticlePayload>,
): Promise<Article> {
  return client.patch<Article>(`/api/v1/articles/${id}/`, payload);
}

export async function deleteArticle(id: string): Promise<void> {
  return client.del<void>(`/api/v1/articles/${id}/`);
}

export async function publishArticle(id: string): Promise<void> {
  return client.post<void>(`/api/v1/articles/${id}/publish/`, {});
}

export async function getDraft(id: string): Promise<{
  title: string;
  content: string;
  saved_at: string;
}> {
  return client.get(`/api/v1/articles/${id}/draft/`);
}

export async function saveDraft(
  id: string,
  payload: { title?: string; content?: string },
): Promise<void> {
  return client.post<void>(`/api/v1/articles/${id}/draft/`, payload);
}
