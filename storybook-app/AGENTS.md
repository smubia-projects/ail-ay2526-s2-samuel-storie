---
description: Architecture and conventions for the Storie demo
globs: *
alwaysApply: true
---

# Storie — Agent Guide

> **Note:** This project was migrated off InsForge BaaS for AI Lodge
> deployment. There is no InsForge SDK, no `.mcp.json`, and no BaaS backend.
> Ignore any older references to InsForge — the current architecture is below.

## Architecture

A public, no-accounts demo that generates AI bedtime storybooks.

- **Frontend** (`storybook-app/`): React 19 + Vite 7 SPA on **Vercel**.
  Tailwind CSS 3.4 (do NOT upgrade to v4).
- **Backend** (`backend/`): **FastAPI** API on **Google Cloud Run**. Neon stores
  expiring shared-story snapshots; a first-party anonymous browser cookie is
  hashed for lightweight ownership (there are still no accounts).
- **AI**: all inference goes through **OpenRouter** (text + image).
- **Rate limiting**: **Upstash Redis**, per-IP, per-action.
- **Persistence**: personal books stay in **IndexedDB** via `idb-keyval`.
  Magic-link snapshots live in Neon for seven days.

## Key conventions

- Frontend talks to the backend only through `src/lib/apiClient.js`
  (`apiPost`). It detects HTTP 429 and surfaces the rate-limit CTA modal.
- Store CRUD is async and lives in `src/lib/storybookStore.js`; `useStorybook`
  / `useGeneration` wrap it. Up to 3 storybooks are kept; creation is blocked
  when the library is full (delete one to make room).
- AI logic + image safety prompts live in `backend/app/routers/ai.py`.
- Rate limits are per action (`gen` = 1, `img` = 2, `txt` = 5 per 5 days),
  configurable via env vars — see `backend/.env.example`.

## Conventions to preserve

- SDK-free frontend: do not reintroduce a BaaS SDK.
- Keep secrets in env vars (OpenRouter key, Upstash creds, Neon URL) — never in source.
- Tailwind stays on 3.4.
