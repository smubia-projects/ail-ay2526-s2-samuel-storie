import { useState, useCallback } from 'react';
import { apiPost } from '../lib/apiClient';
import * as store from '../lib/storybookStore';

export function useGeneration() {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState(null);

  // Generate a full storybook in one rate-limited backend call, then persist
  // it to the IndexedDB library. Returns the new storybook's id on success.
  const generateStory = useCallback(async ({ prompt, childName, visualStyle }) => {
    setGenerating(true);
    setError(null);
    setProgress('Crafting your story...');

    try {
      const data = await apiPost('/api/generate-storybook', {
        prompt,
        child_name: childName,
        visual_style: visualStyle,
      });

      const title = data.title || (prompt.length > 50 ? prompt.substring(0, 50) + '...' : prompt);
      const book = await store.createStorybook({
        title,
        child_name: childName,
        original_prompt: prompt,
        visual_style: visualStyle,
        status: 'ready',
        pages: data.pages || [],
      });

      setProgress('Complete!');
      return { success: true, id: book.id };
    } catch (err) {
      console.error('Story generation failed:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setGenerating(false);
    }
  }, []);

  const regeneratePageImage = useCallback(async (page, visualStyle, feedback = '') => {
    try {
      const data = await apiPost('/api/regenerate-image', {
        image_prompt: page.image_prompt,
        visual_style: visualStyle,
        feedback,
      });
      await store.updatePage(page.id, { image_url: data.image_url });
      return { success: true, imageUrl: data.image_url };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  const regeneratePageText = useCallback(async (storybook, page, feedback = '') => {
    try {
      const data = await apiPost('/api/regenerate-text', {
        prompt: storybook.original_prompt,
        child_name: storybook.child_name,
        act_title: page.act_title,
        act_number: page.page_number,
        current_text: page.text_content,
        feedback,
      });
      await store.updatePage(page.id, { text_content: data.text_content });
      return { success: true, text: data.text_content };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  return {
    generating,
    progress,
    error,
    generateStory,
    regeneratePageImage,
    regeneratePageText,
  };
}
