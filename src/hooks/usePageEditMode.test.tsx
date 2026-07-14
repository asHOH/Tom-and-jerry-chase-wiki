import { useState } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { getActionsStorageKey, readActionHistory } from '@/lib/edit/diffUtils';
import { EditModeContext } from '@/context/EditModeContext';
import { characters } from '@/data';

import { usePageEditMode } from './usePageEditMode';

const mockShowToast = jest.fn();

const TEST_CHARACTER_ID = '__page_edit_mode_character__';
const marySpecialSkillsOriginal = [
  { name: '魔术漂浮', description: '通用特技。' },
  { name: '干扰投掷', description: '提高干扰能力和技能命中率。' },
];
const marySpecialSkillsFinal = [{ name: '魔术漂浮', description: '通用特技。' }];

function PageEditModeProbe() {
  const [refreshCount, setRefreshCount] = useState(0);
  const { isDirty, discardChanges, publishChanges, getActionCount } = usePageEditMode({
    entityType: 'characters',
    entityId: TEST_CHARACTER_ID,
    showToast: mockShowToast,
  });
  void refreshCount;

  return (
    <div>
      <div data-testid='page-dirty'>{String(isDirty)}</div>
      <div data-testid='page-action-count'>{getActionCount()}</div>
      <button type='button' onClick={() => setRefreshCount((count) => count + 1)}>
        refresh
      </button>
      <button type='button' onClick={() => discardChanges()}>
        discard
      </button>
      <button type='button' onClick={() => void publishChanges('hook publish')}>
        publish
      </button>
    </div>
  );
}

function renderInEditMode() {
  render(
    <EditModeContext.Provider
      value={{
        isEditMode: true,
        isLoading: false,
        isPreviewMode: false,
        setIsPreviewMode: () => {},
      }}
    >
      <PageEditModeProbe />
    </EditModeContext.Provider>
  );
}

describe('usePageEditMode', () => {
  let characterSnapshot: Record<string, unknown>;

  beforeEach(() => {
    characterSnapshot = structuredClone(characters) as Record<string, unknown>;
    mockShowToast.mockClear();
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

  it('should discard only the current entity draft and preserve remaining drafts', async () => {
    renderInEditMode();

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
  });

  it('should count repeated same-path edits as one publishable change', async () => {
    renderInEditMode();

    window.localStorage.setItem(
      getActionsStorageKey('characters'),
      JSON.stringify([
        {
          op: 'set',
          path: `${TEST_CHARACTER_ID}.skills.0.description`,
          oldValue: 'canonical description',
          newValue: 'draft description',
        },
        {
          op: 'set',
          path: `${TEST_CHARACTER_ID}.skills.0.description`,
          oldValue: 'draft description',
          newValue: 'final description',
        },
      ])
    );

    fireEvent.click(screen.getByRole('button', { name: 'refresh' }));

    await waitFor(() => {
      expect(screen.getByTestId('page-action-count')).toHaveTextContent('1');
    });
  });

  it('should publish only the current entity draft and preserve remaining drafts', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn(),
    });
    global.fetch = fetchMock;
    renderInEditMode();

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
          message: 'hook publish',
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
  });

  it('should normalize structural array churn for action counts and publishing', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn(),
    });
    global.fetch = fetchMock;
    characters[TEST_CHARACTER_ID] = {
      id: TEST_CHARACTER_ID,
      name: '玛丽',
      specialSkills: marySpecialSkillsFinal,
    } as unknown as (typeof characters)[string];

    renderInEditMode();

    window.localStorage.setItem(
      getActionsStorageKey('characters'),
      JSON.stringify([
        {
          op: 'delete',
          path: `${TEST_CHARACTER_ID}.specialSkills.1`,
          oldValue: marySpecialSkillsOriginal[1],
        },
        {
          op: 'set',
          path: `${TEST_CHARACTER_ID}.specialSkills.length`,
          oldValue: 2,
          newValue: 1,
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
              path: `${TEST_CHARACTER_ID}.specialSkills`,
              oldValue: marySpecialSkillsOriginal,
              newValue: marySpecialSkillsFinal,
            },
          ],
          message: 'hook publish',
        }),
      });
    });
  });
});
