import { act, fireEvent, render, screen } from '@testing-library/react';

import Tooltip from './Tooltip';

describe('Tooltip touch interactions', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it.each(['touchMove', 'touchEnd', 'touchCancel'] as const)(
    'cancels a long press on %s',
    (event) => {
      render(<Tooltip content='Details'>Trigger</Tooltip>);
      const trigger = screen.getByText('Trigger');
      fireEvent.touchStart(trigger);
      fireEvent[event](trigger);
      act(() => jest.advanceTimersByTime(600));
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    }
  );

  it('restarts the long press and clears it on unmount', () => {
    const { unmount } = render(<Tooltip content='Details'>Trigger</Tooltip>);
    const trigger = screen.getByText('Trigger');
    fireEvent.touchStart(trigger);
    act(() => jest.advanceTimersByTime(300));
    fireEvent.touchStart(trigger);
    act(() => jest.advanceTimersByTime(300));
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    unmount();
    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });

  it('opens after an uninterrupted long press', () => {
    render(<Tooltip content='Details'>Trigger</Tooltip>);
    fireEvent.touchStart(screen.getByText('Trigger'));
    act(() => jest.advanceTimersByTime(500));
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('supports button activation, Escape dismissal, and scoped content styling', () => {
    const onClick = jest.fn();
    render(
      <Tooltip
        asChild
        clickToToggle
        content='Details'
        contentClassName='[@media(pointer:coarse)]:pointer-events-none'
      >
        <button onClick={onClick}>Trigger</button>
      </Tooltip>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Trigger' }));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    expect(screen.getByRole('tooltip')).toHaveClass('[@media(pointer:coarse)]:pointer-events-none');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});

const originalResizeObserver = global.ResizeObserver;
beforeAll(() => {
  global.ResizeObserver = jest.fn(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  })) as unknown as typeof ResizeObserver;
});
afterAll(() => {
  global.ResizeObserver = originalResizeObserver;
});
