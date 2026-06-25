import { characters } from '@/data';

import {
  addCharacterRelationItem,
  createCharacterRelationItem,
  getCharacterRelationDescriptionPath,
  getEditableCharacterRelations,
  removeCharacterRelationItem,
  removeCharacterRelationItemFromKinds,
  toggleCharacterRelationMinor,
  updateCharacterRelationDescription,
  upsertCharacterRelationItem,
} from './characterRelationOverlay';

const cloneCharacters = () => structuredClone(characters);

const restoreCharacters = (snapshot: Record<string, unknown>) => {
  Object.keys(characters).forEach((key) => {
    delete (characters as Record<string, unknown>)[key];
  });

  Object.entries(snapshot).forEach(([key, value]) => {
    (characters as Record<string, unknown>)[key] = structuredClone(value);
  });
};

describe('characterRelationOverlay', () => {
  let snapshot: Record<string, unknown>;

  beforeEach(() => {
    snapshot = cloneCharacters() as Record<string, unknown>;
  });

  afterEach(() => {
    restoreCharacters(snapshot);
  });

  it('should expose relation description paths relative to the current character overlay', () => {
    expect(getCharacterRelationDescriptionPath('counteredBy', 2)).toBe('counteredBy.2');
  });

  it('should prefer page-local overlay items over projected read-model items for editable views', () => {
    const editableRelations = getEditableCharacterRelations('莱特宁', {
      counteredBy: [
        {
          id: '__overlay_only__',
          description: 'overlay relation',
          isMinor: true,
        },
      ],
    });

    expect(editableRelations.counteredBy).toEqual([
      {
        id: '__overlay_only__',
        description: 'overlay relation',
        isMinor: true,
      },
    ]);
  });

  it('should write relation overlay updates under characters.<id>.<relationKind>', () => {
    addCharacterRelationItem('莱特宁', 'counteredBy', createCharacterRelationItem('__added__'));
    updateCharacterRelationDescription('莱特宁', 'counteredBy', '__added__', '  overlay note  ');
    toggleCharacterRelationMinor('莱特宁', 'counteredBy', '__added__');

    expect(
      (
        characters['莱特宁'] as unknown as {
          counteredBy?: Array<{ id: string; description: string; isMinor: boolean }>;
        }
      ).counteredBy
    ).toEqual(
      expect.arrayContaining([
        {
          id: '__added__',
          description: 'overlay note',
          isMinor: true,
        },
      ])
    );
  });

  it('should remove relation overlay items without affecting other entries', () => {
    (
      characters['莱特宁'] as unknown as {
        counteredBy?: Array<{ id: string; description: string; isMinor: boolean }>;
      }
    ).counteredBy = [
      {
        id: '__keep__',
        description: 'keep me',
        isMinor: false,
      },
      {
        id: '__remove__',
        description: 'remove me',
        isMinor: true,
      },
    ];

    removeCharacterRelationItem('莱特宁', 'counteredBy', '__remove__');

    expect(
      (
        characters['莱特宁'] as unknown as {
          counteredBy?: Array<{ id: string; description: string; isMinor: boolean }>;
        }
      ).counteredBy
    ).toEqual([
      {
        id: '__keep__',
        description: 'keep me',
        isMinor: false,
      },
    ]);
  });

  it('should upsert relation items without duplicating unchanged entries', () => {
    upsertCharacterRelationItem('莱特宁', 'counteredBy', {
      id: '__upsert__',
      description: 'first',
      isMinor: false,
    });
    upsertCharacterRelationItem('莱特宁', 'counteredBy', {
      id: '__upsert__',
      description: 'updated',
      isMinor: true,
    });

    const beforeNoop = (
      characters['莱特宁'] as unknown as {
        counteredBy?: Array<{ id: string; description: string; isMinor: boolean }>;
      }
    ).counteredBy;

    upsertCharacterRelationItem('莱特宁', 'counteredBy', {
      id: '__upsert__',
      description: 'updated',
      isMinor: true,
    });

    const afterNoop = (
      characters['莱特宁'] as unknown as {
        counteredBy?: Array<{ id: string; description: string; isMinor: boolean }>;
      }
    ).counteredBy;

    expect(afterNoop).toBe(beforeNoop);
    expect(afterNoop?.filter((item) => item.id === '__upsert__')).toEqual([
      {
        id: '__upsert__',
        description: 'updated',
        isMinor: true,
      },
    ]);
  });

  it('should remove an item from multiple relation kinds while preserving projected items', () => {
    const projected = getEditableCharacterRelations('莱特宁').counteredBy;
    expect(projected.length).toBeGreaterThan(0);

    const removeId = projected[0]!.id;
    removeCharacterRelationItemFromKinds('莱特宁', ['counteredBy', 'counters'], removeId);

    const writtenCounteredBy = (
      characters['莱特宁'] as unknown as {
        counteredBy?: Array<{ id: string; description: string; isMinor: boolean }>;
      }
    ).counteredBy;
    const writtenCounters = (
      characters['莱特宁'] as unknown as {
        counters?: Array<{ id: string; description: string; isMinor: boolean }>;
      }
    ).counters;

    expect(writtenCounteredBy).toEqual(projected.filter((item) => item.id !== removeId));
    expect(writtenCounteredBy).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: removeId })])
    );
    expect(writtenCounters).toBeUndefined();
  });
});
