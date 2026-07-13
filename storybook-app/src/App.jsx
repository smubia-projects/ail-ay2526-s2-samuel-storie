import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { RateLimitProvider, useRateLimit } from './hooks/useRateLimit';
import RateLimitCTA from './components/RateLimitCTA';
import PausedNotice from './components/PausedNotice';
import HomePage from './pages/HomePage';
import CreateStoryPage from './pages/CreateStoryPage';
import EditStoryPage from './pages/EditStoryPage';
import ViewStoryPage from './pages/ViewStoryPage';
import SharedStoryPage from './pages/SharedStoryPage';

function StatusOverlay() {
  const {
    isRateLimited, queriesMade, dismissRateLimit,
    isPaused, pausedMessage, dismissPaused,
  } = useRateLimit();
  if (isPaused) return <PausedNotice message={pausedMessage} onDismiss={dismissPaused} />;
  if (isRateLimited) return <RateLimitCTA queriesMade={queriesMade} onDismiss={dismissRateLimit} />;
  return null;
}

function App() {
  return (
    <RateLimitProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/create" element={<CreateStoryPage />} />
          <Route path="/edit/:id" element={<EditStoryPage />} />
          <Route path="/story/:id" element={<ViewStoryPage />} />
          <Route path="/shared/:token" element={<SharedStoryPage />} />
        </Routes>
        <StatusOverlay />
      </BrowserRouter>
    </RateLimitProvider>
  );
}

export default App;
