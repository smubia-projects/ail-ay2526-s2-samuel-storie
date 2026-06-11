import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStorybook } from '../hooks/useStorybook';
import { MAX_STORYBOOKS } from '../lib/storybookStore';
import StorybookList from '../components/storybook/StorybookList';
import Button from '../components/common/Button';

export default function HomePage() {
  const { getUserStorybooks, deleteStorybook } = useStorybook();
  const [storybooks, setStorybooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStorybooks = async () => {
      const { data } = await getUserStorybooks();
      setStorybooks(data || []);
      setLoading(false);
    };
    loadStorybooks();
  }, [getUserStorybooks]);

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this storybook?')) {
      await deleteStorybook(id);
      setStorybooks((prev) => prev.filter((book) => book.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-retro-cream">
      <header className="bg-retro-paper border-b-3 border-retro-dark">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-4xl font-display">✦</span>
            <h1 className="text-2xl font-display font-bold text-retro-dark tracking-wide">Storie</h1>
          </div>
          <span className="text-retro-brown font-retro hidden sm:inline">
            AI Bedtime Storybooks
          </span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-display font-bold text-retro-dark">Your Storybooks</h2>
            {!loading && (
              <p className="text-sm text-retro-brown font-retro mt-1">
                {storybooks.length} of {MAX_STORYBOOKS} stories on this device
              </p>
            )}
          </div>
          {storybooks.length >= MAX_STORYBOOKS ? (
            <div className="text-right">
              <Button disabled>Create New Story</Button>
              <p className="text-xs text-retro-brown font-retro mt-2">
                Library full — delete a story to make room
              </p>
            </div>
          ) : (
            <Link to="/create">
              <Button>Create New Story</Button>
            </Link>
          )}
        </div>

        <StorybookList
          storybooks={storybooks}
          loading={loading}
          onDelete={handleDelete}
        />
      </main>
    </div>
  );
}
