import type { ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';

import type { ActiveEditRuntime } from '@/lib/edit/activeEditRuntime';
import { getActionsStorageKey, readActionHistory } from '@/lib/edit/diffUtils';
import { EditModeContext } from '@/context/EditModeContext';
import { achievements, characters, items } from '@/data/static';
import { clearTestEditRuntime, installTestEditRuntime } from '@/testUtils/editRuntime';

import { useEditableDomain, useEditableEntity } from './useEditableGameData';

function createWrapper(runtimeStatus: 'loading' | 'ready', isEditModeRequested = true) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <EditModeContext
        value={{
          isEditMode: runtimeStatus === 'ready',
          isEditModeRequested,
          runtimeStatus,
          isLoading: runtimeStatus !== 'ready',
          isPreviewMode: false,
          setIsPreviewMode: jest.fn(),
        }}
      >
        {children}
      </EditModeContext>
    );
  };
}

describe('editable game-data reads', () => {
  let runtime: ActiveEditRuntime;

  beforeEach(() => {
    window.localStorage.clear();
    runtime = installTestEditRuntime();
  });

  afterEach(() => {
    act(() => clearTestEditRuntime(runtime));
  });

  it('keeps the published fallback until the runtime is ready', () => {
    const itemId = Object.keys(items)[0]!;
    runtime.stores.items[itemId]!.name = 'draft item';

    const { result } = renderHook(
      () => useEditableEntity({ entityType: 'items', entityId: itemId }, items[itemId]!),
      { wrapper: createWrapper('loading') }
    );

    expect(result.current[0]).toBe(items[itemId]);
  });

  it('does not project an already-projected fallback before the runtime is ready', () => {
    const fallback: readonly string[] = ['published'];
    const projectDraft = jest.fn((): readonly string[] => ['draft']);

    const { result } = renderHook(() => useEditableDomain('characters', fallback, projectDraft), {
      wrapper: createWrapper('loading'),
    });

    expect(result.current[0]).toBe(fallback);
    expect(projectDraft).not.toHaveBeenCalled();
  });

  it('reads and subscribes to a ready draft domain', async () => {
    const itemId = Object.keys(items)[0]!;
    const { result } = renderHook(() => useEditableDomain('items', items), {
      wrapper: createWrapper('ready'),
    });

    await act(async () => {
      runtime.stores.items[itemId]!.name = 'draft item';
      await Promise.resolve();
    });

    expect(result.current[0][itemId]!.name).toBe('draft item');
  });

  it('resolves faction-scoped and draft-only entities', () => {
    const achievementId = Object.keys(achievements.cat)[0]!;
    const characterId = 'draft-only-character';
    runtime.stores.characters[characterId] = {
      ...runtime.stores.characters[Object.keys(characters)[0]!]!,
      id: characterId,
    };

    const achievement = renderHook(
      () =>
        useEditableEntity(
          { entityType: 'achievements', factionId: 'cat', entityId: achievementId },
          achievements.cat[achievementId]!
        ),
      { wrapper: createWrapper('ready') }
    );
    const character = renderHook(
      () => useEditableEntity({ entityType: 'characters', entityId: characterId }, null),
      { wrapper: createWrapper('ready') }
    );

    expect(achievement.result.current[0]?.name).toBe(achievementId);
    expect(character.result.current[0]?.id).toBe(characterId);
  });

  it('does not rerender an entity reader for a sibling update', async () => {
    const [itemId, siblingId] = Object.keys(items);
    let renders = 0;
    const { result } = renderHook(
      () => {
        renders += 1;
        return useEditableEntity({ entityType: 'items', entityId: itemId! }, items[itemId!]!);
      },
      { wrapper: createWrapper('ready') }
    );

    await act(async () => {
      runtime.stores.items[siblingId!]!.name = 'changed sibling';
      await Promise.resolve();
    });

    expect(result.current[0]!.name).toBe(items[itemId!]!.name);
    expect(renders).toBe(1);
  });

  it('updates an entity synchronously without exposing its mutable proxy', async () => {
    const itemId = Object.keys(items)[0]!;
    const { result } = renderHook(
      () => useEditableEntity({ entityType: 'items', entityId: itemId }, items[itemId]!),
      { wrapper: createWrapper('ready') }
    );
    const [snapshot, updateItem] = result.current;

    await act(async () => {
      updateItem((item) => {
        item.name = 'updated item';
      });
      await Promise.resolve();
    });

    expect(runtime.stores.items[itemId]!.name).toBe('updated item');
    expect(snapshot).not.toBe(runtime.stores.items[itemId]);
  });

  it('updates faction-scoped entities through their full reference', async () => {
    const achievementId = Object.keys(achievements.cat)[0]!;
    const { result } = renderHook(
      () =>
        useEditableEntity(
          { entityType: 'achievements', factionId: 'cat', entityId: achievementId },
          achievements.cat[achievementId]!
        ),
      { wrapper: createWrapper('ready') }
    );

    await act(async () => {
      result.current[1]((achievement) => {
        achievement.description = 'updated description';
      });
      await Promise.resolve();
    });

    expect(runtime.stores.achievements.cat[achievementId]!.description).toBe('updated description');
  });

  it('records ordinary entity and faction mutations with their existing semantics', async () => {
    runtime.registry.setupSubscribers();
    const itemId = Object.keys(items)[0]!;
    const achievementId = Object.keys(achievements.cat)[0]!;
    const item = renderHook(
      () => useEditableEntity({ entityType: 'items', entityId: itemId }, items[itemId]!),
      { wrapper: createWrapper('ready') }
    );
    const achievement = renderHook(
      () =>
        useEditableEntity(
          { entityType: 'achievements', factionId: 'cat', entityId: achievementId },
          achievements.cat[achievementId]!
        ),
      { wrapper: createWrapper('ready') }
    );

    for (const mutate of [
      (draft: (typeof runtime.stores.items)[string]) => {
        draft.aliases = ['first'];
      },
      (draft: (typeof runtime.stores.items)[string]) => {
        draft.aliases!.push('second');
      },
      (draft: (typeof runtime.stores.items)[string]) => {
        draft.aliases!.splice(0, 1);
      },
      (draft: (typeof runtime.stores.items)[string]) => {
        draft.damage = 987_654;
      },
      (draft: (typeof runtime.stores.items)[string]) => {
        delete draft.damage;
      },
    ]) {
      await act(async () => {
        item.result.current[1](mutate);
        await Promise.resolve();
      });
    }
    await act(async () => {
      achievement.result.current[1]((draft) => {
        draft.score += 1;
      });
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(readActionHistory(getActionsStorageKey('items')).length).toBeGreaterThanOrEqual(5);
      expect(readActionHistory(getActionsStorageKey('achievements')).length).toBeGreaterThan(0);
    });

    const itemActions = readActionHistory(getActionsStorageKey('items')).flatMap((entry) =>
      Array.isArray(entry) ? entry : [entry]
    );
    const achievementActions = readActionHistory(getActionsStorageKey('achievements')).flatMap(
      (entry) => (Array.isArray(entry) ? entry : [entry])
    );

    expect(itemActions.map(({ path }) => path)).toEqual(
      expect.arrayContaining([
        `${itemId}.aliases`,
        `${itemId}.aliases.1`,
        `${itemId}.aliases.0`,
        `${itemId}.damage`,
      ])
    );
    expect(itemActions.map(({ op }) => op)).toEqual(expect.arrayContaining(['set', 'delete']));
    expect(achievementActions).toEqual([
      expect.objectContaining({ path: `cat.${achievementId}.score`, op: 'set' }),
    ]);
  });
});
