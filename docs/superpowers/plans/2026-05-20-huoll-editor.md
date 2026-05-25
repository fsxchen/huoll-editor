# Huoll Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fork html-anything into huoll-editor — a blog-focused AI HTML editor with one-click draft publishing to any compatible API.

**Architecture:** Keep the Next.js 16 + React 19 + zustand stack unchanged. Three categories of changes: (1) prune ~60 unrelated skill folders, (2) add a publish modal + API config to the store/settings/toolbar, (3) rebrand from "HTML Anything" to "Huoll Editor".

**Tech Stack:** Next.js 16, React 19, zustand 5, Tailwind v4, pnpm 10

---

## Task 1: Remove Unrelated Skill Folders

**Files:**
- Delete: `next/src/lib/templates/skills/{all-deck,frame,social,card,mockup,vfx,video,motion,sprite,web-prototype,etc}/*`

The following skill folders should be **kept** (blog-content-related):
```
article-magazine, blog-post, doc-kami-parchment, docs-page, digital-eguide,
magazine-poster, poster-hero, data-report, finance-report, live-dashboard,
flowai-team-dashboard, eng-runbook, pm-spec, weekly-update, meeting-notes,
team-okrs, kanban-board, resume-modern, email-marketing
```

All other skill folders under `next/src/lib/templates/skills/` should be deleted.

- [ ] **Step 1: Delete unrelated skill folders**

```bash
cd /Users/xcyang/arron/huoll/huoll-editor/next/src/lib/templates/skills

# Keep only the blog-content-related skills; remove everything else
KEEP="article-magazine blog-post doc-kami-parchment docs-page digital-eguide magazine-poster poster-hero data-report finance-report live-dashboard flowai-team-dashboard eng-runbook pm-spec weekly-update meeting-notes team-okrs kanban-board resume-modern email-marketing"

for dir in */; do
  dir="${dir%/}"
  if ! echo "$KEEP" | grep -qw "$dir"; then
    rm -rf "$dir"
    echo "Removed: $dir"
  fi
done
```

- [ ] **Step 2: Verify remaining skills**

```bash
ls /Users/xcyang/arron/huoll/huoll-editor/next/src/lib/templates/skills/
```

Expected: exactly the 19 folders listed above.

- [ ] **Step 3: Verify the app still boots**

```bash
cd /Users/xcyang/arron/huoll/huoll-editor
pnpm install
cd next
pnpm dev &
sleep 8
curl -s http://localhost:3000 | head -20
kill %1
```

Expected: HTML response with no errors in terminal output.

- [ ] **Step 4: Commit**

```bash
cd /Users/xcyang/arron/huoll/huoll-editor
git add -A
git commit -m "refactor: prune non-blog skills, keep 19 blog-content-related templates"
```

---

## Task 2: Rebrand to Huoll Editor

**Files:**
- Modify: `next/package.json` (line 2: name)
- Modify: `next/src/app/layout.tsx` (title, description, metadataBase)
- Modify: `next/src/components/toolbar.tsx` (Brand component, CommunityLinks)
- Modify: `next/src/components/welcome-modal.tsx` (community links strip)
- Modify: `next/src/lib/store.ts` (no change needed — persistence key stays as-is per comment)

- [ ] **Step 1: Update package.json name**

In `next/package.json`, change:
```json
"name": "@html-anything/next",
```
to:
```json
"name": "huoll-editor",
```

- [ ] **Step 2: Update layout.tsx branding**

In `next/src/app/layout.tsx`, change the `metadata` export:

```typescript
export const metadata: Metadata = {
  title: "Huoll Editor — AI-powered blog writing tool",
  description: "Write blog posts with AI, preview as HTML, and publish drafts to your platform.",
  metadataBase: new URL("https://huoll-editor.app"),
  openGraph: {
    title: "Huoll Editor — AI-powered blog writing tool",
    description: "Write blog posts with AI, preview as HTML, and publish drafts to your platform.",
  },
};
```

- [ ] **Step 3: Update Brand component in toolbar.tsx**

In `next/src/components/toolbar.tsx`, replace the `Brand` function (lines 139-159) with:

