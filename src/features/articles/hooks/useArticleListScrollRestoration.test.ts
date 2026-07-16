import { act, renderHook } from '@testing-library/react';

import { useArticleListScrollRestoration } from './useArticleListScrollRestoration';

const SCROLL_STATE_KEY = '__tjwiki_article_list_scroll_position';

describe('useArticleListScrollRestoration', () => {
  const originalScrollTo = window.scrollTo;

  beforeEach(() => {
    window.history.replaceState({ __NA: true }, '', '/articles/');
    Object.defineProperty(window, 'scrollX', { configurable: true, value: 0 });
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
    window.scrollTo = jest.fn();
  });

  afterEach(() => {
    window.scrollTo = originalScrollTo;
  });

  it('stores the current scroll position in the article list history entry', () => {
    const { unmount } = renderHook(() => useArticleListScrollRestoration(true));

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 640 });
    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });

    expect(window.history.state[SCROLL_STATE_KEY]).toEqual({ x: 0, y: 640 });
    unmount();
  });

  it('restores the saved position after the list has initialized', () => {
    window.history.replaceState(
      {
        __NA: true,
        [SCROLL_STATE_KEY]: { x: 12, y: 480 },
      },
      '',
      '/articles/'
    );

    let nextFrameCallback: FrameRequestCallback | undefined;
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      nextFrameCallback = callback;
      return 1;
    });

    const { unmount } = renderHook(() => useArticleListScrollRestoration(true));

    act(() => {
      nextFrameCallback?.(0);
    });

    expect(window.scrollTo).toHaveBeenCalledWith(12, 480);
    unmount();
    jest.restoreAllMocks();
  });
});
