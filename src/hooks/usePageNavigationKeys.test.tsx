import { renderHook } from '@testing-library/react';

import { usePageNavigationKeys } from './usePageNavigationKeys';

it('handles arrow and Vim keys, keeps endpoint behavior, and releases the listener', () => {
  const previous = jest.fn();
  const next = jest.fn();
  const { rerender, unmount } = renderHook(
    ({ disabled, hasPrevious }) =>
      usePageNavigationKeys(hasPrevious ? previous : undefined, next, disabled),
    { initialProps: { disabled: false, hasPrevious: true } }
  );
  const press = (key: string, ctrlKey = false) => {
    const event = new KeyboardEvent('keydown', { key, ctrlKey, cancelable: true });
    window.dispatchEvent(event);
    return event.defaultPrevented;
  };

  for (const key of ['ArrowLeft', 'h', 'ArrowRight', 'l']) expect(press(key)).toBe(true);
  expect(previous).toHaveBeenCalledTimes(2);
  expect(next).toHaveBeenCalledTimes(2);
  expect(press('ArrowRight', true)).toBe(false);
  expect(press('Enter')).toBe(false);
  expect(next).toHaveBeenCalledTimes(2);

  rerender({ disabled: false, hasPrevious: false });
  expect(press('ArrowLeft')).toBe(true);
  expect(previous).toHaveBeenCalledTimes(2);

  rerender({ disabled: true, hasPrevious: true });
  expect(press('ArrowRight')).toBe(false);
  expect(next).toHaveBeenCalledTimes(2);

  rerender({ disabled: false, hasPrevious: true });
  expect(press('ArrowRight')).toBe(true);
  expect(next).toHaveBeenCalledTimes(3);
  unmount();
  expect(press('ArrowRight')).toBe(false);
  expect(next).toHaveBeenCalledTimes(3);
});
