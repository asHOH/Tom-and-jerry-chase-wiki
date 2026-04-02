import { characterRelationTraits } from './characterRelations';
import { findCharacterRelationValidationErrors } from './characterRelationValidation';
import type { Trait, TraitRelationKind } from './types';

const createCharacterRelationTrait = (
  kind: TraitRelationKind,
  subjectName: string,
  targetName: string
): Trait => ({
  description: `${subjectName} ${String(kind)} ${targetName}`,
  group: [
    { name: subjectName, type: 'character' },
    { name: targetName, type: 'character' },
  ],
  relation: {
    kind,
    subject: { name: subjectName, type: 'character' },
    target: { name: targetName, type: 'character' },
    isMinor: false,
  },
});

describe('characterRelationValidation', () => {
  it('should keep shared character relation data free of duplicate and contradictory edges', () => {
    expect(findCharacterRelationValidationErrors(characterRelationTraits)).toEqual([]);
  });

  it('should detect duplicate relation edges', () => {
    const duplicateTraits = [
      createCharacterRelationTrait('counters', 'Alpha', 'Beta'),
      createCharacterRelationTrait('counters', 'Alpha', 'Beta'),
    ];

    expect(findCharacterRelationValidationErrors(duplicateTraits)).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          'Duplicate relation edge counters::character:Alpha:::character:Beta:'
        ),
      ])
    );
  });

  it('should detect contradictory character-character relation kinds on the same directed pair', () => {
    const contradictoryTraits = [
      createCharacterRelationTrait('counters', 'Alpha', 'Beta'),
      createCharacterRelationTrait('counterEachOther', 'Alpha', 'Beta'),
    ];

    expect(findCharacterRelationValidationErrors(contradictoryTraits)).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          'Contradictory character relation kinds for character:Alpha:::character:Beta:'
        ),
      ])
    );
  });
});
