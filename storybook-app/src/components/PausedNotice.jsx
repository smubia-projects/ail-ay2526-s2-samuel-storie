import { useEffect } from 'react';
import Button from './common/Button';

// Shown when the backend returns HTTP 503 (the demo is paused via the kill
// switch). Distinct from the rate-limit CTA, which is for 429.
export default function PausedNotice({ message, onDismiss }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onDismiss();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onDismiss]);

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-retro-dark/60"
      onClick={onDismiss}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="bg-retro-paper border-3 border-retro-dark shadow-retro-lg max-w-md w-full p-8 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-4xl block mb-3">🌙</span>
        <h2 className="text-2xl font-display font-bold text-retro-dark mb-2">
          Taking a quick nap
        </h2>
        <p className="text-retro-brown font-retro mb-6">
          {message || 'This demo is temporarily paused. Check back soon.'}
        </p>
        <Button onClick={onDismiss} className="w-full">
          Okay
        </Button>
      </div>
    </div>
  );
}
