# Storie - AI Children's Storybook Generator

A React application that generates personalized bedtime stories for children using AI. Each story features custom illustrations and follows a gentle 4-act narrative structure perfect for bedtime reading.

This is a zero-friction public demo: there are no accounts. Up to 3 storybooks are kept in the browser's IndexedDB and persist until site data is cleared; creating more requires deleting one first.

## Features

- **AI-Powered Story Generation**: Creates personalized 4-act bedtime stories
- **Custom Illustrations**: Generates child-friendly artwork in various visual styles
- **Story Editor**: Edit and regenerate individual pages with text and image feedback
- **Fullscreen Storytime Mode**: Side-by-side layout for immersive reading experience
- **Swipe Navigation**: Touch-friendly page navigation for tablets
- **Multiple Visual Styles**: Watercolor, Claymation, Pastel, Cartoon, and Digital Art

## Story Structure

Each generated storybook follows a 4-act structure:

1. **Introduction** - Sets the scene and introduces characters
2. **The Journey** - The main adventure begins
3. **The Gentle Conflict** - A mild challenge arises
4. **The Sleepy Resolution** - Everything ends peacefully

## Architecture

- **Frontend** (`storybook-app/`): React 19 + Vite 7 SPA, deployed on Vercel. One storybook is stored client-side in IndexedDB (via `idb-keyval`).
- **Backend** (`backend/`): Stateless FastAPI AI proxy, deployed on Google Cloud Run. Proxies story/image generation through OpenRouter and applies per-IP rate limiting via Upstash Redis. Holds no database and no user state.

## Tech Stack

- **Frontend**: React 19 + Vite 7, Tailwind CSS 3.4, React Router 7
- **Backend**: FastAPI (Python 3.11) on Cloud Run
- **AI Inference**: OpenRouter (text + image models)
- **Rate Limiting**: Upstash Redis
- **Persistence**: Browser IndexedDB via `idb-keyval` (no server-side database)

## Local Development

### Backend

```bash
cd backend
python -m venv .venv && . .venv/Scripts/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env   # fill in OPENROUTER_API_KEY
uvicorn app.main:app --reload --port 8080
```

### Frontend

```bash
cd storybook-app
npm install
cp .env.example .env.local   # VITE_API_BASE defaults to http://localhost:8080
npm run dev
```

The app runs on `http://localhost:5173` by default.

## Environment Variables

### Backend (`backend/.env`)

See `backend/.env.example`. Key vars:

- `OPENROUTER_API_KEY` — OpenRouter API key (required)
- `OPENROUTER_MODEL` — text model (default `openai/gpt-4o-mini`)
- `OPENROUTER_IMAGE_MODEL` — image model (default `openai/dall-e-2`)
- `CORS_ORIGINS` — comma-separated allowed origins
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` — rate limiting (optional; disabled if unset; short names without `REST_` also accepted)
- `RATE_LIMIT_GENERATE_MAX` / `RATE_LIMIT_IMAGE_MAX` / `RATE_LIMIT_TEXT_MAX` — per-action limits (defaults `1` / `2` / `5`)
- `RATE_LIMIT_WINDOW_SECONDS` — rolling window (default `432000`, 5 days)

### Frontend (`storybook-app/.env.local`)

- `VITE_API_BASE` — backend URL (Cloud Run URL in production)

## API

| Method & Path | Description | Rate limit (per IP / 5 days) |
|---------------|-------------|--------------|
| `GET /api/health` | Health check → `{"status":"ok"}` | — |
| `POST /api/generate-storybook` | Generate a 4-act story + illustrations | 1 |
| `POST /api/regenerate-image` | Regenerate one page's image with feedback | 2 |
| `POST /api/regenerate-text` | Regenerate one page's text with feedback | 5 |

## Frontend Routes

| Path | Description |
|------|-------------|
| `/` | Home - View all storybooks |
| `/create` | Create a new storybook |
| `/edit/:id` | Edit storybook pages |
| `/story/:id` | Storytime reading mode |

## Visual Styles

- **Watercolor** - Soft, flowing watercolor paintings
- **Claymation** - Playful clay-style illustrations
- **Pastel Illustration** - Gentle pastel artwork
- **Cartoon** - Fun cartoon-style drawings
- **Digital Art** - Modern digital illustrations
