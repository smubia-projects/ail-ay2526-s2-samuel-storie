import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import StorytimeMode from '../components/storybook/StorytimeMode';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';
import { getSharedStory } from '../lib/shareStory';
import { saveSharedStorybook } from '../lib/storybookStore';

export default function SharedStoryPage() {
  const { token } = useParams();
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showOpening, setShowOpening] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedBook, setSavedBook] = useState(null);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    getSharedStory(token)
      .then((data) => {
        if (!cancelled) setStory(data.story);
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [token]);

  const keepStory = async () => {
    setSaving(true);
    setSaveMessage('');
    try {
      const book = await saveSharedStorybook(story);
      setSavedBook(book);
      setSaveMessage('Tucked safely into this browser.');
    } catch (saveError) {
      setSaveMessage(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-retro-dark flex items-center justify-center"><LoadingSpinner size="lg" /></div>;
  }

  if (error || !story?.pages?.length) {
    return (
      <div className="min-h-screen bg-retro-cream flex items-center justify-center p-4">
        <div className="max-w-lg text-center bg-retro-paper border-3 border-retro-dark shadow-retro p-8">
          <span className="text-5xl font-display text-retro-gold">✦</span>
          <h1 className="text-3xl font-display font-bold text-retro-dark mt-3">This tale has wandered away</h1>
          <p className="text-retro-brown font-retro my-5">{error || 'This story link could not be found.'}</p>
          <Link to="/create"><Button>Make Your Own Story</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <StorytimeMode storybook={story} pages={story.pages} />
      {showOpening && (
        <div className="fixed inset-0 z-[1100] bg-retro-dark/90 backdrop-blur-md flex items-center justify-center p-4">
          <section role="dialog" aria-modal="true" aria-labelledby="shared-story-title" className="w-full max-w-xl bg-retro-paper border-3 border-retro-dark shadow-retro-lg p-8 text-center">
            <span className="text-6xl font-display text-retro-gold">✦</span>
            <p className="retro-label mt-2">A story has found its way to you</p>
            <h1 id="shared-story-title" className="text-4xl font-display font-bold text-retro-dark mt-3">You’re reading “{story.title}”</h1>
            <p className="text-lg text-retro-brown font-storybook mt-4">
              A bedtime adventure made for {story.child_name || 'someone special'}.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" onClick={() => setShowOpening(false)}>Begin Storytime</Button>
              <Button size="lg" variant="secondary" onClick={keepStory} disabled={saving || savedBook}>
                {savedBook ? 'Kept in My Library' : saving ? 'Finding a Shelf...' : 'Keep in My Library'}
              </Button>
            </div>
            {saveMessage && <p className={`text-sm font-retro mt-4 ${savedBook ? 'text-retro-green' : 'text-retro-red'}`}>{saveMessage}</p>}
            <p className="text-xs text-retro-brown font-retro mt-5">
              Saved stories stay in this browser. This shared link fades after 7 days.
            </p>
            <Link to="/create" className="inline-block mt-5 text-retro-rust underline font-retro font-bold">Make your own magical story →</Link>
          </section>
        </div>
      )}
    </>
  );
}