```tsx
function Brand() {
  return (
    <a href="/" className="flex items-center gap-2.5">
      <div
        className="grid h-9 w-9 place-items-center rounded-full font-[family-name:var(--font-serif)] italic text-[18px] font-semibold text-[var(--ink)]"
        style={{ border: "1.5px solid var(--ink)", background: "var(--surface)" }}
      >
        H
      </div>
      <div className="leading-tight">
        <div className="text-[14px] font-semibold tracking-tight text-[var(--ink)] font-[family-name:var(--font-display)]">
          Huoll <em className="serif-em not-italic font-[family-name:var(--font-serif)] italic font-semibold">Editor</em>
        </div>
        <div className="text-[9.5px] uppercase tracking-[0.18em] text-[var(--ink-faint)]">
          AI Blog Writing Tool
        </div>
      </div>
    </a>
  );
}
```

- [ ] **Step 4: Remove CommunityLinks from toolbar**

In `next/src/components/toolbar.tsx`:
1. Remove the `<CommunityLinks />` usage from the JSX (line 42 in the left-side div).
2. Delete the entire `CommunityLinks` function (lines 100-137).

The toolbar left side becomes:
```tsx
<div className="flex items-center gap-4">
  <Brand />
  <div className="hidden h-6 w-px sm:block" style={{ background: "var(--line)" }} />
  {/* agent picker button stays */}
```

- [ ] **Step 5: Update welcome-modal community links**

In `next/src/components/welcome-modal.tsx`, find and remove or replace the bottom community links strip that references `github.com/nexu-io/html-anything` and Discord. Replace with a simple link to the huoll-editor repo:

Search for the section containing links to `nexu-io/html-anything` and `discord.gg` and replace the entire bottom strip with:

```tsx
<a
  href="https://github.com/fsxchen/huoll-editor"
  target="_blank"
  rel="noreferrer noopener"
  className="text-[10.5px] text-[var(--ink-faint)] hover:text-[var(--ink)]"
>
  github.com/fsxchen/huoll-editor
</a>
```

- [ ] **Step 6: Verify build**

```bash
cd /Users/xcyang/arron/huoll/huoll-editor/next
pnpm build
```

Expected: build succeeds with no errors.

- [ ] **Step 7: Commit**

```bash
cd /Users/xcyang/arron/huoll/huoll-editor
git add -A
git commit -m "brand: rebrand from HTML Anything to Huoll Editor"
```

---

## Task 3: Add Publish Config to Store

**Files:**
- Modify: `next/src/lib/store.ts`

Add `publishApiUrl` and `publishApiKey` to persisted state and store.

- [ ] **Step 1: Add publish config types and state**

In `next/src/lib/store.ts`, add to the `Persisted` type (after line 179, before the closing brace):

```typescript
  publishApiUrl: string;
  publishApiKey: string;
```

Add corresponding fields to the `State` type (in the global section, after line 197):

```typescript
  publishApiUrl: string;
  publishApiKey: string;
```

Add setters to the `State` type (after `setLayoutMode` around line 261):

```typescript
  setPublishApiUrl: (url: string) => void;
  setPublishApiKey: (key: string) => void;
```

Add initial values in the store creation (after line 289 `layoutMode: "split",`):

```typescript
      publishApiUrl: "",
      publishApiKey: "",
```

Add setter implementations (after the `setLayoutMode` action around line 453):

```typescript
      setPublishApiUrl: (url) => set({ publishApiUrl: url }),
      setPublishApiKey: (key) => set({ publishApiKey: key }),
```

Add these fields to the `partialize` function (after `layoutMode: s.layoutMode,` around line 473):

```typescript
        publishApiUrl: s.publishApiUrl,
        publishApiKey: s.publishApiKey,
```

Add a migration for version 7 → 8 (after the v6→v7 block, and update `version: 7` to `version: 8`):

```typescript
        // v7 → v8: add publish config fields
        if (fromVersion < 8 && persisted && typeof persisted === "object") {
          const p = persisted as Record<string, unknown>;
          if (!p.publishApiUrl) p.publishApiUrl = "";
          if (!p.publishApiKey) p.publishApiKey = "";
        }
```

And change the store version from `7` to `8`.

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/xcyang/arron/huoll/huoll-editor/next
pnpm typecheck
```

Expected: no type errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/xcyang/arron/huoll/huoll-editor
git add -A
git commit -m "feat: add publish API config (url + key) to store"
```

---

