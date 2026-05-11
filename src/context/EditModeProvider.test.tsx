import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { getActionsStorageKey, readActionHistory } from '@/lib/edit/diffUtils';
import { usePageEditMode } from '@/hooks/usePageEditMode';
import { characters } from '@/data';

import { EditModeProvider, useEditMode } from './EditModeStateContext';

const mockSuccessWithAction = jest.fn();
const mockSuccess = jest.fn();
const mockError = jest.fn();
const mockShowToast = jest.fn();
const mockIsPushSubscribedLocally = jest.fn();
const mockSubscribeToPushNotifications = jest.fn();

jest.mock('@/context/ToastContext', () => ({
  useToast: () => ({
    successWithAction: mockSuccessWithAction,
    success: mockSuccess,
    error: mockError,
  }),
}));

jest.mock('@/lib/pushClient', () => ({
  isPushSubscribedLocally: () => mockIsPushSubscribedLocally(),
  subscribeToPushNotifications: () => mockSubscribeToPushNotifications(),
}));

jest.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: jest.fn(),
}));

const mockUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>;
const TEST_CHARACTER_ID = '__edit_mode_draft_replay_character__';

async function flushReactUpdates() {
  await act(async () => {
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

function EditModeProbe() {
  const { isEditMode, isLoading } = useEditMode();

  return (
    <div
      data-testid='edit-mode-probe'
      data-edit-mode={String(isEditMode)}
      data-loading={String(isLoading)}
    />
  );
}

function PageEditModeProbe() {
  const [refreshCount, setRefreshCount] = useState(0);
  const { isDirty, draftInfo, discardChanges, publishChanges, getActionCount } = usePageEditMode({
    entityType: 'characters',
    entityId: TEST_CHARACTER_ID,
    showToast: mockShowToast,
  });
  void refreshCount;

  return (
    <div>
      <div data-testid='page-dirty'>{String(isDirty)}</div>
      <div data-testid='page-action-count'>{getActionCount()}</div>
      <div data-testid='page-draft-count'>{draftInfo?.actionCount ?? 0}</div>
      <button type='button' onClick={() => setRefreshCount((count) => count + 1)}>
        refresh
      </button>
      <button type='button' onClick={() => discardChanges()}>
        discard
      </button>
      <button type='button' onClick={() => void publishChanges('phase 0 publish')}>
        publish
      </button>
    </div>
  );
}

const renderEditModeProvider = (children = <div />) => {
  render(<EditModeProvider>{children}</EditModeProvider>);
};

describe('EditModeProvider', () => {
  let characterSnapshot: Record<string, unknown>;

  beforeEach(() => {
    characterSnapshot = structuredClone(characters) as Record<string, unknown>;
    mockSuccessWithAction.mockClear();
    mockSuccess.mockClear();
    mockError.mockClear();
    mockShowToast.mockClear();
    mockIsPushSubscribedLocally.mockReturnValue(true);
    mockSubscribeToPushNotifications.mockResolvedValue(true);
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams('edit=1') as ReturnType<typeof useSearchParams>
    );
    window.localStorage.clear();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    cleanup();
    Object.keys(characters).forEach((key) => {
      delete (characters as Record<string, unknown>)[key];
    });
    Object.entries(characterSnapshot).forEach(([key, value]) => {
      (characters as Record<string, unknown>)[key] = value;
    });
    window.localStorage.clear();
    jest.restoreAllMocks();
  });

  it('should restore character drafts from editmode action history when entering edit mode', async () => {
    window.localStorage.setItem(
      getActionsStorageKey('characters'),
      JSON.stringify([
        {
          op: 'set',
          path: `${TEST_CHARACTER_ID}.description`,
          oldValue: undefined,
          newValue: 'restored draft description',
        },
      ])
    );

    renderEditModeProvider();

    await waitFor(() => {
      expect((characters as Record<string, { description?: string }>)[TEST_CHARACTER_ID]).toEqual({
        description: 'restored draft description',
      });
    });
  });

  it('should expose edit mode state and publish edit mode side effects when URL edit mode is enabled', async () => {
    const changedEvents: boolean[] = [];
    const handleEditModeChanged = (event: Event) => {
      changedEvents.push((event as CustomEvent<{ isEditMode: boolean }>).detail.isEditMode);
    };
    window.addEventListener('editmode:changed', handleEditModeChanged);

    try {
      renderEditModeProvider(<EditModeProbe />);

      await waitFor(() => {
        expect(screen.getByTestId('edit-mode-probe')).toHaveAttribute('data-edit-mode', 'true');
        expect(screen.getByTestId('edit-mode-probe')).toHaveAttribute('data-loading', 'false');
      });

      expect(window.localStorage.getItem('isEditMode')).toBe('true');
      expect(Number(window.localStorage.getItem('editmode:enabledAt'))).toBeGreaterThan(0);
      expect(changedEvents).toContain(true);
    } finally {
      window.removeEventListener('editmode:changed', handleEditModeChanged);
    }
  });

  it('should expose disabled edit mode state and publish edit mode side effects when URL edit mode is disabled', async () => {
    const changedEvents: boolean[] = [];
    const handleEditModeChanged = (event: Event) => {
      changedEvents.push((event as CustomEvent<{ isEditMode: boolean }>).detail.isEditMode);
    };
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams('') as ReturnType<typeof useSearchParams>
    );
    window.addEventListener('editmode:changed', handleEditModeChanged);

    try {
      renderEditModeProvider(<EditModeProbe />);

      await waitFor(() => {
        expect(screen.getByTestId('edit-mode-probe')).toHaveAttribute('data-edit-mode', 'false');
        expect(screen.getByTestId('edit-mode-probe')).toHaveAttribute('data-loading', 'false');
      });

      expect(window.localStorage.getItem('isEditMode')).toBe('false');
      expect(window.localStorage.getItem('editmode:enabledAt')).toBeNull();
      expect(changedEvents).toContain(false);
    } finally {
      window.removeEventListener('editmode:changed', handleEditModeChanged);
    }
  });

  it('should record Valtio character changes to editmode action history while edit mode is active', async () => {
    renderEditModeProvider(<EditModeProbe />);

    await waitFor(() => {
      expect(screen.getByTestId('edit-mode-probe')).toHaveAttribute('data-edit-mode', 'true');
    });

    act(() => {
      (characters as Record<string, { description: string }>)[TEST_CHARACTER_ID] = {
        description: 'recorded draft description',
      };
    });

    await waitFor(() => {
      expect(readActionHistory(getActionsStorageKey('characters'))).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            op: 'set',
            path: TEST_CHARACTER_ID,
            newValue: { description: 'recorded draft description' },
          }),
        ])
      );
    });
  });

  it('should discard only the current entity draft and leave other entity drafts in storage', async () => {
    renderEditModeProvider(<PageEditModeProbe />);
    await flushReactUpdates();

    window.localStorage.setItem(
      getActionsStorageKey('characters'),
      JSON.stringify([
        {
          op: 'set',
          path: `${TEST_CHARACTER_ID}.description`,
          oldValue: 'canonical description',
          newValue: 'draft description',
        },
        {
          op: 'set',
          path: '__other_character__.description',
          oldValue: 'other canonical description',
          newValue: 'other draft description',
        },
      ])
    );

    fireEvent.click(screen.getByRole('button', { name: 'refresh' }));

    await waitFor(() => {
      expect(screen.getByTestId('page-action-count')).toHaveTextContent('1');
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'discard' }));
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.getByTestId('page-dirty')).toHaveTextContent('false');
      expect(readActionHistory(getActionsStorageKey('characters'))).toEqual([
        expect.objectContaining({
          op: 'set',
          path: '__other_character__.description',
          newValue: 'other draft description',
        }),
      ]);
    });

    expect(mockShowToast).toHaveBeenCalled();
  });

  it('should publish only the current entity draft and leave remaining drafts in storage', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn(),
    });
    global.fetch = fetchMock;

    renderEditModeProvider(<PageEditModeProbe />);
    await flushReactUpdates();

    window.localStorage.setItem(
      getActionsStorageKey('characters'),
      JSON.stringify([
        {
          op: 'set',
          path: `${TEST_CHARACTER_ID}.description`,
          oldValue: 'canonical description',
          newValue: 'draft description',
        },
        {
          op: 'set',
          path: '__other_character__.description',
          oldValue: 'other canonical description',
          newValue: 'other draft description',
        },
      ])
    );

    fireEvent.click(screen.getByRole('button', { name: 'refresh' }));

    await waitFor(() => {
      expect(screen.getByTestId('page-action-count')).toHaveTextContent('1');
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'publish' }));
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/game-data-actions/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType: 'characters',
          entries: [
            {
              op: 'set',
              path: `${TEST_CHARACTER_ID}.description`,
              oldValue: 'canonical description',
              newValue: 'draft description',
            },
          ],
          message: 'phase 0 publish',
        }),
      });
      expect(readActionHistory(getActionsStorageKey('characters'))).toEqual([
        expect.objectContaining({
          op: 'set',
          path: '__other_character__.description',
          newValue: 'other draft description',
        }),
      ]);
    });

    expect(mockShowToast).toHaveBeenCalledWith('改动已提交，等待审核');
  });

  it('should warn when a draft action history is large', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    window.localStorage.setItem(
      getActionsStorageKey('characters'),
      JSON.stringify(
        Array.from({ length: 1001 }, (_, index) => ({
          op: 'set',
          path: `${TEST_CHARACTER_ID}.description`,
          oldValue: index === 0 ? undefined : `draft ${index - 1}`,
          newValue: `draft ${index}`,
        }))
      )
    );

    renderEditModeProvider();

    await waitFor(() => {
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Large edit mode draft history'),
        expect.objectContaining({
          entityType: 'characters',
          entries: 1001,
        })
      );
    });
  });
});
