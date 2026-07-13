import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStorybook } from '../hooks/useStorybook';
import StorytimeMode from '../components/storybook/StorytimeMode';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';
import StoryActions from '../components/storybook/StoryActions';

export default function ViewStoryPage() {
  const { id } = useParams();
  const { getStorybook } = useStorybook();
  const [storybook, setStorybook] = useState(null);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await getStorybook(id);
      if (data) {
        setStorybook(data);
        setPages(data.story_pages || []);
      }
      setLoading(false);
    };
    load();
  }, [id, getStorybook]);

  if (loading) {
    return (
      <div className="min-h-screen bg-retro-dark flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!storybook || !pages.length) {
    return (
      <div className="min-h-screen bg-retro-cream flex items-center justify-center">
        <div className="text-center bg-retro-paper border-3 border-retro-dark shadow-retro p-8">
          <h2 className="text-2xl font-display font-bold text-retro-dark mb-4">Storybook not found</h2>
          <Link to="/">
            <Button>Back to Library</Button>
          </Link>
        </div>
      </div>
    );
  }

  const storyWithPages = { ...storybook, pages };

  return (
    <StorytimeMode
      storybook={storybook}
      pages={pages}
      endActions={(
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/"><Button size="lg">Back to Your Storybooks</Button></Link>
            <Link to="/create"><Button size="lg" variant="secondary">Create Another Story</Button></Link>
          </div>
          <StoryActions storybook={storyWithPages} align="center" />
          <p className="text-xs text-retro-brown font-retro">
            This story is already safe in your library on this device.
          </p>
        </div>
      )}
    />
  );
}