## Task 4: Add Publish Config UI to Settings Modal

**Files:**
- Modify: `next/src/components/settings-modal.tsx`

Add a new "Publish" section to the settings modal with API URL and API Key fields.

- [ ] **Step 1: Add "publish" to SectionId type**

In `next/src/components/settings-modal.tsx`, change line 15:

```typescript
export type SectionId = "agent" | "deploy" | "language" | "publish";
```

Add the new section to the `SECTIONS` array (after the "language" entry):

```typescript
  { id: "publish" as SectionId, labelKey: "Publish" as DictKey, hintKey: "API endpoint & key" as DictKey },
```

Note: Using inline strings here since we're not modifying the i18n system. The `DictKey` type may need a cast; if the build fails, use `String` casting.

- [ ] **Step 2: Add PublishSection component**

Add the following function before `function DeploySection()` (around line 559):

```tsx
function PublishSection() {
  const publishApiUrl = useStore((s) => s.publishApiUrl);
  const publishApiKey = useStore((s) => s.publishApiKey);
  const setPublishApiUrl = useStore((s) => s.setPublishApiUrl);
  const setPublishApiKey = useStore((s) => s.setPublishApiKey);
  const [testResult, setTestResult] = useState<"ok" | "fail" | null>(null);
  const [testing, setTesting] = useState(false);

  const testConnection = async () => {
    if (!publishApiUrl.trim() || !publishApiKey.trim()) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(`${publishApiUrl.replace(/\/+$/, "")}/articles/?page_size=1`, {
        headers: { "X-API-Key": publishApiKey },
      });
      setTestResult(res.ok ? "ok" : "fail");
    } catch {
      setTestResult("fail");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-[17px] font-semibold text-[var(--ink)]">
          Publish Settings
        </h3>
        <p className="mt-1 text-[12.5px] text-[var(--ink-mute)] leading-relaxed">
          Configure the API endpoint and key for publishing blog drafts.
        </p>
      </div>
      <div
        className="rounded-2xl p-4"
        style={{ background: "var(--paper)", border: "1px solid var(--line-faint)" }}
      >
        <label className="block text-[11px] uppercase tracking-[0.14em] text-[var(--ink-faint)] mb-1">
          API URL
        </label>
        <input
          type="text"
          value={publishApiUrl}
          onChange={(e) => setPublishApiUrl(e.target.value)}
          placeholder="http://localhost:8001/api/v1"
          className="w-full rounded-lg px-3 py-1.5 font-mono text-[12px] outline-none mb-3"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            color: "var(--ink)",
          }}
        />
        <label className="block text-[11px] uppercase tracking-[0.14em] text-[var(--ink-faint)] mb-1">
          API Key
        </label>
        <input
          type="password"
          value={publishApiKey}
          onChange={(e) => setPublishApiKey(e.target.value)}
          placeholder="nw_xxxxxxxxxxxxxxxx"
          className="w-full rounded-lg px-3 py-1.5 font-mono text-[12px] outline-none mb-3"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            color: "var(--ink)",
          }}
        />
        <div className="flex items-center gap-2">
          <button
            onClick={testConnection}
            disabled={testing || !publishApiUrl.trim() || !publishApiKey.trim()}
            className="rounded-lg px-3 py-1.5 text-[11px] font-medium disabled:opacity-40"
            style={{ background: "var(--ink)", color: "var(--paper)" }}
          >
            {testing ? "Testing..." : "Test Connection"}
          </button>
          {testResult === "ok" && (
            <span className="text-[10.5px] text-[var(--green)]">Connection OK</span>
          )}
          {testResult === "fail" && (
            <span className="text-[10.5px]" style={{ color: "var(--red)" }}>Connection failed</span>
          )}
        </div>
        <div className="mt-3 text-[10.5px] text-[var(--ink-mute)] leading-snug">
          The API key is sent as <code className="px-1 rounded bg-[var(--surface)] border border-[var(--line-faint)]">X-API-Key</code> header.
          Articles are published as drafts (status=draft).
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Wire PublishSection into the modal**

In the settings modal's content area (line 126-129), add:

```tsx
{section === "publish" && <PublishSection />}
```

- [ ] **Step 4: Verify build**

```bash
cd /Users/xcyang/arron/huoll/huoll-editor/next
pnpm build
```

Expected: build succeeds. If `DictKey` cast fails, change the SECTIONS entry to use `{ id: "publish" as SectionId, labelKey: "Publish" as unknown as DictKey, hintKey: "API endpoint & key" as unknown as DictKey }`.

- [ ] **Step 5: Commit**

```bash
cd /Users/xcyang/arron/huoll/huoll-editor
git add -A
git commit -m "feat: add publish config section to settings modal"
```

---

## Task 5: Add ARTICLE_META Directive to Shared Prompts

**Files:**
- Modify: `next/src/lib/templates/shared.ts`

- [ ] **Step 1: Add ARTICLE_META instruction to SHARED_DESIGN_DIRECTIVES**

In `next/src/lib/templates/shared.ts`, append the following to the `SHARED_DESIGN_DIRECTIVES` string (before the closing backtick on line 38):

```

