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
