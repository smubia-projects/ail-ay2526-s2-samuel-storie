import { useState } from 'react';
import Button from '../common/Button';
import ShareStoryModal from './ShareStoryModal';
import { createStoryShare } from '../../lib/shareStory';
import { downloadStoryImages } from '../../lib/downloadStory';

export default function StoryActions({ storybook, compact = false }) {
  const [sharing, setSharing] = useState(false);
  const [share, setShare] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [message, setMessage] = useState('');

  const openShare = async () => {
    setSharing(true);
    setMessage('');
    try {
      setShare(await createStoryShare(storybook));
    } catch (error) {
      setMessage(error.message || 'The sharing spell did not work. Please try again.');
    } finally {
      setSharing(false);
    }
  };

  const download = async () => {
    setDownloading(true);
    setMessage('');
    try {
      await downloadStoryImages(storybook);
    } catch (error) {
      setMessage(error.message || 'Your story pages could not be prepared just now.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <div className={`flex gap-2 ${compact ? 'w-full' : 'flex-wrap justify-end'}`}>
        <Button size={compact ? 'sm' : 'md'} variant="secondary" className={compact ? 'flex-1' : ''} onClick={openShare} disabled={sharing}>
          {sharing ? 'Weaving Link...' : 'Share'}
        </Button>
        <Button size={compact ? 'sm' : 'md'} variant="secondary" className={compact ? 'flex-1' : ''} onClick={download} disabled={downloading}>
          {downloading ? 'Painting Pages...' : 'Download Story'}
        </Button>
      </div>
      {message && <p className="text-xs text-retro-red font-retro mt-2">{message}</p>}
      {share && <ShareStoryModal storybook={storybook} share={share} onClose={() => setShare(null)} />}
    </>
  );
}
