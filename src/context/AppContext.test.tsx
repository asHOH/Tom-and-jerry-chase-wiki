import { act, fireEvent, render, screen } from '@testing-library/react';
import { hydrateRoot, type Root } from 'react-dom/client';

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

  it('hydrates a later consumer against the server snapshot after detailed view is enabled', async () => {
    const mountedConsumer = render(<MountingConsumerProbe />);
    const toggle = screen.getByRole('button');

    if (toggle.textContent === 'simple') {
      fireEvent.click(toggle);
    }

    expect(toggle).toHaveTextContent('detailed');
    mountedConsumer.unmount();

    const container = document.createElement('div');
    container.innerHTML = '<span data-testid="app-context-probe">simple</span>';
    document.body.append(container);

    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    let root: Root | undefined;

    try {
      await act(async () => {
        root = hydrateRoot(container, <AppContextProbe />);
      });

      expect(container).toHaveTextContent('detailed');
      expect(
        consoleError.mock.calls.some((args) =>
          args.some((arg) => String(arg).includes('Hydration failed'))
        )
      ).toBe(false);
    } finally {
      if (root) {
        await act(async () => root?.unmount());
      }
      consoleError.mockRestore();
      container.remove();
    }
  });
});
