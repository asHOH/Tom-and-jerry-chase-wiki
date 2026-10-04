import { useLayoutEffect } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';

import { preparedModule } from '@/lib/preparedModule';

import { usePreparedComponent } from './usePreparedComponent';

const Panel = () => null;

it('finishes opening when background preparation completes between render and effects', async () => {
  let cached: typeof Panel | undefined;
  const prepared = {
    get: () => cached,
    load: () => Promise.resolve({ default: Panel }),
  };
  const { result } = renderHook(() => {
    const state = usePreparedComponent(prepared, true);
    useLayoutEffect(() => {
      cached = Panel;
    }, []);
    return state;
  });
  await waitFor(() => expect(result.current.Component).toBe(Panel));
});

it('shares an in-flight background import with interactive loading', async () => {
  let finish!: (value: { default: typeof Panel }) => void;
  const importer = jest.fn(
    () =>
      new Promise<{ default: typeof Panel }>((resolve) => {
        finish = resolve;
      })
  );
  const prepared = preparedModule(importer);
  const background = prepared.load();
  const { result } = renderHook(() => usePreparedComponent(prepared, true));
  expect(importer).toHaveBeenCalledTimes(1);
  await act(async () => {
    finish({ default: Panel });
    await background;
  });
  expect(result.current.Component).toBe(Panel);
});

it('uses prepared code immediately, without importing when disabled', async () => {
  const importer = jest.fn().mockResolvedValue({ default: Panel });
  const prepared = preparedModule<typeof Panel>(importer);
  const { result, rerender } = renderHook(
    ({ enabled }) => usePreparedComponent(prepared, enabled),
    {
      initialProps: { enabled: false },
    }
  );
  expect(importer).not.toHaveBeenCalled();
  await prepared.load();
  rerender({ enabled: true });
  expect(result.current.Component).toBe(Panel);
  expect(importer).toHaveBeenCalledTimes(1);
});

it('retries after failed background and interactive loads', async () => {
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  const importer = jest
    .fn()
    .mockRejectedValueOnce(new Error('background failure'))
    .mockRejectedValueOnce(new Error('interactive failure'))
    .mockResolvedValue({ default: Panel });
  const prepared = preparedModule<typeof Panel>(importer);
  await expect(prepared.load()).rejects.toThrow('background failure');
  const { result } = renderHook(() => usePreparedComponent(prepared, true));
  await waitFor(() => expect(result.current.error).toBe(true));
  act(() => result.current.retry());
  await waitFor(() => expect(result.current.Component).toBe(Panel));
  expect(result.current.error).toBe(false);
  expect(importer).toHaveBeenCalledTimes(3);
});
