import { characters } from '@/data';

import {
  addCharacterRelationItem,
  createCharacterRelationItem,
  getCharacterRelationDescriptionPath,
  getEditableCharacterRelations,
  removeCharacterRelationItem,
  toggleCharacterRelationMinor,
  updateCharacterRelationDescription,
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
});
