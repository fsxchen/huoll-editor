# Huoll Editor — Design Spec

**Date**: 2026-05-20
**Status**: Approved
**Based on**: Fork of [nexu-io/html-anything](https://github.com/nexu-io/html-anything)

## Overview

Huoll Editor is an independent, AI-powered blog writing tool forked from html-anything. Users write content via local Agent CLIs, preview as live HTML, and publish drafts to any platform that exposes a compatible article creation API.

## Product Decisions

| Decision | Choice |
|----------|--------|
| Positioning | Independent product |
| Tech stack | Next.js 16 + React 19 + pnpm (unchanged from upstream) |
| Agent support | All 8 CLIs retained (Claude Code, Cursor, Codex, Gemini, Copilot, OpenCode, Qwen, Aider) |
| Publishing | Creates draft via configured API URL + API Key |
| Metadata | AI-assisted: agent generates title/summary/category/tags alongside HTML |
| Auth | Simple API Key configuration (no JWT login) |

## Skill Pruning

Retain ~20 blog-content-related skills, remove ~55 design/presentation/social skills.

### Retained Skills

**Core writing**:
- `article-magazine` — long-form magazine article
- `blog-post` — blog post
- `doc-kami-parchment` — warm parchment editorial doc
- `docs-page` — technical documentation
- `digital-eguide` — digital e-guide

**Poster/visual**:
- `magazine-poster` — magazine poster
- `poster-hero` — marketing poster

**Data/report**:
- `data-report` — data report
- `finance-report` — finance report
- `live-dashboard` — live data dashboard
- `flowai-team-dashboard` — team workflow dashboard

**Office/blog-content**:
- `eng-runbook` — incident runbook
- `pm-spec` — PM spec document
- `weekly-update` — weekly update
- `meeting-notes` — meeting notes
- `team-okrs` — OKR scoresheet
- `kanban-board` — kanban board
- `resume-modern` — resume
- `email-marketing` — marketing email

### Removed Skills

All `deck-*` (20), `frame-*` (10), `social-*` (8), `card-*` (2), `mockup-*` (1), `vfx-*` (1), `video-*` (1), `motion-*` (1), `sprite-*` (1), web prototypes (`prototype-web`, `saas-landing`, `waitlist-page`, `pricing-page`, `dashboard`, `mobile-app`, `mobile-onboarding`, `gamified-app`, `dating-web`, `web-proto-editorial`, `web-proto-brutalist`, `web-proto-soft`, `wireframe-sketch`, `ppt-keynote`).

## Publish Feature

### User Flow

1. User writes content in editor, Agent generates HTML
2. User clicks "Publish" button in toolbar (alongside export menu)
3. Publish modal opens with two steps:

**Step 1 — AI extracts metadata**:
- Agent generates HTML with embedded `<!-- ARTICLE_META: {...} -->` comment at the end
- Modal parses and pre-fills form: title, summary, category, tags, content type
- HTML content auto-fills the content field

**Step 2 — User confirms and publishes**:
- All fields are editable
- User clicks "Publish", sends `POST {API_URL}/articles/` with body:
  ```json
  {
    "title": "...",
    "content": "<html>...</html>",
    "summary": "...",
    "category": "...",
    "tags": ["..."],
    "content_type": "html",
    "status": "draft"
  }
  ```
- Request header: `X-API-Key: {API_KEY}`
- Success: show success message
- Failure: show error message

### Publish Modal Fields

| Field | Source | Editable |
|-------|--------|----------|
| Title | AI extracts from `<h1>` | Yes |
| Summary | AI generated | Yes |
| Content | Generated HTML | No (read-only preview) |
| Category | AI suggested | Yes (text input) |
| Tags | AI suggested | Yes (comma-separated input) |
| Content type | Default `html` | Yes (dropdown) |

### API Configuration (in settings-modal)

Two new settings stored in localStorage:
- `apiUrl` — e.g. `http://localhost:8001/api/v1`
- `apiKey` — e.g. `nw_xxxxx`

Validation: attempt a `GET {apiUrl}/articles/?page_size=1` with the API key to verify connectivity before enabling publish.

## Branding Changes

- Product name: `huoll-editor`
- `package.json` name: `huoll-editor`
- Page title and logo area: "Huoll Editor"
- README rewritten for huoll-editor positioning
- Upstream html-anything references removed from UI-facing text

## Code Changes Summary

| Type | Change | Files |
|------|--------|-------|
| Delete | ~55 skill folders | `next/src/lib/templates/skills/{deck-*,frame-*,social-*,...}` |
| New | Publish API logic | `next/src/lib/export/publish.ts` |
| New | Publish modal component | `next/src/components/publish-modal.tsx` |
| Modify | Add API URL + API Key settings | `next/src/components/settings-modal.tsx` |
| Modify | Add publish button to toolbar | `next/src/components/toolbar.tsx` |
| Modify | Add publish state to store | `next/src/lib/store.ts` |
| Modify | Shared prompt: request ARTICLE_META in output | `next/src/lib/templates/shared.ts` |
| Modify | Branding (name, title, logo) | `next/package.json`, `next/src/app/layout.tsx`, toolbar, etc. |
| Modify | README | `README.md` |

## Unchanged

- Agent detection and invocation system (`next/src/lib/agents/`)
- SSE streaming render pipeline
- Iframe sandbox preview
- Export features (HTML/PNG download, WeChat, Zhihu)
- Editor, template picker, drafts system

## Metadata Embedding Convention

The shared design directives (`shared.ts`) will be modified to instruct the agent to append a metadata comment at the end of generated HTML:

```html
<!-- ARTICLE_META: {"title":"Article Title","summary":"Brief summary","tags":["tag1","tag2"],"category":"Category Name"} -->
```

The publish modal parses this comment via regex: `/<!--\s*ARTICLE_META:\s*(\{.*?\})\s*-->/s`

If no ARTICLE_META is found, the modal opens with empty fields for manual entry. The `<h1>` tag is used as a fallback for the title.
