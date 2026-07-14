import { fireEvent, render, screen } from '@testing-library/react';

import DetailViewToggle from './DetailViewToggle';

const mockToggleDetailedView = jest.fn();
const mockDismissToggleHint = jest.fn();
const mockResizeObserver = jest.fn(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));
let mockIsDetailedView = false;
let mockShowToggleHint = true;

jest.mock('@/context/AppContext', () => ({
  useAppContext: () => ({
    isDetailedView: mockIsDetailedView,
    toggleDetailedView: mockToggleDetailedView,
  }),
}));

jest.mock('@/hooks/useFeatureDiscovery', () => ({
  useFeatureDiscovery: () => ({
    shouldPrompt: mockShowToggleHint,
    dismiss: mockDismissToggleHint,
  }),
}));

describe('DetailViewToggle', () => {
  beforeAll(() => {
    global.ResizeObserver = mockResizeObserver as unknown as typeof ResizeObserver;
  });

  beforeEach(() => {
    mockIsDetailedView = false;
    mockShowToggleHint = true;
    mockToggleDetailedView.mockReset();
    mockDismissToggleHint.mockReset();
  });

  it('should toggle detailed view and dismiss the discovery hint', () => {
    render(<DetailViewToggle />);

    const toggle = screen.getByRole('button', { name: '切换至详细描述' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(toggle);

    expect(mockToggleDetailedView).toHaveBeenCalledTimes(1);
    expect(mockDismissToggleHint).toHaveBeenCalledTimes(1);
  });

  it('should expose the simple-view action while detailed view is active', () => {
    mockIsDetailedView = true;
    mockShowToggleHint = false;

    render(<DetailViewToggle />);

    const toggle = screen.getByRole('button', { name: '切换至简明描述' });
    expect(toggle).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(toggle);

    expect(mockToggleDetailedView).toHaveBeenCalledTimes(1);
    expect(mockDismissToggleHint).not.toHaveBeenCalled();
  });
});
