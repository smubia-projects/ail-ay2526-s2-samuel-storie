# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Frontend (`storybook-app/`)
- **Dev server**: `npm run dev` (Vite)
- **Build**: `npm run build`
- **Lint**: `npm run lint` (ESLint 9 with flat config)
- **Preview build**: `npm run preview`

### Backend (`backend/`)
- **Run**: `uvicorn app.main:app --reload --port 8080`
- **Install**: `pip install -r requirements.txt`

No test framework is configured.

## Architecture

This is a **children's storybook generator** — a React SPA that lets anyone create
AI-generated bedtime stories with illustrations. It is a public demo with **no
accounts**. Personal books stay in the browser; Neon holds seven-day shared snapshots.

### Tech Stack

- React 19 + Vite 7 + React Router 7 (client-side routing)
- Tailwind CSS 3.4 (do NOT upgrade to v4)
- FastAPI (Python 3.11) backend on Cloud Run
- OpenRouter for AI inference (text + image)
- Upstash Redis for rate limiting

### Persistence — IndexedDB (library of up to 3)

Up to `MAX_STORYBOOKS` (3) personal storybooks are kept in the
browser's **IndexedDB** (via `idb-keyval`) under the key `storie_storybooks`
(the legacy single-book key `storie_storybook` is migrated on first read).
When the library is full, creation is blocked — `CreateStoryPage` shows a
"library full" notice and `HomePage` disables the create button until a story
is deleted. All CRUD is async and lives in `src/lib/storybookStore.js`.
`src/hooks/useStorybook.js` wraps it and returns the familiar `{ data, error }`
shape.

Shared links are separate snapshots in Neon. `src/lib/shareStory.js` calls the
sharing API, while a random first-party cookie supplies anonymous ownership.

### Backend (stateless AI proxy)

- `backend/app/main.py` — FastAPI app, CORS from `CORS_ORIGINS`, health check
- `backend/app/routers/ai.py` — three stateless endpoints:
  - `POST /api/generate-storybook` — one rate-limited call that produces the
    full 4-act story (OpenRouter chat) plus an illustration per act (OpenRouter
    images). Returns title + pages; the frontend saves them to IndexedDB.
  - `POST /api/regenerate-image` — regenerate one image with feedback
  - `POST /api/regenerate-text` — regenerate one paragraph with feedback
- `backend/app/rate_limit.py` — Upstash Redis per-IP, per-action limiter
  (`ratelimit:<salt>:<project>:<bucket>:<ip>`). Buckets per 5-day window —
  `gen` (1), `img` (2), `txt` (5), all env-configurable. Silently disabled
  if Upstash is unset.

### Frontend API layer

- `src/lib/apiClient.js` — single `apiPost` helper. Detects HTTP 429 and triggers
  the rate-limit CTA via `setRateLimitHandler`.
- `src/hooks/useGeneration.js` — orchestrates generation/regeneration: calls the
  backend, then persists results to IndexedDB.
- `src/hooks/useRateLimit.jsx` — context that surfaces `<RateLimitCTA />` on 429.

### Routes

| Path | Component |
|------|-----------|
| `/` | HomePage (library) |
| `/create` | CreateStoryPage |
| `/edit/:id` | EditStoryPage |
| `/story/:id` | ViewStoryPage (storytime mode) |
| `/shared/:token` | SharedStoryPage (shared opening + storytime) |

### Story Structure

Each storybook has exactly 4 acts: Introduction, The Journey, The Gentle
Conflict, The Sleepy Resolution. Visual style options are defined in
`src/utils/constants.js`. The image safety prompts live in the backend
(`backend/app/routers/ai.py`).
