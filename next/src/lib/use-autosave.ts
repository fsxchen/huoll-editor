"use client";

import { useEffect, useRef, useState } from "react";
import { useStore, selectActiveTask } from "./store";
import { snapshotDraft } from "./drafts";
import { createArticle, updateArticle } from "./api/articles";

/**
 * Watches editor content and reports save status.
 *
 * The zustand store's `persist` middleware already writes content to
 * localStorage on every change (debounced by React reconciliation), so the
 * "save" itself is automatic. This hook produces the *visible* state:
 *   - "saving" briefly after the user types
 *   - "saved" once persist has written, with a timestamp
 *   - additionally, periodically snapshots a versioned draft to drafts.ts
 */
export type SaveStatus = "idle" | "saving" | "saved" | "error";

export function useAutosave() {
  const activeTaskId = useStore((s) => s.activeTaskId);
  const content = useStore((s) => selectActiveTask(s)?.content ?? "");
  const format = useStore((s) => selectActiveTask(s)?.format ?? "text");
  const filename = useStore((s) => selectActiveTask(s)?.filename);
  const articleIdMap = useStore((s) => s.articleIdMap);
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const lastContentRef = useRef(content);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncingRef = useRef(false);

  // initial: if content already exists (rehydrated from persist), mark saved
  useEffect(() => {
    if (content && status === "idle") {
      setStatus("saved");
      setSavedAt(Date.now());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (content === lastContentRef.current) return;
    lastContentRef.current = content;
    setStatus("saving");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      try {
        snapshotDraft(content, format, filename);
        setStatus("saved");
        setSavedAt(Date.now());
      } catch {
        setStatus("error");
      }

      // Backend sync: only when logged in and content is meaningful
      if (isAuthenticated && activeTaskId && content.trim().length > 20 && !syncingRef.current) {
        syncingRef.current = true;
        const title = content.split("\n")[0].replace(/^#+\s*/, "").slice(0, 200) || "未命名草稿";
        const articleId = articleIdMap[activeTaskId];
        if (articleId) {
          updateArticle(articleId, { title, content, content_type: "markdown", status: "draft" })
            .catch(() => { /* silent fail — local is the source of truth */ })
            .finally(() => { syncingRef.current = false; });
        } else {
          createArticle({ title, content, content_type: "markdown", status: "draft", doc_type: "blog" })
            .then((article) => {
              useStore.setState((s) => ({
                articleIdMap: { ...s.articleIdMap, [activeTaskId]: article.id },
                tasks: s.tasks.map((t) =>
                  t.id === activeTaskId ? { ...t, articleId: article.id, updatedAt: Date.now() } : t
                ),
              }));
            })
            .catch(() => { /* silent fail */ })
            .finally(() => { syncingRef.current = false; });
        }
      }
    }, 600);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [content, format, filename, activeTaskId, articleIdMap, isAuthenticated]);

  return { status, savedAt };
}

export function relativeTime(ts: number | null): string {
  if (!ts) return "";
  const diff = Math.max(0, Date.now() - ts) / 1000;
  if (diff < 5) return "刚刚";
  if (diff < 60) return `${Math.round(diff)} 秒前`;
  if (diff < 3600) return `${Math.round(diff / 60)} 分钟前`;
  if (diff < 86400) return `${Math.round(diff / 3600)} 小时前`;
  return new Date(ts).toLocaleString();
}

/**
 * Tracks whether the component is mounted on the client. Use to gate any
 * value derived from `Date.now()` or other browser-only state so SSR and
 * the first client render produce the same HTML.
 */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
