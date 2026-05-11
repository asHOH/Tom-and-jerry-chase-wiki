import { renderHook } from '@testing-library/react';

import { EditModeContext } from '@/context/EditModeContext';

import { useSpecifyTypeKeyboardNavigation } from './useSpecifyTypeKeyboardNavigation';
import { useSpecifyTypeNavigation } from './useSpecifyTypeNavigation';

jest.mock('./useSpecifyTypeNavigation', () => ({
  useSpecifyTypeNavigation: jest.fn(),
}));

const mockUseSpecifyTypeNavigation = useSpecifyTypeNavigation as jest.MockedFunction<
  typeof useSpecifyTypeNavigation
>;

function renderNavigationHook(isEditMode: boolean = false) {
  return renderHook(() => useSpecifyTypeKeyboardNavigation('current', 'item'), {
    wrapper: ({ children }) => (
      <EditModeContext.Provider value={{ isEditMode, isLoading: false }}>
        {children}
      </EditModeContext.Provider>
    ),
  });
}

describe('useSpecifyTypeKeyboardNavigation', () => {
  const navigateToPrevious = jest.fn();
  const navigateToNext = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSpecifyTypeNavigation.mockReturnValue({
      previousTarget: { id: 'prev', target: 'prev' },
      nextTarget: { id: 'next', target: 'next' },
      navigateToPrevious,
      navigateToNext,
      currentIndex: 1,
      totals: 3,
    });
  });

  it('should not navigate when a page shortcut starts from an editable field', () => {
    renderNavigationHook();
    const input = document.createElement('input');
    document.body.appendChild(input);

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));

    expect(navigateToNext).not.toHaveBeenCalled();
    expect(navigateToPrevious).not.toHaveBeenCalled();

    input.remove();
  });

  it('should not navigate in edit mode', () => {
    renderNavigationHook(true);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));

    expect(navigateToNext).not.toHaveBeenCalled();
    expect(navigateToPrevious).not.toHaveBeenCalled();
  });
});