【文章元数据 — 必须附带】
- 在 HTML 文档的 </body> 标签之前, 插入一个 HTML 注释, 包含文章的元数据 JSON。格式如下:
  <!-- ARTICLE_META: {"title":"文章标题","summary":"文章摘要(50-150字)","tags":["标签1","标签2"],"category":"分类名"} -->
- title: 从你的 HTML 内容中的 <h1> 提取, 或根据内容生成一个简洁的标题。
- summary: 用 50-150 字概括文章核心内容。
- tags: 提取 3-5 个关键标签。
- category: 根据内容推测最合适的分类 (如: 漏洞分析, 威胁情报, 安全工具, 技术分享, 行业动态)。
- 这条元数据是必需的, 每次输出都必须包含。

```

- [ ] **Step 2: Verify the app boots and converts**

```bash
cd /Users/xcyang/arron/huoll/huoll-editor/next
pnpm dev &
sleep 8
curl -s http://localhost:3000 | head -5
kill %1
```

Expected: no crash, page loads.

- [ ] **Step 3: Commit**

```bash
cd /Users/xcyang/arron/huoll/huoll-editor
git add -A
git commit -m "feat: add ARTICLE_META directive to shared design prompt"
```

---

## Task 6: Create Publish Modal Component

**Files:**
- Create: `next/src/components/publish-modal.tsx`

This modal opens from a toolbar button. It parses ARTICLE_META from the generated HTML, shows editable fields, and calls the configured API.

- [ ] **Step 1: Create publish-modal.tsx**

Create `next/src/components/publish-modal.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";

function extractArticleMeta(html: string): {
  title: string;
  summary: string;
  tags: string[];
  category: string;
} {
  const match = html.match(/<!--\s*ARTICLE_META:\s*(\{.*?\})\s*-->/s);
  if (match) {
    try {
      const parsed = JSON.parse(match[1]);
      return {
        title: parsed.title || "",
        summary: parsed.summary || "",
        tags: Array.isArray(parsed.tags) ? parsed.tags : [],
        category: parsed.category || "",
      };
    } catch {
      // fall through to h1 extraction
    }
  }
  // Fallback: extract <h1>
  const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/s);
  const title = h1Match ? h1Match[1].replace(/<[^>]+>/g, "").trim() : "";
  return { title, summary: "", tags: [], category: "" };
}

