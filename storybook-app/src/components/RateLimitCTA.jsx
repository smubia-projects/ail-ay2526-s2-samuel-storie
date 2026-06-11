import { useEffect, useRef } from 'react';

const PROJECT_CONFIG = {
  name: 'Storie',
  emoji: '📖',
  accentColor: '#a65d3f',
  headline: 'Loved making your storybook?',
  description: "You've used your {count} free AI generation(s) for this demo. In SMUBIA's AI Lodge, you'll learn to build AI apps like this from scratch.",
  programme: 'AI Lodge',
  programmeLink: 'https://www.smubia.com/ai-lodge',
  githubLink: 'https://github.com/smubia-projects/ail-ay2526-s2-samuel-storie',
  showcaseLink: 'https://www.smubia.com/showcase',
};

function hexToHsl(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

export default function RateLimitCTA({ queriesMade, onDismiss }) {
  const cardRef = useRef(null);
  const [h, s, l] = hexToHsl(PROJECT_CONFIG.accentColor);

  const description = PROJECT_CONFIG.description.replace('{count}', queriesMade);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onDismiss();
    };
    document.addEventListener('keydown', handleKeyDown);

    if (cardRef.current) {
      const focusable = cardRef.current.querySelectorAll('a, button');
      if (focusable.length) focusable[0].focus();
    }

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onDismiss]);

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
      onClick={onDismiss}
      style={{ animation: 'rl-backdrop-in 500ms ease forwards' }}
    >
      <style>{`
        @keyframes rl-backdrop-in {
          from { backdrop-filter: blur(0px); background: rgba(0,0,0,0); }
          to { backdrop-filter: blur(12px); background: rgba(0,0,0,0.5); }
        }
        @keyframes rl-card-in {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes rl-shimmer {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md overflow-hidden rounded-xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'rl-card-in 600ms cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
      >
        {/* Top Banner */}
        <div
          className="relative px-6 py-8 text-center overflow-hidden"
          style={{
            background: `linear-gradient(135deg, hsl(${h}, ${s}%, ${l + 15}%), hsl(${h}, ${s}%, ${l}%), hsl(${h}, ${s}%, ${l - 10}%))`,
            backgroundSize: '200% 200%',
            animation: 'rl-shimmer 6s ease infinite',
          }}
        >
          <div
            className="absolute -top-8 -right-8 w-32 h-32 rounded-full"
            style={{ background: 'rgba(255,255,255,0.12)' }}
          />
          <div
            className="absolute top-16 -right-4 w-20 h-20 rounded-full"
            style={{ background: 'rgba(255,255,255,0.08)' }}
          />
          <div className="relative z-10">
            <span className="text-4xl block mb-3">{PROJECT_CONFIG.emoji}</span>
            <h2 className="text-2xl font-display font-bold text-white mb-2" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
              {PROJECT_CONFIG.headline}
            </h2>
            <p className="text-white/85 text-sm font-retro leading-relaxed max-w-xs mx-auto">
              {description}
            </p>
          </div>
        </div>

        {/* CTA Body */}
        <div className="px-6 py-6 space-y-3" style={{ background: '#18181B' }}>
          <a
            href={PROJECT_CONFIG.programmeLink}
            target="_blank"
            rel="noopener noreferrer"
            className="relative flex items-center justify-center w-full py-3 px-4 rounded-lg text-white font-display font-semibold text-sm tracking-wide transition-transform hover:scale-[1.02]"
            style={{
              background: `linear-gradient(135deg, hsl(${h}, ${s}%, ${l + 5}%), hsl(${h}, ${s}%, ${l - 5}%))`,
              boxShadow: `0 4px 14px hsla(${h}, ${s}%, ${l}%, 0.4)`,
            }}
          >
            🚀 Join {PROJECT_CONFIG.programme}
            <span className="absolute right-4 opacity-50">→</span>
          </a>

          <a
            href={PROJECT_CONFIG.githubLink}
            target="_blank"
            rel="noopener noreferrer"
            className="relative flex items-center justify-center w-full py-3 px-4 rounded-lg text-white/90 font-display text-sm tracking-wide border border-white/10 hover:border-white/25 transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            Self-host from GitHub
            <span className="absolute right-4 opacity-50">→</span>
          </a>

          <a
            href={PROJECT_CONFIG.showcaseLink}
            target="_blank"
            rel="noopener noreferrer"
            className="relative flex items-center justify-center w-full py-3 px-4 rounded-lg text-white/90 font-display text-sm tracking-wide border border-white/10 hover:border-white/25 transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            🌐 Explore other projects
            <span className="absolute right-4 opacity-50">→</span>
          </a>

          <button
            onClick={onDismiss}
            className="w-full py-2 text-sm font-retro transition-colors"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
