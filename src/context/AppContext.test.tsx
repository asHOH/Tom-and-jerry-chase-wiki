import { fireEvent, render, screen } from '@testing-library/react';

import { useAppContext } from './AppContext';

const mockNavigate = jest.fn();

jest.mock('@/hooks/useNavigation', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

function AppContextProbe() {
  const { isDetailedView } = useAppContext();
  return <span data-testid='app-context-probe'>{isDetailedView ? 'detailed' : 'simple'}</span>;
}

function MountingConsumerProbe() {
  const { isDetailedView, toggleDetailedView } = useAppContext();

  return (
    <>
      <button type='button' onClick={toggleDetailedView}>
        {isDetailedView ? 'detailed' : 'simple'}
      </button>
      {isDetailedView && <AppContextProbe />}
    </>
  );
}

describe('useAppContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defers localStorage reads until after hydration', () => {
    render(<AppContextProbe />);

    expect(screen.getByText('simple')).toBeInTheDocument();
  });

  it('does not let a newly mounted consumer reset detailed view after toggling', async () => {
    render(<MountingConsumerProbe />);

    fireEvent.click(screen.getByRole('button', { name: 'simple' }));

    expect(await screen.findByRole('button', { name: 'detailed' })).toBeInTheDocument();
    expect(await screen.findByTestId('app-context-probe')).toHaveTextContent('detailed');
  });

  it('does not register a localStorage subscription for every consumer', () => {
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

    render(
      <>
        <AppContextProbe />
        <AppContextProbe />
      </>
    );

    expect(
      addEventListenerSpy.mock.calls.some(([eventName]) => String(eventName) === 'local-storage')
    ).toBe(false);
  });
});
