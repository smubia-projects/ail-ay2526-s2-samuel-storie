import { apiGet, apiPost } from './apiClient';

export async function createStoryShare(storybook) {
  const data = await apiPost('/api/shares', {
    client_story_id: storybook.id,
    title: storybook.title,
    child_name: storybook.child_name || '',
    original_prompt: storybook.original_prompt || '',
    visual_style: storybook.visual_style || '',
    pages: (storybook.pages || storybook.story_pages || []).map((page) => ({
      page_number: page.page_number,
      act_title: page.act_title || '',
      text_content: page.text_content || '',
      image_url: page.image_url || null,
      image_prompt: page.image_prompt || '',
    })),
  });

  return {
    url: `${window.location.origin}/shared/${data.token}`,
    expiresAt: data.expires_at,
  };
}

export async function getSharedStory(token) {
  return apiGet(`/api/shares/${encodeURIComponent(token)}`);
}
