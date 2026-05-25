"use client";

import { useMemo, useState } from "react";
import { parseOutline, extractSection } from "@/lib/outline";
import { useSectionAI } from "@/lib/use-section-ai";
import { useStore } from "@/lib/store";

export function OutlineSidebar({
  content,
  textareaRef,
  visible,
  onToggle,
}: {
  content: string;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  visible: boolean;
  onToggle: () => void;
}) {
  const items = useMemo(() => parseOutline(content), [content]);
  const { run, cancel, status } = useSectionAI();
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const handleClick = (offset: number) => {
    const el = textareaRef.current;
    if (!el) return;
    el.setSelectionRange(offset, offset);
    el.focus();
    const lineHeight = 20;
    const lineIndex = content.slice(0, offset).split("\n").length - 1;
    const targetScroll = Math.max(0, lineIndex * lineHeight - el.clientHeight / 2);
    el.scrollTop = targetScroll;
  };

  const handleAction = async (idx: number, action: "expand" | "polish") => {
    if (status === "running") {
      cancel();
      return;
    }
    const item = items[idx];
    if (!item) return;
    setActiveIdx(idx);
    const { text, insertOffset } = extractSection(content, item.offset);
    try {
      const result = await run(text, action);
      if (!result.trim()) return;
      const store = useStore.getState();
      const prev = store.tasks.find((x) => x.id === store.activeTaskId)?.content ?? "";
      const head = prev.slice(0, insertOffset);
      const tail = prev.slice(insertOffset);
      const sep = head.endsWith("\n\n") ? "" : head.endsWith("\n") ? "\n" : "\n\n";
      store.setContent(head + sep + result.trim() + "\n" + tail);
    } catch {
      // error surfaced in useSectionAI
    } finally {
      setActiveIdx(null);
    }
  };

  if (!visible) {
    return (
      <button
        onClick={onToggle}
        className="absolute left-0 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-r-lg border text-[var(--ink-faint)] transition-colors hover:text-[var(--ink)]"
        style={{
          background: "var(--surface)",
          borderColor: "var(--line-faint)",
          borderLeft: "none",
        }}
        title="展开大纲"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m9 18 6-6-6-6" />
        </svg>
      </button>
    );
  }

  return (
    <div
      className="flex h-full flex-col overflow-hidden"
      style={{
        width: 200,
        minWidth: 200,
        background: "var(--paper)",
        borderRight: "1px solid var(--line-faint)",
      }}
    >
      <div
        className="flex items-center justify-between px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-[var(--ink-faint)]"
        style={{ borderBottom: "1px solid var(--line-faint)" }}
      >
        <span>大纲</span>
        <button
          onClick={onToggle}
          className="grid h-5 w-5 place-items-center rounded text-[var(--ink-faint)] hover:bg-[var(--surface)] hover:text-[var(--ink)] transition-colors"
          title="收起大纲"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        {items.length === 0 ? (
          <div className="px-3 py-4 text-[11px] text-[var(--ink-faint)]">
            暂无章节标题
            <br />
            使用 ## 或 ### 创建大纲
          </div>
        ) : (
          items.map((item, i) => (
            <div
              key={i}
              className="group flex items-center justify-between gap-1"
            >
              <button
                onClick={() => handleClick(item.offset)}
                className="min-w-0 flex-1 text-left text-[12px] leading-tight text-[var(--ink-soft)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--ink)]"
                style={{
                  paddingLeft: item.level === 2 ? 12 : 24,
                  paddingRight: 4,
                  paddingTop: 4,
                  paddingBottom: 4,
                }}
                title={item.text}
              >
                <span className="line-clamp-1">{item.text}</span>
              </button>
              <div className="flex shrink-0 items-center gap-0.5 pr-2 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => handleAction(i, "expand")}
                  disabled={status === "running"}
                  className="grid h-5 w-5 place-items-center rounded text-[10px] text-[var(--ink-faint)] hover:bg-[var(--surface)] hover:text-[var(--ink)] disabled:opacity-40"
                  title="扩展本章"
                >
                  {status === "running" && activeIdx === i ? (
                    <span className="h-3 w-3 animate-spin rounded-full border border-[var(--ink-faint)] border-t-transparent" />
                  ) : (
                    "✨"
                  )}
                </button>
                <button
                  onClick={() => handleAction(i, "polish")}
                  disabled={status === "running"}
                  className="grid h-5 w-5 place-items-center rounded text-[10px] text-[var(--ink-faint)] hover:bg-[var(--surface)] hover:text-[var(--ink)] disabled:opacity-40"
                  title="润色本章"
                >
                  {status === "running" && activeIdx === i ? (
                    <span className="h-3 w-3 animate-spin rounded-full border border-[var(--ink-faint)] border-t-transparent" />
                  ) : (
                    "✏️"
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