export function PublishModal({ onClose }: { onClose: () => void }) {
  const html = useStore((s) => {
    const task = s.tasks.find((t) => t.id === s.activeTaskId);
    return task?.html ?? "";
  });
  const publishApiUrl = useStore((s) => s.publishApiUrl);
  const publishApiKey = useStore((s) => s.publishApiKey);

  const meta = extractArticleMeta(html);

  const [title, setTitle] = useState(meta.title);
  const [summary, setSummary] = useState(meta.summary);
  const [tags, setTags] = useState(meta.tags.join(", "));
  const [category, setCategory] = useState(meta.category);
  const [contentType, setContentType] = useState<"html" | "markdown">("html");
  const [status, setStatus] = useState<"idle" | "publishing" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const canPublish =
    title.trim() &&
    html.trim() &&
    publishApiUrl.trim() &&
    publishApiKey.trim() &&
    status !== "publishing";

  const handlePublish = async () => {
    setStatus("publishing");
    setErrorMsg("");
    try {
      const url = publishApiUrl.replace(/\/+$/, "");
      const res = await fetch(`${url}/articles/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": publishApiKey,
        },
        body: JSON.stringify({
          title: title.trim(),
          content: html,
          summary: summary.trim(),
          category: category.trim(),
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          content_type: contentType,
          status: "draft",
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || data.error || `HTTP ${res.status}`);
      }
      setStatus("success");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Publish failed");
      setStatus("error");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center od-backdrop"
      style={{ background: "rgba(21, 20, 15, 0.45)", backdropFilter: "blur(6px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-[640px] max-w-[94vw] max-h-[88vh] flex flex-col overflow-hidden od-fade-in"
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
              Publish
            </div>
            <h2 className="mt-1 text-[20px] font-semibold tracking-tight text-[var(--ink)] font-[family-name:var(--font-display)]">
              Publish as <em className="serif-em">Draft</em>
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
        {status === "success" ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
            <div className="text-4xl mb-4">&#10003;</div>
            <div className="text-[18px] font-semibold text-[var(--ink)]">
              Draft Published!
            </div>
            <div className="mt-2 text-[13px] text-[var(--ink-mute)]">
              Your article has been saved as a draft.
            </div>
            <button onClick={onClose} className="btn-primary mt-6">
              Done
            </button>
          </div>
        ) : (
          <>
            {/* Config warning */}
            {!publishApiUrl.trim() || !publishApiKey.trim() ? (
              <div className="px-6 py-3 text-[12px]" style={{ background: "var(--coral-soft)", color: "var(--coral)" }}>
                Please configure your API URL and API Key in Settings &gt; Publish first.
              </div>
            ) : null}

            {/* Form */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <div>
                <label className="block text-[11px] uppercase tracking-[0.14em] text-[var(--ink-faint)] mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Article title"
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
                  Summary
                </label>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Brief summary of the article"
                  rows={3}
                  className="w-full rounded-lg px-3 py-2 text-[13px] outline-none resize-y"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--line)",
                    color: "var(--ink)",
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-[0.14em] text-[var(--ink-faint)] mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. 漏洞分析"
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
                    Tags (comma-separated)
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
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-[0.14em] text-[var(--ink-faint)] mb-1">
                  Content Type
                </label>
                <div className="flex gap-2">
                  {(["html", "markdown"] as const).map((ct) => (
                    <button
                      key={ct}
                      onClick={() => setContentType(ct)}
                      className={`rounded-full px-3 py-1.5 text-[12px] transition-all ${
                        contentType === ct
                          ? "bg-[var(--ink)] text-[var(--paper)] font-medium"
                          : "bg-[var(--surface)] text-[var(--ink-soft)] border border-[var(--line-soft)] hover:border-[var(--ink)]/40"
                      }`}
                    >
                      {ct}
                    </button>
                  ))}
                </div>
              </div>

              <div
                className="rounded-xl px-4 py-3 text-[11px] text-[var(--ink-mute)]"
                style={{ background: "var(--paper)", border: "1px solid var(--line-faint)" }}
              >
                Content: {html.length.toLocaleString()} characters of HTML
                {meta.title && " · AI-extracted metadata detected"}
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
              <button onClick={onClose} className="btn-secondary">
                Cancel
              </button>
              <button
                onClick={handlePublish}
                disabled={!canPublish}
                className="btn-primary disabled:opacity-40"
              >
                {status === "publishing" ? "Publishing..." : "Publish Draft"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
cd /Users/xcyang/arron/huoll/huoll-editor/next
pnpm build
```

Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
cd /Users/xcyang/arron/huoll/huoll-editor
git add -A
git commit -m "feat: add publish modal component with metadata extraction"
```

---

## Task 7: Wire Publish Button into Toolbar

**Files:**
- Modify: `next/src/components/toolbar.tsx`
- Modify: `next/src/app/page.tsx` (or wherever the toolbar is rendered with state management)

- [ ] **Step 1: Add publish button to toolbar**

In `next/src/components/toolbar.tsx`, add `onPublish` to the Toolbar props:

```tsx
export function Toolbar({
  iframeRef,
  onOpenAgentPicker,
  onOpenSettings,
  onRequestConfigureDeploy,
  deployConfigRev,
  onPublish,
}: {
  iframeRef: React.MutableRefObject<HTMLIFrameElement | null>;
  onOpenAgentPicker: () => void;
  onOpenSettings: () => void;
  onRequestConfigureDeploy: () => void;
  deployConfigRev: number;
  onPublish: () => void;
}) {
```

Add the publish button in the right-side controls area (before `<DeployControl ... />`):

```tsx
        <button
          onClick={onPublish}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-all"
          style={{ background: "var(--ink)", color: "var(--paper)" }}
          title="Publish as draft"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
          Publish
        </button>
```

- [ ] **Step 2: Wire publish modal into the main page**

Find where `Toolbar` is rendered (likely `next/src/app/page.tsx`). Add state for the publish modal:

```tsx
import { PublishModal } from "./publish-modal";
```

Add state:
```tsx
const [showPublish, setShowPublish] = useState(false);
```

Pass `onPublish` to `Toolbar`:
```tsx
<Toolbar
  // ... existing props
  onPublish={() => setShowPublish(true)}
/>
```

Add the modal rendering:
```tsx
{showPublish && <PublishModal onClose={() => setShowPublish(false)} />}
```

The exact location depends on how `page.tsx` is structured — find where `<Toolbar ... />` is rendered and add the prop + modal next to the existing settings/deploy modals.

- [ ] **Step 3: Verify build**

```bash
cd /Users/xcyang/arron/huoll/huoll-editor/next
pnpm build
```

Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
cd /Users/xcyang/arron/huoll/huoll-editor
git add -A
git commit -m "feat: wire publish button into toolbar and publish modal into page"
```

---

## Task 8: Update README

**Files:**
- Modify: `README.md` (root level)

- [ ] **Step 1: Replace README with huoll-editor content**

Replace the root `README.md` with:

```markdown
# Huoll Editor

> AI-powered blog writing tool. Write with your local Agent CLI, preview as HTML, publish drafts to your platform.

Huoll Editor is forked from [html-anything](https://github.com/nexu-io/html-anything). It focuses on blog/content writing and adds one-click draft publishing via API.

## Features

- **AI Blog Writing** — Uses your local coding Agent CLI (Claude Code, Cursor, Codex, Gemini, Copilot, OpenCode, Qwen, Aider) to generate beautiful HTML from your content
- **Live Preview** — Watch the AI write HTML in real-time via SSE streaming in a sandboxed iframe
- **Blog-Focused Skills** — 19 curated skill templates for articles, docs, reports, posters, and office documents
- **One-Click Publish** — Configure your API endpoint and API key, then publish articles as drafts with AI-extracted metadata
- **Export** — Download as `.html` or `.png`, copy for WeChat/Zhihu/Twitter

## Quickstart

```bash
git clone https://github.com/fsxchen/huoll-editor.git
cd huoll-editor
pnpm install
cd next
pnpm dev
# → http://localhost:3000
```

## Publish Setup

1. Open Settings → Publish
2. Enter your API URL (e.g. `http://localhost:8001/api/v1`)
3. Enter your API Key (e.g. `nw_xxxxxxxx`)
4. Click "Test Connection" to verify
5. Write your blog post, then click "Publish" in the toolbar

## License

Apache-2.0 © 2026 Huoll Editor contributors. Based on [html-anything](https://github.com/nexu-io/html-anything) by nexu-io.
```

- [ ] **Step 2: Commit**

```bash
cd /Users/xcyang/arron/huoll/huoll-editor
git add -A
git commit -m "docs: replace README with huoll-editor description"
```

---

## Task 9: End-to-End Smoke Test

- [ ] **Step 1: Start the app**

```bash
cd /Users/xcyang/arron/huoll/huoll-editor/next
pnpm dev
```

- [ ] **Step 2: Verify in browser**

Open http://localhost:3000 and check:
1. Brand shows "Huoll Editor" (not "HTML Anything")
2. Template picker shows only blog-related skills (no decks, frames, social cards)
3. Settings has a "Publish" section
4. Publish section accepts API URL and API Key, "Test Connection" button works
5. Toolbar has a "Publish" button (black, right side)
6. Click "Publish" → modal opens with empty metadata fields (no HTML generated yet)

- [ ] **Step 3: Final commit (if any fixes needed)**

```bash
cd /Users/xcyang/arron/huoll/huoll-editor
git add -A
git commit -m "fix: address smoke test findings"
```
