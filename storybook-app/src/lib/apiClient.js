const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

let _onRateLimited = null;
let _onPaused = null;

export function setRateLimitHandler(handler) {
  _onRateLimited = handler;
}

export function setPausedHandler(handler) {
  _onPaused = handler;
}

async function handleResponse(res) {
  if (res.status === 429) {
    const data = await res.json().catch(() => ({}));
    const queriesUsed = data?.detail?.queries_used || 0;
    if (_onRateLimited) _onRateLimited(queriesUsed);
    const error = new Error('Rate limit exceeded');
    error.status = 429;
    error.queriesUsed = queriesUsed;
    throw error;
  }
  if (res.status === 503) {
    const data = await res.json().catch(() => ({}));
    const message = data?.detail?.message || 'This demo is temporarily paused. Check back soon.';
    if (_onPaused) _onPaused(message);
    const error = new Error(message);
    error.status = 503;
    throw error;
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({ detail: res.statusText }));
    const detail = data?.detail;
    const message = typeof detail === 'string' ? detail : (detail?.message || 'Request failed');
    const error = new Error(message);
    error.status = res.status;
    throw error;
  }
  return res.json();
}

export async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
  });
  return handleResponse(res);
}
