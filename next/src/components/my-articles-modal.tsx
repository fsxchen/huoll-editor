"use client";

import { useEffect, useState } from "react";
import { listArticles, type Article } from "@/lib/api/articles";

export function MyArticlesModal({ onClose }: { onClose: () => void }) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    listArticles({ status: "draft" })
      .then((res) => {
        if (!cancelled) setArticles(res.results);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "加载失败");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(21, 20, 15, 0.45)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-[560px] max-w-[94vw] max-h-[80vh] flex flex-col overflow-hidden"
        style={{
          background: "var(--surface)",
          borderRadius: 24,
          border: "1px solid var(--line-soft)",
          boxShadow: "0 40px 80px -20px rgba(21, 20, 15, 0.35)",
        }}
      >
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid var(--line-faint)" }}
        >
          <h2 className="text-[18px] font-semibold text-[var(--ink)]">我的文章</h2>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-[var(--ink-mute)] hover:bg-[var(--line-faint)] hover:text-[var(--ink)] transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading && (
            <div className="flex items-center justify-center py-10 text-[var(--ink-faint)]">
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-[var(--ink-faint)] border-t-transparent" />
              加载中…
            </div>
          )}
          {error && (
            <div className="py-4 text-sm text-[var(--coral)]">{error}</div>
          )}
          {!loading && !error && articles.length === 0 && (
            <div className="py-10 text-center text-sm text-[var(--ink-faint)]">
              暂无草稿文章
            </div>
          )}
          {!loading && !error && articles.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-[var(--paper)]"
            >
              <div className="min-w-0">
                <div className="truncate text-[13px] font-medium text-[var(--ink)]">{a.title}</div>
                <div className="mt-0.5 text-[11px] text-[var(--ink-faint)]">
                  {a.status === "draft" ? "草稿" : "已发布"} · {new Date(a.updated_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
