/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { setRateLimitHandler, setPausedHandler } from '../lib/apiClient';

const RateLimitContext = createContext(null);

export function RateLimitProvider({ children }) {
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [queriesMade, setQueriesMade] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [pausedMessage, setPausedMessage] = useState('');

  useEffect(() => {
    setRateLimitHandler((count) => {
      setQueriesMade(count);
      setIsRateLimited(true);
    });
    setPausedHandler((message) => {
      setPausedMessage(message);
      setIsPaused(true);
    });
  }, []);

  const dismissRateLimit = useCallback(() => {
    setIsRateLimited(false);
  }, []);

  const dismissPaused = useCallback(() => {
    setIsPaused(false);
  }, []);

  return (
    <RateLimitContext.Provider
      value={{ isRateLimited, queriesMade, dismissRateLimit, isPaused, pausedMessage, dismissPaused }}
    >
      {children}
    </RateLimitContext.Provider>
  );
}

export function useRateLimit() {
  const context = useContext(RateLimitContext);
  if (!context) {
    throw new Error('useRateLimit must be used within a RateLimitProvider');
  }
  return context;
}
