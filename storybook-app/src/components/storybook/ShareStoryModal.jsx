import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import Button from '../common/Button';

export default function ShareStoryModal({ storybook, share, onClose }) {
  const [showQr, setShowQr] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onKeyDown = (event) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (!showQr || qrCode) return;
    QRCode.toDataURL(share.url, {
      width: 360,
      margin: 2,
      color: { dark: '#4a3728', light: '#f4f1e8' },
    }).then(setQrCode);
  }, [qrCode, share.url, showQr]);

  const copyLink = async () => {
    await navigator.clipboard.writeText(share.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="fixed inset-0 z-[1100] bg-retro-dark/80 backdrop-blur-sm flex items-center justify-center p-4" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section role="dialog" aria-modal="true" aria-labelledby="share-story-title" className="w-full max-w-lg md:max-w-3xl bg-retro-paper border-3 border-retro-dark shadow-retro-lg p-6 md:p-8">
        <div className="text-center mb-5">
          <span className="text-5xl text-retro-gold font-display">✦</span>
          <h2 id="share-story-title" className="text-3xl font-display font-bold text-retro-dark mt-2">Pass This Tale Along</h2>
          <p className="font-retro text-retro-brown mt-2">
            Send <span className="font-bold">{storybook.title}</span> to someone special.
          </p>
        </div>

        <div className={showQr ? 'md:grid md:grid-cols-[minmax(0,1fr)_auto] md:gap-8 md:items-start' : ''}>
          <div className="min-w-0">
            <label className="retro-label block mb-2 text-left" htmlFor="magic-link">Your enchanted story link</label>
            <div className="flex gap-2">
              <input id="magic-link" readOnly value={share.url} className="retro-input px-3 py-2 min-w-0 flex-1 text-sm" onFocus={(event) => event.target.select()} />
              <Button onClick={copyLink}>{copied ? 'Copied!' : 'Copy Link'}</Button>
            </div>
            <p className="text-xs font-retro text-retro-brown mt-3 text-center md:text-left">
              This enchanted link fades after 7 days.
            </p>
            {!showQr && (
              <div className="mt-5 text-center md:text-left">
                <Button variant="secondary" onClick={() => setShowQr(true)}>Show a QR to Scan</Button>
              </div>
            )}
          </div>

          {showQr && (
            <div className="mt-5 md:mt-0 text-center md:w-56">
              <p className="retro-label mb-2 md:text-left">Scan to open</p>
              <div className="inline-block bg-retro-cream border-3 border-retro-dark p-3">
                {qrCode ? <img src={qrCode} alt="QR code for the shared story" className="w-52 h-52" /> : <p className="font-retro p-10">Drawing your code...</p>}
              </div>
              <Button variant="ghost" size="sm" className="mt-2" onClick={() => setShowQr(false)}>Hide the QR</Button>
            </div>
          )}
        </div>

        <Button variant="ghost" className="w-full mt-5" onClick={onClose}>Close</Button>
      </section>
    </div>
  );
}
