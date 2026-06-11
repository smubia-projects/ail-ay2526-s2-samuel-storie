import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGeneration } from '../hooks/useGeneration';
import { isLibraryFull, MAX_STORYBOOKS } from '../lib/storybookStore';
import MagicPrompt from '../components/storybook/MagicPrompt';
import Button from '../components/common/Button';

export default function CreateStoryPage() {
  const navigate = useNavigate();
  const { generateStory } = useGeneration();
  const [isGenerating, setIsGenerating] = useState(false);
  const [libraryFull, setLibraryFull] = useState(false);
  const [checkingLibrary, setCheckingLibrary] = useState(true);

  useEffect(() => {
    isLibraryFull().then((full) => {
      setLibraryFull(full);
      setCheckingLibrary(false);
    });
  }, []);

  const handleSubmit = async ({ prompt, childName, visualStyle }) => {
    // Up to MAX_STORYBOOKS are kept on this device — block creation past that.
    if (await isLibraryFull()) {
      setLibraryFull(true);
      return;
    }

    setIsGenerating(true);

    const result = await generateStory({ prompt, childName, visualStyle });

    if (!result.success) {
      setIsGenerating(false);
      // A 429 (rate limit) and 503 (paused) surface their own modals
      // automatically; only alert on other failures.
      if (result.error && !/rate limit|paused/i.test(result.error)) {
        alert('Failed to create storybook: ' + result.error);
      }
      return;
    }

    navigate(`/edit/${result.id}`);
  };

  return (
    <div className="min-h-screen bg-retro-cream">
      <header className="bg-retro-paper border-b-3 border-retro-dark">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <span className="text-4xl font-display">✦</span>
            <h1 className="text-2xl font-display font-bold text-retro-dark tracking-wide">Storie</h1>
          </Link>
          <Link to="/">
            <Button variant="ghost">Back to Library</Button>
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        {checkingLibrary ? null : libraryFull ? (
          <div className="max-w-xl mx-auto text-center bg-retro-paper border-3 border-retro-dark shadow-retro p-8">
            <p className="text-3xl mb-4">📚</p>
            <h2 className="text-2xl font-display font-bold text-retro-dark mb-3">
              Your library is full
            </h2>
            <p className="text-retro-brown font-retro mb-6">
              You can keep up to {MAX_STORYBOOKS} storybooks on this device.
              Delete one from your library to make room for a new story.
            </p>
            <Link to="/">
              <Button size="lg">Back to Library</Button>
            </Link>
          </div>
        ) : (
          <MagicPrompt onSubmit={handleSubmit} isGenerating={isGenerating} />
        )}
      </main>
    </div>
  );
}
