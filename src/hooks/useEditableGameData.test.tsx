import type { ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';

import type { ActiveEditRuntime } from '@/lib/edit/activeEditRuntime';
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

    expect(result.current).toBe(items[itemId]);
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

    expect(result.current[itemId]!.name).toBe('draft item');
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

    expect(achievement.result.current?.name).toBe(achievementId);
    expect(character.result.current?.id).toBe(characterId);
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

    expect(result.current!.name).toBe(items[itemId!]!.name);
    expect(renders).toBe(1);
  });
});
