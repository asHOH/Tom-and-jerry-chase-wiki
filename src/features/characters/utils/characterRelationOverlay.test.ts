import { characters as canonicalCharacters } from '@/data/static';
import type { CharacterRelation } from '@/data/types';
import { clearTestEditSession, installTestEditSession } from '@/testUtils/editRuntime';

import {
  addCharacterRelationItem,
  createCharacterRelationItem,
  getCharacterRelationDescriptionPath,
  getEditableCharacterRelations,
  removeCharacterRelationItem,
  removeCharacterRelationItemFromKinds,
  toggleCharacterRelationMinor,
  updateCharacterRelationDescription,
  updateCharacterRelationTags,
  upsertCharacterRelationItem,
} from './characterRelationOverlay';
import { getCharacterRelation } from './relationReadModel';

let characters = structuredClone(canonicalCharacters);

describe('characterRelationOverlay', () => {
  beforeEach(() => {
    characters = structuredClone(canonicalCharacters);
  });

  it('should expose relation description paths relative to the current character overlay', () => {
    expect(getCharacterRelationDescriptionPath('counteredBy', 2)).toBe('counteredBy.2');
  });

  it('should prefer page-local overlay items over projected read-model items for editable views', () => {
    const editableRelations = getEditableCharacterRelations(characters, '莱特宁', {
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
    addCharacterRelationItem(
      characters,
      '莱特宁',
      'counteredBy',
      createCharacterRelationItem('__added__')
    );
    updateCharacterRelationDescription(
      characters,
      '莱特宁',
      'counteredBy',
      '__added__',
      '  overlay note  '
    );
    toggleCharacterRelationMinor(characters, '莱特宁', 'counteredBy', '__added__');

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

    removeCharacterRelationItem(characters, '莱特宁', 'counteredBy', '__remove__');

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
    upsertCharacterRelationItem(characters, '莱特宁', 'counteredBy', {
      id: '__upsert__',
      description: 'first',
      isMinor: false,
    });
    upsertCharacterRelationItem(characters, '莱特宁', 'counteredBy', {
      id: '__upsert__',
      description: 'updated',
      isMinor: true,
    });

    const beforeNoop = (
      characters['莱特宁'] as unknown as {
        counteredBy?: Array<{ id: string; description: string; isMinor: boolean }>;
      }
    ).counteredBy;

    upsertCharacterRelationItem(characters, '莱特宁', 'counteredBy', {
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
    const projected = getEditableCharacterRelations(characters, '莱特宁').counteredBy;
    expect(projected.length).toBeGreaterThan(0);

    const removeId = projected[0]!.id;
    removeCharacterRelationItemFromKinds(
      characters,
      '莱特宁',
      ['counteredBy', 'counters'],
      removeId
    );

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

  describe('tag-derived suggestions', () => {
    beforeEach(() => {
      characters = {
        Cat: { ...canonicalCharacters['汤姆']!, id: 'Cat', counterTags: ['拉扯'] },
        Mouse: { ...canonicalCharacters['杰瑞']!, id: 'Mouse', counterTags: ['怕拉扯'] },
        OtherMouse: { ...canonicalCharacters['杰瑞']!, id: 'OtherMouse', counterTags: ['怕拉扯'] },
      };
    });

    const storedRelations = () => characters.Cat as Partial<CharacterRelation>;

    it('does not create an overlay when saving unchanged displayed fields or removing an absent item', () => {
      const displayed = getEditableCharacterRelations(characters, 'Cat').counters[0]!;
      expect(displayed.id).toBe('Mouse');
      updateCharacterRelationDescription(
        characters,
        'Cat',
        'counters',
        'Mouse',
        displayed.description!
      );
      expect(storedRelations().counters).toBeUndefined();
      updateCharacterRelationTags(characters, 'Cat', 'counters', 'Mouse', displayed.tags);
      expect(storedRelations().counters).toBeUndefined();
      upsertCharacterRelationItem(characters, 'Cat', 'counters', displayed);
      expect(storedRelations().counters).toBeUndefined();
      removeCharacterRelationItem(characters, 'Cat', 'counters', 'Missing');
      removeCharacterRelationItemFromKinds(characters, 'Cat', ['counters'], 'Mouse');
      expect(storedRelations().counters).toBeUndefined();
    });

    it('adds only the requested explicit relation without copying other suggestions', () => {
      addCharacterRelationItem(characters, 'Cat', 'counters', createCharacterRelationItem('Added'));
      expect(storedRelations().counters).toEqual([createCharacterRelationItem('Added')]);
      expect(getCharacterRelation(characters, 'Cat').counters.map((item) => item.id)).toEqual([
        'Added',
        'Mouse',
        'OtherMouse',
      ]);
      expect(
        getEditableCharacterRelations(characters, 'Cat').counters.map((item) => item.id)
      ).toEqual(['Added', 'Mouse', 'OtherMouse']);
    });

    it('promotes only the deliberately edited suggestion and keeps existing explicit items', () => {
      updateCharacterRelationDescription(characters, 'Cat', 'counters', 'Mouse', 'Verified note');
      expect(storedRelations().counters).toEqual([
        expect.objectContaining({ id: 'Mouse', description: 'Verified note' }),
      ]);
      upsertCharacterRelationItem(characters, 'Cat', 'counters', {
        id: 'OtherMouse',
        description: 'Another verified note',
        isMinor: true,
      });
      expect(storedRelations().counters?.map((item) => item.id)).toEqual(['Mouse', 'OtherMouse']);
      removeCharacterRelationItem(characters, 'Cat', 'counters', 'Mouse');
      expect(storedRelations().counters).toEqual([
        { id: 'OtherMouse', description: 'Another verified note', isMinor: true },
      ]);
    });

    it('preserves explicit metadata instead of copying derived tags during a description edit', () => {
      Object.assign(characters.Cat!, {
        counters: [{ id: 'Mouse', description: 'Explicit note', isMinor: true }],
      });
      const original = storedRelations().counters;
      const displayed = getCharacterRelation(characters, 'Cat').counters[0]!;
      expect(displayed.tags).toHaveLength(1);
      upsertCharacterRelationItem(characters, 'Cat', 'counters', displayed);
      expect(storedRelations().counters).toBe(original);
      updateCharacterRelationDescription(characters, 'Cat', 'counters', 'Mouse', 'Updated note');
      expect(storedRelations().counters).toEqual([
        { id: 'Mouse', description: 'Updated note', isMinor: true },
      ]);
    });

    it('keeps no-op saves out of drafts and restores only the intended edit through the session', async () => {
      window.localStorage.clear();
      const scope = { kind: 'character-relations' } as const;
      let session = installTestEditSession({ characters });
      try {
        session.updateDomain('characters', (draft) => {
          const displayed = getEditableCharacterRelations(draft, 'Cat').counters[0]!;
          updateCharacterRelationDescription(
            draft,
            'Cat',
            'counters',
            displayed.id,
            displayed.description!
          );
        });
        await Promise.resolve();
        expect(session.readDraft(scope).actionCount).toBe(0);

        session.updateDomain('characters', (draft) => {
          updateCharacterRelationDescription(draft, 'Cat', 'counters', 'Mouse', 'Verified note');
        });
        await Promise.resolve();
        const publishedEntries = session.readDraft(scope).publishEntries;
        expect(publishedEntries).toEqual([
          expect.objectContaining({
            path: 'Cat.counters',
            newValue: [expect.objectContaining({ id: 'Mouse', description: 'Verified note' })],
          }),
        ]);

        clearTestEditSession(session);
        session = installTestEditSession({ characters });
        expect(session.readDraft(scope).publishEntries).toEqual(publishedEntries);
        expect(session.discardDraft(scope)).toEqual({ status: 'discarded' });
        expect(session.readDraft(scope).actionCount).toBe(0);
        expect(getCharacterRelation(session.readDomain('characters'), 'Cat').counters).toHaveLength(
          2
        );
      } finally {
        clearTestEditSession(session);
        window.localStorage.clear();
      }
    });
  });
});
