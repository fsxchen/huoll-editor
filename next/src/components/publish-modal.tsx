"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import {
  listPublishArticles,
  createPublishArticle,
  updatePublishArticle,
  publishPublishArticle,
  uploadPublishImage,
} from "@/lib/api/publish";

function extractArticleMeta(html: string): {
  title: string;
  summary: string;
  tags: string[];
} {
  const match = html.match(/<!--\s*ARTICLE_META:\s*(\{[\s\S]*?\})\s*-->/);
  if (match) {
    try {
      const parsed = JSON.parse(match[1]);
      return {
        title: parsed.title || "",
        summary: parsed.summary || "",
        tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      };
    } catch {
      // fall through to h1 extraction
    }
  }
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  const title = h1Match ? h1Match[1].replace(/<[^>]+>/g, "").trim() : "";
  return { title, summary: "", tags: [] };
}

export function PublishModal({ onClose }: { onClose: () => void }) {
  const activeTaskId = useStore((s) => s.activeTaskId);
  const task = useStore((s) => s.tasks.find((t) => t.id === s.activeTaskId));
  const articleIdMap = useStore((s) => s.articleIdMap);
  const publishApiUrl = useStore((s) => s.publishApiUrl);
  const publishApiKey = useStore((s) => s.publishApiKey);
  const html = task?.html ?? "";
  const content = task?.content ?? "";
  const articleId = activeTaskId ? articleIdMap[activeTaskId] : undefined;

  const meta = extractArticleMeta(html);

  const [title, setTitle] = useState(meta.title || content.split("\n")[0].replace(/^#+\s*/, "").slice(0, 200));
  const [summary, setSummary] = useState(meta.summary);
  const [tags, setTags] = useState(meta.tags.join(", "));
  const [status, setStatus] = useState<"idle" | "saving" | "published" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [coverDragging, setCoverDragging] = useState(false);

  // Ensure every task gets a stable UUID publishId for server-side dedup.
  useEffect(() => {
    if (activeTaskId && !task?.publishId) {
      const uuid =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
              const r = (Math.random() * 16) | 0;
              const v = c === "x" ? r : (r & 0x3) | 0x8;
              return v.toString(16);
            });
      useStore.setState((s) => ({
        tasks: s.tasks.map((t) =>
          t.id === activeTaskId
            ? { ...t, publishId: uuid, updatedAt: Date.now() }
            : t
        ),
      }));
    }
  }, [activeTaskId, task?.publishId]);

  const canSave =
    title.trim().length >= 5 && status !== "saving" && !!publishApiUrl.trim() && !!publishApiKey.trim();

  const handleSave = async (targetStatus: "draft" | "published") => {
    setStatus("saving");
    setErrorMsg("");
    try {
      const payload = {
        title: title.trim(),
        content,
        content_type: "markdown" as const,
        summary: summary.trim(),
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        status: targetStatus,
        doc_type: "blog" as const,
        cover_image: coverImage || undefined,
      };

      const url = publishApiUrl.trim();
      const key = publishApiKey.trim();

      // Stable slug derived from the task's publishId (UUID) so the same task
      // always maps to the same article even if localStorage is cleared.
      const publishSlug = task?.publishId ?? "";

      let id = articleId;

      // 1. If we already have a linked articleId locally, just update it.
      if (!id && publishSlug) {
        // 2. Fallback: query the server by slug to avoid duplicates.
        try {
          const list = await listPublishArticles(url, key, {
            slug: publishSlug,
            page_size: "1",
          });
          if (list.results.length > 0) {
            id = list.results[0].id;
          }
        } catch {
          // Ignore lookup errors and fall through to create.
        }
      }

      if (id) {
        await updatePublishArticle(url, key, id, payload);
      } else {
        const article = await createPublishArticle(url, key, {
          ...payload,
          slug: publishSlug || undefined,
        });
        id = article.id;
        // Link task ↔ article
        if (activeTaskId) {
          useStore.setState((s) => ({
            articleIdMap: { ...s.articleIdMap, [activeTaskId]: id! },
            tasks: s.tasks.map((t) =>
              t.id === activeTaskId ? { ...t, articleId: id!, updatedAt: Date.now() } : t
            ),
          }));
        }
      }

      if (targetStatus === "published" && id) {
        await publishPublishArticle(url, key, id);
      }

      setStatus("published");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "保存失败");
      setStatus("error");
    }
  };

  const missingConfig = !publishApiUrl.trim() || !publishApiKey.trim();

  if (missingConfig) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: "rgba(21, 20, 15, 0.45)", backdropFilter: "blur(6px)" }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div
          className="relative w-[420px] max-w-[94vw] flex flex-col items-center gap-4 px-6 py-10"
          style={{
            background: "var(--surface)",
            borderRadius: 24,
            border: "1px solid var(--line-soft)",
            boxShadow: "0 40px 80px -20px rgba(21, 20, 15, 0.35)",
          }}
        >
          <div className="text-[18px] font-semibold text-[var(--ink)]">发布未配置</div>
          <div className="text-[13px] text-[var(--ink-mute)]">请在 Settings → Publish 中配置 API URL 和 API Key</div>
          <button onClick={onClose} className="btn-primary mt-2">关闭</button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(21, 20, 15, 0.45)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-[640px] max-w-[94vw] max-h-[88vh] flex flex-col overflow-hidden"
        style={{
          background: "var(--surface)",
          borderRadius: 24,
          border: "1px solid var(--line-soft)",
          boxShadow: "0 40px 80px -20px rgba(21, 20, 15, 0.35)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid var(--line-faint)" }}
        >
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--ink-faint)]">
              {articleId ? "更新文章" : "发布文章"}
            </div>
            <h2 className="mt-1 text-[20px] font-semibold tracking-tight text-[var(--ink)] font-[family-name:var(--font-display)]">
              {articleId ? "保存到" : "发布到"} <em className="serif-em">后端</em>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-[var(--ink-mute)] hover:bg-[var(--line-faint)] hover:text-[var(--ink)] transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Success state */}
        {status === "published" ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
            <div className="text-4xl mb-4">&#10003;</div>
            <div className="text-[18px] font-semibold text-[var(--ink)]">
              {articleId ? "已更新" : "已发布"}
            </div>
            <div className="mt-2 text-[13px] text-[var(--ink-mute)]">
              文章已保存到后端{articleId ? "" : "草稿箱"}
            </div>
            <button onClick={onClose} className="btn-primary mt-6">完成</button>
          </div>
        ) : (
          <>
            {/* Form */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <div>
                <label className="block text-[11px] uppercase tracking-[0.14em] text-[var(--ink-faint)] mb-1">
                  标题
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="文章标题"
                  className="w-full rounded-lg px-3 py-2 text-[13px] outline-none"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--line)",
                    color: "var(--ink)",
                  }}
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-[0.14em] text-[var(--ink-faint)] mb-1">
                  摘要
                </label>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="文章摘要"
                  rows={3}
                  className="w-full rounded-lg px-3 py-2 text-[13px] outline-none resize-y"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--line)",
                    color: "var(--ink)",
                  }}
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-[0.14em] text-[var(--ink-faint)] mb-1">
                  封面图
                </label>
                <div
                  className="relative flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-6 text-center transition-colors"
                  style={{
                    borderColor: coverDragging ? "var(--coral)" : "var(--line)",
                    background: coverDragging ? "rgba(201,100,66,0.04)" : "var(--surface)",
                  }}
                  onDragOver={(e) => { e.preventDefault(); setCoverDragging(true); }}
                  onDragLeave={() => setCoverDragging(false)}
                  onDrop={async (e) => {
                    e.preventDefault();
                    setCoverDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (!file) return;
                    try {
                      const res = await uploadPublishImage(publishApiUrl.trim(), publishApiKey.trim(), file);
                      setCoverImage(res.url);
                    } catch (err) {
                      setErrorMsg(err instanceof Error ? err.message : "封面上传失败");
                    }
                  }}
                >
                  {coverImage ? (
                    <img src={coverImage} alt="cover" className="max-h-[120px] rounded-lg object-contain" />
                  ) : (
                    <>
                      <div className="text-2xl">🖼️</div>
                      <div className="text-[12px] text-[var(--ink-soft)]">
                        拖拽图片到此处，或
                        <label className="cursor-pointer text-[var(--ink)] hover:underline">
                          选择文件
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              try {
                                const res = await uploadPublishImage(publishApiUrl.trim(), publishApiKey.trim(), file);
                                setCoverImage(res.url);
                              } catch (err) {
                                setErrorMsg(err instanceof Error ? err.message : "封面上传失败");
                              }
                            }}
                          />
                        </label>
                      </div>
                      <div className="text-[10px] text-[var(--ink-faint)]">支持 JPG、PNG、GIF、WebP，最大 10MB</div>
                    </>
                  )}
                  {coverImage && (
                    <button
                      onClick={() => setCoverImage("")}
                      className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-[var(--paper)] text-[var(--ink-faint)] hover:text-[var(--coral)] transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-[0.14em] text-[var(--ink-faint)] mb-1">
                  标签（逗号分隔）
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="tag1, tag2, tag3"
                  className="w-full rounded-lg px-3 py-2 text-[13px] outline-none"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--line)",
                    color: "var(--ink)",
                  }}
                />
              </div>

              <div
                className="rounded-xl px-4 py-3 text-[11px] text-[var(--ink-mute)]"
                style={{ background: "var(--paper)", border: "1px solid var(--line-faint)" }}
              >
                内容：{content.length.toLocaleString()} 字符
                {articleId ? " · 已关联后端文章" : " · 首次保存将创建新文章"}
                {title.trim().length > 0 && title.trim().length < 5 && " · 标题至少 5 个字符"}
              </div>
            </div>

            {/* Error */}
            {status === "error" && errorMsg && (
              <div className="px-6 py-2 text-[12px]" style={{ color: "var(--red)" }}>
                {errorMsg}
              </div>
            )}

            {/* Footer */}
            <div
              className="flex items-center justify-end gap-2 px-6 py-4"
              style={{ borderTop: "1px solid var(--line-faint)", background: "var(--paper)" }}
            >
              <button onClick={onClose} className="btn-secondary">取消</button>
              <button
                onClick={() => handleSave("draft")}
                disabled={!canSave}
                className="btn-secondary disabled:opacity-40"
              >
                {status === "saving" ? "保存中…" : "保存草稿"}
              </button>
              <button
                onClick={() => handleSave("published")}
                disabled={!canSave}
                className="btn-primary disabled:opacity-40"
              >
                {status === "saving" ? "发布中…" : "正式发布"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
