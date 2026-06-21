'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type TimerState = {
  timeLeft: number;
  isRunning: boolean;
  formattedTime: string;
};

type TimerActions = {
  start: () => void;
  pause: () => void;
  reset: (newTime?: number) => void;
};

/**
 * Countdown timer hook.
 *
 * @param initialSeconds - Starting time in seconds
 * @param onEnd - Callback fired when timer reaches 0
 * @returns Timer state and control actions
 */
export function useTimer(initialSeconds: number, onEnd?: () => void): TimerState & TimerActions {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onEndRef = useRef(onEnd);

  // Keep onEnd callback ref current without triggering re-render
  useEffect(() => {
    onEndRef.current = onEnd;
  }, [onEnd]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
    clearTimer();
  }, [clearTimer]);

  const reset = useCallback(
    (newTime?: number) => {
      clearTimer();
      setIsRunning(false);
      setTimeLeft(newTime ?? initialSeconds);
    },
    [clearTimer, initialSeconds]
  );

  // Tick logic
  useEffect(() => {
    if (!isRunning) {
      clearTimer();
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          setIsRunning(false);
          clearTimer();
          // Fire onEnd on next microtask to avoid setState-during-render
          queueMicrotask(() => onEndRef.current?.());
          return 0;
        }
        return next;
      });
    }, 1000);

    return clearTimer;
  }, [isRunning, clearTimer]);

  // Cleanup on unmount
  useEffect(() => clearTimer, [clearTimer]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return { timeLeft, isRunning, formattedTime, start, pause, reset };
}
