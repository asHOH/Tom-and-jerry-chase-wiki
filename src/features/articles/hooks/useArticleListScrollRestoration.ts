'use client';

import { useCallback, useEffect, useLayoutEffect } from 'react';

const ARTICLE_LIST_SCROLL_STATE_KEY = '__tjwiki_article_list_scroll_position';

type ScrollPosition = {
  x: number;
  y: number;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const getSavedScrollPosition = (): ScrollPosition | null => {
  const state = window.history.state;
  if (!isRecord(state)) return null;

  const savedPosition = state[ARTICLE_LIST_SCROLL_STATE_KEY];
  if (!isRecord(savedPosition)) return null;

  const { x, y } = savedPosition;
  if (
    typeof x !== 'number' ||
    !Number.isFinite(x) ||
    x < 0 ||
    typeof y !== 'number' ||
    !Number.isFinite(y) ||
    y < 0
  ) {
    return null;
  }

  return { x, y };
};

export function useArticleListScrollRestoration(enabled: boolean): void {
  const saveScrollPosition = useCallback(() => {
    const currentState = window.history.state;
    const nextState = {
      ...(isRecord(currentState) ? currentState : {}),
      [ARTICLE_LIST_SCROLL_STATE_KEY]: {
        x: window.scrollX,
        y: window.scrollY,
      },
    };

    window.history.replaceState(nextState, '', window.location.href);
  }, []);

  useLayoutEffect(() => {
    if (!enabled) return;

    const savedPosition = getSavedScrollPosition();
    if (!savedPosition) return;

    let frameId: number | null = null;

    const restore = () => {
      window.scrollTo(savedPosition.x, savedPosition.y);
      frameId = null;
    };

    frameId = window.requestAnimationFrame(() => {
      window.scrollTo(savedPosition.x, savedPosition.y);
      frameId = window.requestAnimationFrame(restore);
    });

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('scroll', saveScrollPosition, { passive: true });
    return () => window.removeEventListener('scroll', saveScrollPosition);
  }, [enabled, saveScrollPosition]);
}
