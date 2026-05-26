"use client";

export type PublishArticle = {
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

export type CreatePublishArticlePayload = {
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
  slug?: string;
};

export type PublishArticleList = {
  count: number;
  next: string | null;
  previous: string | null;
  results: PublishArticle[];
};

export class PublishApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

function getHeaders(apiKey: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    "X-API-Key": apiKey,
  };
}

async function parseResponse<T>(res: Response): Promise<T> {
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    body = {};
  }

  if (!res.ok) {
    const wrapped = body as { message?: string; detail?: string };
    throw new PublishApiError(
      res.status,
      wrapped.message || wrapped.detail || `HTTP ${res.status}`,
    );
  }

  const wrapped = body as { code?: number; data?: unknown };
  if (typeof wrapped.code === "number" && "data" in wrapped) {
    return wrapped.data as T;
  }
  return body as T;
}

export async function listPublishArticles(
  baseUrl: string,
  apiKey: string,
  params?: Record<string, string>,
): Promise<PublishArticleList> {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  const url = `${baseUrl.replace(/\/+$/, "")}/api/v1/articles/${qs}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "X-API-Key": apiKey,
    },
  });
  return parseResponse<PublishArticleList>(res);
}

export async function createPublishArticle(
  baseUrl: string,
  apiKey: string,
  payload: CreatePublishArticlePayload,
): Promise<PublishArticle> {
  const url = `${baseUrl.replace(/\/+$/, "")}/api/v1/articles/`;
  const res = await fetch(url, {
    method: "POST",
    headers: getHeaders(apiKey),
    body: JSON.stringify(payload),
  });
  return parseResponse<PublishArticle>(res);
}

export async function updatePublishArticle(
  baseUrl: string,
  apiKey: string,
  id: string,
  payload: Partial<CreatePublishArticlePayload>,
): Promise<PublishArticle> {
  const url = `${baseUrl.replace(/\/+$/, "")}/api/v1/articles/${id}/`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: getHeaders(apiKey),
    body: JSON.stringify(payload),
  });
  return parseResponse<PublishArticle>(res);
}

export async function publishPublishArticle(
  baseUrl: string,
  apiKey: string,
  id: string,
): Promise<void> {
  const url = `${baseUrl.replace(/\/+$/, "")}/api/v1/articles/${id}/publish/`;
  const res = await fetch(url, {
    method: "POST",
    headers: getHeaders(apiKey),
    body: JSON.stringify({}),
  });
  return parseResponse<void>(res);
}

export async function uploadPublishImage(
  baseUrl: string,
  apiKey: string,
  file: File,
): Promise<{ url: string; name: string; size: number }> {
  const formData = new FormData();
  formData.append("file", file);

  const url = `${baseUrl.replace(/\/+$/, "")}/api/v1/articles/upload/`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "X-API-Key": apiKey,
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
    throw new PublishApiError(
      res.status,
      wrapped.message || wrapped.detail || `Upload failed (${res.status})`,
    );
  }

  const wrapped = body as { code?: number; data?: { url: string; name: string; size: number } };
  if (wrapped.data) {
    return wrapped.data;
  }
  throw new PublishApiError(res.status, "Invalid upload response");
}
