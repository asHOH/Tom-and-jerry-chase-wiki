import { render, waitFor } from '@testing-library/react';

import { GameDataManager } from '@/lib/dataManager';
import { characters } from '@/data';

import { usePublicGameDataActions } from './usePublicGameDataActions';

jest.mock('@/env', () => ({
  env: {
    NEXT_PUBLIC_DISABLE_ARTICLES: '0',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
  },
}));

type PublicActionRow = {
  id: string;
  entity_type: string;
  entry: unknown;
  created_at: string;
};

const cloneCharacters = () => structuredClone(characters);

const restoreCharacters = (snapshot: Record<string, unknown>) => {
  Object.keys(characters).forEach((key) => {
    delete (characters as Record<string, unknown>)[key];
  });

  Object.entries(snapshot).forEach(([key, value]) => {
    (characters as Record<string, unknown>)[key] = structuredClone(value);
  });
};

const HookHarness = ({ actions }: { actions: PublicActionRow[] }) => {
  usePublicGameDataActions({ initialPublicActions: actions });
  return null;
};

describe('usePublicGameDataActions', () => {
  let snapshot: Record<string, unknown>;

  beforeEach(() => {
    snapshot = cloneCharacters() as Record<string, unknown>;
    window.localStorage.clear();
    jest.spyOn(GameDataManager, 'invalidate').mockImplementation(() => {});
  });

  afterEach(() => {
    restoreCharacters(snapshot);
    jest.restoreAllMocks();
    window.localStorage.clear();
  });

  it('should apply public character relation actions when edit mode is inactive', async () => {
    const actions: PublicActionRow[] = [
      {
        id: 'public-relation-1',
        entity_type: 'characters',
        created_at: '2026-04-02T00:00:00.000Z',
        entry: {
          op: 'set',
          path: '莱特宁.counteredBy',
          oldValue: undefined,
          newValue: [
            {
              id: '__public_overlay__',
              description: 'public replay relation',
              isMinor: false,
            },
          ],
        },
      },
    ];

    render(<HookHarness actions={actions} />);

    await waitFor(() => {
      expect(
        (
          characters['莱特宁'] as unknown as {
            counteredBy?: Array<{ id: string; description: string; isMinor: boolean }>;
          }
        ).counteredBy
      ).toEqual([
        {
          id: '__public_overlay__',
          description: 'public replay relation',
          isMinor: false,
        },
      ]);
    });
  });

  it('should freeze out newer public relation actions after edit mode is enabled', async () => {
    window.localStorage.setItem('isEditMode', JSON.stringify(true));
    window.localStorage.setItem('editmode:enabledAt', String(Date.parse('2026-04-02T00:00:00Z')));

    const actions: PublicActionRow[] = [
      {
        id: 'public-relation-2',
        entity_type: 'characters',
        created_at: '2026-04-02T00:10:00.000Z',
        entry: {
          op: 'set',
          path: '莱特宁.counteredBy',
          oldValue: undefined,
          newValue: [
            {
              id: '__should_not_apply__',
              description: 'new public replay relation',
              isMinor: false,
            },
          ],
        },
      },
    ];

    render(<HookHarness actions={actions} />);

    await waitFor(() => {
      expect(
        (
          characters['莱特宁'] as unknown as {
            counteredBy?: Array<{ id: string; description: string; isMinor: boolean }>;
          }
        ).counteredBy
      ).toBeUndefined();
    });
  });
});
