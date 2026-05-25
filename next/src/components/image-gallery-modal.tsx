"use client";

import { useEffect, useState } from "react";
import { listImages, deleteImage, type ImageItem } from "@/lib/api/images";

export function ImageGalleryModal({
  onClose,
  onSelect,
}: {
  onClose: () => void;
  onSelect?: (url: string) => void;
}) {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listImages()
      .then((res) => {
        if (!cancelled) setImages(res.items);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "加载失败");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const handleDelete = async (url: string) => {
    setDeleting(url);
    try {
      await deleteImage(url);
      setImages((prev) => prev.filter((img) => img.url !== url));
    } catch (e) {
      setError(e instanceof Error ? e.message : "删除失败");
    } finally {
      setDeleting(null);
    }
  };

  const handleCopy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(url);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // ignore
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(21, 20, 15, 0.45)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-[720px] max-w-[94vw] max-h-[84vh] flex flex-col overflow-hidden"
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
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--ink-faint)]">Media</div>
            <h2 className="mt-1 text-[20px] font-semibold tracking-tight text-[var(--ink)] font-[family-name:var(--font-display)]">
              图片<em className="serif-em">管理</em>
            </h2>
          </div>
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
          {!loading && !error && images.length === 0 && (
            <div className="py-10 text-center text-sm text-[var(--ink-faint)]">
              暂无图片
              <br />
              在编辑器中拖拽或粘贴图片即可上传
            </div>
          )}
          {!loading && !error && (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {images.map((img) => (
                <div
                  key={img.url}
                  className="group relative flex flex-col gap-1.5 rounded-xl p-2 transition-colors hover:bg-[var(--paper)]"
                  style={{ border: "1px solid var(--line-faint)" }}
                >
                  <div className="relative aspect-video overflow-hidden rounded-lg bg-[var(--paper)]">
                    <img
                      src={img.url}
                      alt={img.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    {onSelect && (
                      <button
                        onClick={() => { onSelect(img.url); onClose(); }}
                        className="absolute inset-0 flex items-center justify-center bg-[rgba(21,20,15,0.35)] text-[13px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        插入
                      </button>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-1 px-0.5">
                    <span className="truncate text-[10px] text-[var(--ink-faint)]" title={img.name}>
                      {img.name}
                    </span>
                    <span className="shrink-0 text-[10px] text-[var(--ink-faint)]">
                      {formatSize(img.size)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 px-0.5">
                    <button
                      onClick={() => handleCopy(img.url)}
                      className="rounded px-1.5 py-0.5 text-[10px] text-[var(--ink-soft)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--ink)]"
                      title="复制链接"
                    >
                      {copied === img.url ? "已复制" : "复制"}
                    </button>
                    <button
                      onClick={() => handleDelete(img.url)}
                      disabled={deleting === img.url}
                      className="rounded px-1.5 py-0.5 text-[10px] text-[var(--coral)] transition-colors hover:bg-[var(--surface)] disabled:opacity-40"
                      title="删除"
                    >
                      {deleting === img.url ? "删除中…" : "删除"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
