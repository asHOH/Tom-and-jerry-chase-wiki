import { render } from '@testing-library/react';
import { useLocalStorage } from 'usehooks-ts';

import { useAppContext } from './AppContext';

const mockNavigate = jest.fn();
const mockSetStoredDetailedView = jest.fn();

jest.mock('@/hooks/useNavigation', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

jest.mock('usehooks-ts', () => ({
  useLocalStorage: jest.fn(() => [false, mockSetStoredDetailedView]),
}));

const mockedUseLocalStorage = jest.mocked(useLocalStorage);

function AppContextProbe() {
  const { isDetailedView } = useAppContext();
  return <span>{isDetailedView ? 'detailed' : 'simple'}</span>;
}

describe('useAppContext', () => {
  it('defers localStorage reads until after hydration', () => {
    render(<AppContextProbe />);

    expect(mockedUseLocalStorage).toHaveBeenCalledWith('isDetailedView', false, {
      initializeWithValue: false,
    });
  });
});
