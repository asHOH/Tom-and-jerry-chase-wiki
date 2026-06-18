import { characterRelationTraitGroups } from './characterRelationData';
import characterRelations, {
  buildCharacterRelationMap,
  characterRelationTraits,
} from './characterRelations';
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

  it('should keep the default character relation export aligned with relation traits', () => {
    const rebuiltRelations = buildCharacterRelationMap(characterRelationTraits);

    expect(characterRelations).toEqual(rebuiltRelations);
    expect(Object.keys(characterRelations)).toHaveLength(characterRelationTraits.length);
    expect(Object.values(characterRelations)).toEqual(characterRelationTraits);
    expect(characterRelationTraits.every((trait) => trait.relation)).toBe(true);
  });

  it('should compose character relation traits from focused split data groups', () => {
    expect(characterRelationTraits).toEqual(Object.values(characterRelationTraitGroups).flat());
    expect(
      characterRelationTraitGroups.characters.every(
        (trait) => trait.relation?.target.type === 'character'
      )
    ).toBe(true);
    expect(
      characterRelationTraitGroups.knowledgeCards.every(
        (trait) => trait.relation?.target.type === 'knowledgeCard'
      )
    ).toBe(true);
    expect(
      characterRelationTraitGroups.maps.every((trait) => trait.relation?.target.type === 'map')
    ).toBe(true);
    expect(
      characterRelationTraitGroups.modes.every((trait) => trait.relation?.target.type === 'mode')
    ).toBe(true);
    expect(
      characterRelationTraitGroups.specialSkills.every(
        (trait) => trait.relation?.target.type === 'specialSkill'
      )
    ).toBe(true);
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

  it('should detect semantic duplicates across inverse counters and counteredBy edges', () => {
    const duplicateTraits = [
      createCharacterRelationTrait('counters', 'Alpha', 'Beta'),
      createCharacterRelationTrait('counteredBy', 'Beta', 'Alpha'),
    ];

    expect(findCharacterRelationValidationErrors(duplicateTraits)).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          'Semantic duplicate character relation counters::character:Alpha:::character:Beta:'
        ),
      ])
    );
  });

  it('should detect semantic duplicates for symmetric reversed character relations', () => {
    const duplicateTraits = [
      createCharacterRelationTrait('counterEachOther', 'Alpha', 'Beta'),
      createCharacterRelationTrait('counterEachOther', 'Beta', 'Alpha'),
    ];

    expect(findCharacterRelationValidationErrors(duplicateTraits)).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          'Semantic duplicate character relation counterEachOther::character:Alpha:::character:Beta:'
        ),
      ])
    );
  });
});
