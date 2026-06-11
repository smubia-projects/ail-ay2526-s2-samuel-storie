// IndexedDB-backed storybook store (via idb-keyval).
//
// Stories live only in this browser: up to MAX_STORYBOOKS are kept under a
// single key. Creating beyond the cap is rejected — the user must delete one
// first. Data persists in IndexedDB until the user clears site data.

import { get, set, del } from 'idb-keyval';

const STORYBOOKS_KEY = 'storie_storybooks';
const LEGACY_KEY = 'storie_storybook'; // pre-library single-book key

export const MAX_STORYBOOKS = 3;

function uuid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function withPreview(book) {
  const pages = book.pages || [];
  const firstPage = pages.find((p) => p.page_number === 1) || pages[0];
  return { ...book, preview_image_url: firstPage?.image_url || null };
}

async function getBooks() {
  const books = await get(STORYBOOKS_KEY);
  if (books) return books;
  // Migrate the old single-storybook key into the library format.
  const legacy = await get(LEGACY_KEY);
  if (legacy) {
    await set(STORYBOOKS_KEY, [legacy]);
    await del(LEGACY_KEY);
    return [legacy];
  }
  return [];
}

async function saveBooks(books) {
  await set(STORYBOOKS_KEY, books);
}

export async function countStorybooks() {
  return (await getBooks()).length;
}

export async function isLibraryFull() {
  return (await countStorybooks()) >= MAX_STORYBOOKS;
}

export async function getAllStorybooks() {
  const books = await getBooks();
  return books
    .map(withPreview)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export async function getStorybook(id) {
  const books = await getBooks();
  const book = books.find((b) => b.id === id);
  if (!book) return null;
  return { ...book, story_pages: book.pages || [] };
}

export async function createStorybook({ title, child_name, original_prompt, visual_style, status = 'ready', pages = [] }) {
  const books = await getBooks();
  if (books.length >= MAX_STORYBOOKS) {
    throw new Error(
      `You can keep up to ${MAX_STORYBOOKS} storybooks — delete one to make room for a new story.`
    );
  }
  const now = new Date().toISOString();
  const book = {
    id: uuid(),
    title,
    child_name,
    original_prompt,
    visual_style,
    status,
    created_at: now,
    updated_at: now,
    pages: pages.map((p) => ({ id: p.id || uuid(), ...p })),
  };
  await saveBooks([...books, book]);
  return book;
}

export async function updateStorybook(id, updates) {
  const books = await getBooks();
  const idx = books.findIndex((b) => b.id === id);
  if (idx === -1) return null;
  const updated = { ...books[idx], ...updates, updated_at: new Date().toISOString() };
  books[idx] = updated;
  await saveBooks(books);
  return updated;
}

export async function updatePage(pageId, updates) {
  const books = await getBooks();
  for (const book of books) {
    const page = (book.pages || []).find((p) => p.id === pageId);
    if (page) {
      Object.assign(page, updates);
      book.updated_at = new Date().toISOString();
      await saveBooks(books);
      return page;
    }
  }
  return null;
}

export async function deleteStorybook(id) {
  const books = await getBooks();
  await saveBooks(books.filter((b) => b.id !== id));
}
