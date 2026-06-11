import { useState, useCallback } from 'react';
import * as store from '../lib/storybookStore';

// Thin wrapper over the IndexedDB store. Functions are async and return the
// familiar { data, error } shape used across the pages.
export function useStorybook() {
  const [loading] = useState(false);
  const [error] = useState(null);

  const getStorybook = useCallback(async (id) => {
    const data = await store.getStorybook(id);
    return { data, error: data ? null : { message: 'Storybook not found' } };
  }, []);

  const getUserStorybooks = useCallback(async () => {
    return { data: await store.getAllStorybooks(), error: null };
  }, []);

  const updateStorybookStatus = useCallback(async (id, status) => {
    const data = await store.updateStorybook(id, { status });
    return { data, error: null };
  }, []);

  const updateStoryPage = useCallback(async (pageId, updates) => {
    const data = await store.updatePage(pageId, updates);
    return { data, error: null };
  }, []);

  const deleteStorybook = useCallback(async (id) => {
    await store.deleteStorybook(id);
    return { error: null };
  }, []);

  return {
    loading,
    error,
    getStorybook,
    getUserStorybooks,
    updateStorybookStatus,
    updateStoryPage,
    deleteStorybook,
  };
}
