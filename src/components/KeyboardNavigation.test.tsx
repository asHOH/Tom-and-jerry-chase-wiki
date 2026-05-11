import { render } from '@testing-library/react';

import { EditModeContext } from '@/context/EditModeContext';

import KeyboardNavigation from './KeyboardNavigation';

const back = jest.fn();
const push = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    back,
    push,
  }),
}));

describe('KeyboardNavigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not navigate back while edit mode is active', () => {
    render(
      <EditModeContext.Provider value={{ isEditMode: true, isLoading: false }}>
        <KeyboardNavigation />
      </EditModeContext.Provider>
    );

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace' }));

    expect(back).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });
});
