import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageEditor from './PageEditor';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import { useGeneration } from '../../hooks/useGeneration';
import StoryActions from './StoryActions';

export default function DirectorsCut({
  storybook,
  pages: initialPages,
}) {
  const navigate = useNavigate();
  const { regeneratePageImage, regeneratePageText } = useGeneration();
  const [pages, setPages] = useState(initialPages || []);
  const [isRegenerating, setIsRegenerating] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialPages) {
      setPages([...initialPages].sort((a, b) => a.page_number - b.page_number));
    }
  }, [initialPages]);

  const handleRequestEdit = async (pageId, issueType, feedback) => {
    setIsRegenerating(`${issueType}-${pageId}`);
    setError('');

    try {
      const page = pages.find((p) => p.id === pageId);

      if (issueType === 'image') {
        const res = await regeneratePageImage(page, storybook.visual_style, feedback);
        if (!res.success) throw new Error(res.error);
        setPages((prev) => prev.map((p) =>
          p.id === pageId ? { ...p, image_url: res.imageUrl } : p
        ));
      } else if (issueType === 'text') {
        const res = await regeneratePageText(storybook, page, feedback);
        if (!res.success) throw new Error(res.error);
        setPages((prev) => prev.map((p) =>
          p.id === pageId ? { ...p, text_content: res.text } : p
        ));
      }
    } catch (err) {
      // 429 (rate limit) and 503 (paused) show their own modals.
      if (!/rate limit|paused/i.test(err.message)) {
        setError(`Failed to regenerate ${issueType}: ${err.message}`);
      }
    } finally {
      setIsRegenerating(null);
    }
  };

  const handleFinish = () => {
    navigate(`/story/${storybook.id}`);
  };

  if (!pages.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-retro-paper border-3 border-retro-dark shadow-retro">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-retro-brown font-retro">Loading your storybook...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8 bg-retro-paper border-3 border-retro-dark shadow-retro p-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-retro-dark">{storybook.title}</h1>
          <p className="text-retro-brown font-retro">for {storybook.child_name}</p>
        </div>
        <div className="text-right space-y-3">
          <StoryActions storybook={{ ...storybook, pages }} />
          <Button onClick={handleFinish} size="lg">
            Start Storytime
          </Button>
          <p className="mt-2 text-xs text-retro-brown font-retro">
            Saved to your library on this device
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6">
          <ErrorMessage message={error} onDismiss={() => setError('')} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {pages.map((page) => (
          <PageEditor
            key={page.id}
            page={page}
            onRequestEdit={handleRequestEdit}
            isRegenerating={isRegenerating}
            storybookStatus={storybook.status}
          />
        ))}
      </div>

      <div className="mt-8 text-center bg-retro-paper border-3 border-retro-dark shadow-retro p-6">
        <p className="text-sm text-retro-brown font-retro mb-4">
          Click "Request Edit" on any page to make changes
        </p>
        <Button onClick={handleFinish} size="lg">
          Start Storytime
        </Button>
        <p className="mt-3 text-xs text-retro-brown font-retro">
          Your storybook is saved to your library on this device — it isn't
          shared or uploaded anywhere.
        </p>
      </div>
    </div>
  );
}
