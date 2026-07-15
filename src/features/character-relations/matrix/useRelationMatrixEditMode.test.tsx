import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { getActionsStorageKey, readActionHistory, writeActionHistory } from '@/lib/edit/diffUtils';
import { getCharacterRelationKey } from '@/data/characterRelations';
import { characterRelationsEdit } from '@/data/store';
import type { CharacterRelationTrait } from '@/data/types';

import { useRelationMatrixEditMode } from './useRelationMatrixEditMode';

const mockInfo = jest.fn();
const mockSuccess = jest.fn();
const mockError = jest.fn();

jest.mock('@/context/ToastContext', () => ({
  useToast: () => ({ info: mockInfo, success: mockSuccess, error: mockError }),
}));

const storageKey = getActionsStorageKey('characterRelations');

function RelationEditModeProbe() {
  const editMode = useRelationMatrixEditMode();
  return (
    <div>
      <div data-testid='dirty'>{String(editMode.isDirty)}</div>
      <div data-testid='count'>{editMode.getActionCount()}</div>
      <div data-testid='draft-info'>{editMode.draftInfo?.actionCount ?? 0}</div>
      <div data-testid='draft-summary'>
        {editMode.draftsSummary.map((item) => item.itemLabel).join(',')}
      </div>
      <button type='button' onClick={() => editMode.discardChanges()}>
        discard
      </button>
      <button type='button' onClick={() => void editMode.publishChanges('关系更新')}>
        publish
      </button>
    </div>
  );
}

describe('useRelationMatrixEditMode', () => {
  let relationSnapshot: Record<string, unknown>;
  let relationKey: string;
  let originalTrait: CharacterRelationTrait;
  let updatedTrait: CharacterRelationTrait;

  beforeEach(() => {
    relationSnapshot = structuredClone(characterRelationsEdit) as Record<string, unknown>;
    const entry = Object.entries(characterRelationsEdit)[0]!;
    relationKey = entry[0];
    originalTrait = structuredClone(entry[1]);
    updatedTrait = { ...originalTrait, description: `${originalTrait.description}（已更新）` };
    window.localStorage.clear();
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    cleanup();
    Object.keys(characterRelationsEdit).forEach((key) => delete characterRelationsEdit[key]);
    Object.entries(relationSnapshot).forEach(([key, value]) => {
      characterRelationsEdit[key] = structuredClone(value) as CharacterRelationTrait;
    });
    window.localStorage.clear();
    jest.restoreAllMocks();
  });

  const relationAction = () => ({
    op: 'set' as const,
    path: relationKey,
    oldValue: originalTrait,
    newValue: updatedTrait,
  });

  it('counts canonical relation actions and labels both participants', () => {
    writeActionHistory(storageKey, [relationAction()]);
    characterRelationsEdit[relationKey] = updatedTrait;

    render(<RelationEditModeProbe />);

    expect(screen.getByTestId('count')).toHaveTextContent('1');
    expect(screen.getByTestId('dirty')).toHaveTextContent('true');
    expect(screen.getByTestId('draft-info')).toHaveTextContent('1');
    expect(screen.getByTestId('draft-summary')).toHaveTextContent(
      originalTrait.relation.subject.name
    );
    expect(screen.getByTestId('draft-summary')).toHaveTextContent(
      originalTrait.relation.target.name
    );
  });

  it('publishes characterRelations actions through the relation endpoint', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: jest.fn() });
    global.fetch = fetchMock;
    writeActionHistory(storageKey, [relationAction()]);
    characterRelationsEdit[relationKey] = updatedTrait;
    render(<RelationEditModeProbe />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'publish' }));
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/game-data-actions/publish-relations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: [relationAction()], message: '关系更新' }),
      });
      expect(readActionHistory(storageKey)).toEqual([]);
    });
  });

  it('discards canonical relation changes by replaying their inverse', async () => {
    writeActionHistory(storageKey, [relationAction()]);
    characterRelationsEdit[relationKey] = updatedTrait;
    render(<RelationEditModeProbe />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'discard' }));
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(characterRelationsEdit[relationKey]).toEqual(originalTrait);
      expect(readActionHistory(storageKey)).toEqual([]);
      expect(screen.getByTestId('dirty')).toHaveTextContent('false');
    });
  });

  it('updates dirty state when characterRelations changes', async () => {
    render(<RelationEditModeProbe />);
    expect(screen.getByTestId('dirty')).toHaveTextContent('false');
    writeActionHistory(storageKey, [relationAction()]);

    await act(async () => {
      characterRelationsEdit[relationKey] = updatedTrait;
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.getByTestId('dirty')).toHaveTextContent('true');
      expect(screen.getByTestId('draft-info')).toHaveTextContent('1');
    });
  });

  it('uses canonical relation keys generated from the trait', () => {
    expect(relationKey).toBe(getCharacterRelationKey(originalTrait));
  });
});
