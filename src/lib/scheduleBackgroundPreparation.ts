type Connection = EventTarget & { saveData?: boolean };

/** Start one optional import per idle opportunity, after the page has loaded. */
export function scheduleBackgroundPreparation(tasks: readonly (() => Promise<unknown>)[]) {
  const connection = (navigator as Navigator & { connection?: Connection }).connection;
  let disposed = false;
  let running = false;
  let index = 0;
  let cancelScheduled: (() => void) | undefined;

  const canPrepare = () =>
    document.readyState === 'complete' &&
    document.visibilityState === 'visible' &&
    navigator.onLine &&
    !connection?.saveData;

  const schedule = () => {
    cancelScheduled?.();
    cancelScheduled = undefined;
    if (disposed || running || index >= tasks.length || !canPrepare()) return;

    const run = () => {
      cancelScheduled = undefined;
      if (disposed || !canPrepare()) return;
      const task = tasks[index++];
      if (!task) return;
      running = true;
      void task()
        .catch((error: unknown) => {
          // Preparation is optional; opening the feature can retry the module load.
          console.warn('Unable to prepare an optional panel:', error);
        })
        .finally(() => {
          running = false;
          schedule();
        });
    };

    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(run);
      cancelScheduled = () => window.cancelIdleCallback(id);
    } else {
      // Older browsers get a short grace period after load / the previous import.
      const id = window.setTimeout(run, 1500);
      cancelScheduled = () => window.clearTimeout(id);
    }
  };

  window.addEventListener('load', schedule);
  window.addEventListener('online', schedule);
  window.addEventListener('offline', schedule);
  document.addEventListener('visibilitychange', schedule);
  connection?.addEventListener('change', schedule);
  schedule();

  return () => {
    disposed = true;
    cancelScheduled?.();
    window.removeEventListener('load', schedule);
    window.removeEventListener('online', schedule);
    window.removeEventListener('offline', schedule);
    document.removeEventListener('visibilitychange', schedule);
    connection?.removeEventListener('change', schedule);
  };
}
