import { act, render, waitFor } from '@testing-library/react';

import { ServiceWorkerRegistration } from './ServiceWorkerRegistration';

let mockPathname = '/characters/汤姆/';
const mockWarmPage = jest.fn().mockResolvedValue(undefined);
const mockWarmImages = jest.fn().mockResolvedValue(undefined);
const mockToast = { warning: jest.fn(), info: jest.fn() };
jest.mock('next/navigation', () => ({ usePathname: () => mockPathname }));
jest.mock('@/context/ToastContext', () => ({ useToast: () => mockToast }));
jest.mock('@/env', () => ({ env: { NEXT_PUBLIC_DISABLE_IMAGE_OPTIMIZATION: '0' } }));
jest.mock('@/lib/offlineWarmup', () => ({
  warmOfflinePage: (path: string) => mockWarmPage(path),
  warmOfflineImages: (optimized: boolean) => mockWarmImages(optimized),
}));

it('warms after slow activation and saves subsequent client-side visits without repeating startup', async () => {
  const originalWorker = Object.getOwnPropertyDescriptor(navigator, 'serviceWorker');
  const originalFetch = global.fetch;
  const container = Object.assign(new EventTarget(), {
    controller: null as ServiceWorker | null,
    register: jest
      .fn()
      .mockResolvedValue({ scope: '/', update: jest.fn().mockResolvedValue(undefined) }),
  });
  jest.replaceProperty(process.env, 'NODE_ENV', 'production');
  Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: container });
  global.fetch = jest
    .fn()
    .mockResolvedValue({ ok: true, headers: new Headers({ 'content-type': 'text/javascript' }) });
  const log = jest.spyOn(console, 'log').mockImplementation(() => {});
  const view = render(<ServiceWorkerRegistration />);
  try {
    await waitFor(() => expect(container.register).toHaveBeenCalled());
    jest.useFakeTimers();
    await act(async () => {
      jest.advanceTimersByTime(6000);
    });
    expect(mockWarmPage).not.toHaveBeenCalled();
    container.controller = {} as ServiceWorker;
    await act(async () => {
      container.dispatchEvent(new Event('controllerchange'));
    });
    expect(mockWarmPage.mock.calls.map(([path]) => path)).toEqual([
      '/',
      '/factions/cat/',
      '/factions/mouse/',
      '/characters/汤姆/',
    ]);
    expect(mockWarmImages).toHaveBeenCalledTimes(1);

    mockWarmPage.mockClear();
    mockPathname = '/items/盘子/';
    await act(async () => {
      view.rerender(<ServiceWorkerRegistration />);
    });
    expect(mockWarmPage).toHaveBeenCalledWith('/items/盘子/');
    expect(mockWarmPage).toHaveBeenCalledTimes(1);
    expect(mockWarmImages).toHaveBeenCalledTimes(1);
    view.unmount();
    container.controller = {} as ServiceWorker;
    await act(async () => {
      container.dispatchEvent(new Event('controllerchange'));
    });
    expect(mockWarmImages).toHaveBeenCalledTimes(1);
  } finally {
    view.unmount();
    jest.useRealTimers();
    jest.restoreAllMocks();
    log.mockRestore();
    global.fetch = originalFetch;
    if (originalWorker) Object.defineProperty(navigator, 'serviceWorker', originalWorker);
    else Reflect.deleteProperty(navigator, 'serviceWorker');
  }
});
