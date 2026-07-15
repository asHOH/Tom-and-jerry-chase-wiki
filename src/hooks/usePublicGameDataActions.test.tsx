import { render, waitFor } from '@testing-library/react';

import { GameDataManager } from '@/lib/dataManager';
import type { PublicActionRow } from '@/lib/gameData/publicActionsTypes';
import { getCharacterRelationKey } from '@/data/characterRelations';
import type { CharacterRelationTrait } from '@/data/types';
import { getCharacterRelation } from '@/features/characters/utils/relationReadModel';
import { characterRelationsEdit, characters } from '@/data';

import { usePublicGameDataActions } from './usePublicGameDataActions';

jest.mock('@/env', () => ({
  env: {
    NEXT_PUBLIC_DISABLE_ARTICLES: '0',
    NEXT_PUBLIC_SUPABASE_URL: 'https://supabase.test',
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'test-publishable-key',
  },
}));

const relationTrait: CharacterRelationTrait = {
  description: 'public replay relation',
  relation: {
    kind: 'counteredBy',
    subject: { name: '莱特宁', type: 'character' },
    target: { name: '杰瑞', type: 'character' },
    isMinor: true,
  },
};
const relationKey = getCharacterRelationKey(relationTrait);

const createRelationAction = (id: string, createdAt: string): PublicActionRow => ({
  id,
  entity_type: 'characterRelations',
  created_at: createdAt,
  entry: {
    op: 'add',
    path: relationKey,
    oldValue: undefined,
    newValue: relationTrait,
  },
  status: 'approved',
  message: null,
  reviewed_at: null,
  created_by: null,
});

const HookHarness = ({ actions }: { actions: PublicActionRow[] }) => {
  usePublicGameDataActions({ initialPublicActions: actions });
  return null;
};

describe('usePublicGameDataActions', () => {
  let snapshot: Record<string, unknown>;

  beforeEach(() => {
    snapshot = structuredClone(characterRelationsEdit) as Record<string, unknown>;
    delete characterRelationsEdit[relationKey];
    window.localStorage.clear();
    jest.spyOn(GameDataManager, 'invalidate').mockImplementation(() => {});
  });

  afterEach(() => {
    Object.keys(characterRelationsEdit).forEach((key) => delete characterRelationsEdit[key]);
    Object.entries(snapshot).forEach(([key, value]) => {
      characterRelationsEdit[key] = structuredClone(value) as CharacterRelationTrait;
    });
    jest.restoreAllMocks();
    window.localStorage.clear();
  });

  it('should apply public characterRelations actions when edit mode is inactive', async () => {
    render(
      <HookHarness
        actions={[createRelationAction('public-relation-1', '2026-04-02T00:00:00.000Z')]}
      />
    );

    await waitFor(() => {
      expect(characterRelationsEdit[relationKey]).toEqual(relationTrait);
    });
  });

  it('should expose public characterRelations actions through the relation read model', async () => {
    render(
      <HookHarness
        actions={[createRelationAction('public-relation-projection', '2026-04-02T00:00:00.000Z')]}
      />
    );

    await waitFor(() => {
      expect(getCharacterRelation(characters, '莱特宁').counteredBy).toEqual(
        expect.arrayContaining([
          {
            id: '杰瑞',
            description: 'public replay relation',
            isMinor: true,
          },
        ])
      );
    });
  });

  it('should freeze out newer public relation actions after edit mode is enabled', async () => {
    window.localStorage.setItem('isEditMode', JSON.stringify(true));
    window.localStorage.setItem('editmode:enabledAt', String(Date.parse('2026-04-02T00:00:00Z')));

    render(
      <HookHarness
        actions={[createRelationAction('public-relation-2', '2026-04-02T00:10:00.000Z')]}
      />
    );

    await waitFor(() => {
      expect(characterRelationsEdit[relationKey]).toBeUndefined();
    });
  });
});
