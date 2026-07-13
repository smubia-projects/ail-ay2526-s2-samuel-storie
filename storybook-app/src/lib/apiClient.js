const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';
const OWNER_COOKIE = 'storie_owner';

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
    const isPausedResponse = typeof data?.detail === 'object' && Boolean(data.detail?.message);
    const message = isPausedResponse
      ? data.detail.message
      : (typeof data?.detail === 'string' ? data.detail : 'Please try again soon.');
    if (isPausedResponse && _onPaused) _onPaused(message);
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

function getCookie(name) {
  const prefix = `${encodeURIComponent(name)}=`;
  const entry = document.cookie.split('; ').find((part) => part.startsWith(prefix));
  return entry ? decodeURIComponent(entry.slice(prefix.length)) : null;
}

function createOwnerToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function getOwnerToken() {
  let token = getCookie(OWNER_COOKIE);
  if (token) return token;

  token = createOwnerToken();
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${OWNER_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
  return token;
}

function requestHeaders(hasBody = false) {
  return {
    ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
    'X-Storie-Owner': getOwnerToken(),
  };
}

export async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: requestHeaders(true),
    body: JSON.stringify(body || {}),
  });
  return handleResponse(res);
}

export async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: requestHeaders(),
  });
  return handleResponse(res);
}
