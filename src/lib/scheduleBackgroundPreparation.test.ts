import { scheduleBackgroundPreparation } from './scheduleBackgroundPreparation';

describe('background panel preparation', () => {
  let idleCallbacks: Map<number, IdleRequestCallback>;
  let nextId: number;
  let connection: EventTarget & { saveData: boolean };
  let readyState: jest.SpyInstance;
  let visibility: jest.SpyInstance;
  let online: jest.SpyInstance;
  const originalConnection = Object.getOwnPropertyDescriptor(navigator, 'connection');
  const originalIdle = Object.getOwnPropertyDescriptor(window, 'requestIdleCallback');
  const originalCancelIdle = Object.getOwnPropertyDescriptor(window, 'cancelIdleCallback');
  let cancel: (() => void) | undefined;

  beforeEach(() => {
    jest.useFakeTimers();
    idleCallbacks = new Map();
    nextId = 0;
    connection = Object.assign(new EventTarget(), { saveData: false });
    Object.defineProperty(navigator, 'connection', { configurable: true, value: connection });
    Object.defineProperty(window, 'requestIdleCallback', {
      configurable: true,
      value: jest.fn((callback: IdleRequestCallback) => {
        idleCallbacks.set(++nextId, callback);
        return nextId;
      }),
    });
    Object.defineProperty(window, 'cancelIdleCallback', {
      configurable: true,
      value: jest.fn((id: number) => idleCallbacks.delete(id)),
    });
    readyState = jest.spyOn(document, 'readyState', 'get').mockReturnValue('complete');
    visibility = jest.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    online = jest.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
  });

  afterEach(() => {
    cancel?.();
    cancel = undefined;
    for (const [target, key, descriptor] of [
      [navigator, 'connection', originalConnection],
      [window, 'requestIdleCallback', originalIdle],
      [window, 'cancelIdleCallback', originalCancelIdle],
    ] as const) {
      if (descriptor) Object.defineProperty(target, key, descriptor);
      else Reflect.deleteProperty(target, key);
    }
    jest.useRealTimers();
  });

  async function idle() {
    const callbacks = [...idleCallbacks.values()];
    idleCallbacks.clear();
    for (const callback of callbacks) callback({ didTimeout: false, timeRemaining: () => 20 });
    await Promise.resolve();
    await Promise.resolve();
  }

  it('waits for load and gives each completed import a separate idle opportunity', async () => {
    readyState.mockReturnValue('loading');
    let finishFirst!: () => void;
    const first = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          finishFirst = resolve;
        })
    );
    const second = jest.fn().mockResolvedValue(undefined);
    cancel = scheduleBackgroundPreparation([first, second]);
    await idle();
    expect(first).not.toHaveBeenCalled();

    readyState.mockReturnValue('complete');
    window.dispatchEvent(new Event('load'));
    expect(first).not.toHaveBeenCalled();
    await idle();
    expect(first).toHaveBeenCalledTimes(1);
    window.dispatchEvent(new Event('online'));
    await idle();
    expect(second).not.toHaveBeenCalled();
    finishFirst();
    await Promise.resolve();
    await Promise.resolve();
    expect(second).not.toHaveBeenCalled();
    await idle();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('pauses scheduled work while hidden, offline, or saving data, and resumes', async () => {
    const task = jest.fn().mockResolvedValue(undefined);
    cancel = scheduleBackgroundPreparation([task]);
    visibility.mockReturnValue('hidden');
    document.dispatchEvent(new Event('visibilitychange'));
    await idle();
    expect(task).not.toHaveBeenCalled();
    visibility.mockReturnValue('visible');
    online.mockReturnValue(false);
    document.dispatchEvent(new Event('visibilitychange'));
    await idle();
    expect(task).not.toHaveBeenCalled();
    online.mockReturnValue(true);
    connection.saveData = true;
    window.dispatchEvent(new Event('online'));
    await idle();
    expect(task).not.toHaveBeenCalled();
    connection.saveData = false;
    connection.dispatchEvent(new Event('change'));
    await idle();
    expect(task).toHaveBeenCalledTimes(1);
  });

  it('does not start another import after unmounting during an in-flight import', async () => {
    let finish!: () => void;
    const second = jest.fn().mockResolvedValue(undefined);
    cancel = scheduleBackgroundPreparation([
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
      second,
    ]);
    await idle();
    cancel();
    finish();
    await idle();
    await idle();
    expect(second).not.toHaveBeenCalled();
  });

  it('continues past an optional import failure', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const second = jest.fn().mockResolvedValue(undefined);
    cancel = scheduleBackgroundPreparation([() => Promise.reject(new Error('offline')), second]);
    await idle();
    await idle();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('uses a cancellable delay when idle callbacks are unavailable', () => {
    Reflect.deleteProperty(window, 'requestIdleCallback');
    const task = jest.fn().mockResolvedValue(undefined);
    cancel = scheduleBackgroundPreparation([task]);
    jest.advanceTimersByTime(1499);
    expect(task).not.toHaveBeenCalled();
    cancel();
    jest.runOnlyPendingTimers();
    expect(task).not.toHaveBeenCalled();
    cancel = scheduleBackgroundPreparation([task]);
    jest.advanceTimersByTime(1500);
    expect(task).toHaveBeenCalledTimes(1);
  });
});
