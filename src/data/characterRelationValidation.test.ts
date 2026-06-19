import { characterRelationTraitGroups } from './characterRelationData';
import characterRelations, {
  buildCharacterRelationMap,
  characterRelationTraits,
  characterRelationValidationContext,
} from './characterRelations';
import {
  findCharacterRelationValidationErrors,
  type CharacterRelationValidationContext,
} from './characterRelationValidation';
import type { FactionId, SingleItem, Trait, TraitRelationKind } from './types';

const testCharacterFactionById: Record<string, FactionId> = {
  CatA: 'cat',
  CatB: 'cat',
  MouseA: 'mouse',
  MouseB: 'mouse',
};

const testKnowledgeCardFactionById: Record<string, FactionId> = {
  CatCard: 'cat',
  MouseCard: 'mouse',
};

const testSpecialSkillFactionById: Record<string, FactionId> = {
  CatSkill: 'cat',
  MouseSkill: 'mouse',
};

const testValidationContext = {
  getCharacterFactionId: (characterId: string) => testCharacterFactionById[characterId],
  getKnowledgeCardFactionId: (cardId: string) => testKnowledgeCardFactionById[cardId],
  getSpecialSkillFactionId: ({ name, factionId }: SingleItem) =>
    factionId ?? testSpecialSkillFactionById[name],
} satisfies CharacterRelationValidationContext;

const createRelationTrait = (
  kind: TraitRelationKind,
  subject: SingleItem,
  target: SingleItem
): Trait => ({
  description: `${subject.name} ${String(kind)} ${target.name}`,
  group: [subject, target],
  relation: {
    kind,
    subject,
    target,
    isMinor: false,
  },
});

const createCharacterRelationTrait = (
  kind: TraitRelationKind,
  subjectName: string,
  targetName: string
): Trait =>
  createRelationTrait(
    kind,
    { name: subjectName, type: 'character' },
    { name: targetName, type: 'character' }
  );

describe('characterRelationValidation', () => {
  it('should keep shared character relation data free of duplicate and contradictory edges', () => {
    expect(
      findCharacterRelationValidationErrors(
        characterRelationTraits,
        characterRelationValidationContext
      )
    ).toEqual([]);
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
      characterRelationTraitGroups.characterCounters.every(
        (trait) =>
          trait.relation?.target.type === 'character' && trait.relation.kind !== 'collaborators'
      )
    ).toBe(true);
    expect(
      characterRelationTraitGroups.characterCollaborators.every(
        (trait) =>
          trait.relation?.target.type === 'character' && trait.relation.kind === 'collaborators'
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

  it('should reject collaborator relations outside mouse character pairs', () => {
    const invalidCollaboratorTraits = [
      createCharacterRelationTrait('collaborators', 'CatA', 'MouseA'),
    ];

    expect(
      findCharacterRelationValidationErrors(invalidCollaboratorTraits, testValidationContext)
    ).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          'Invalid collaborator relation collaborators::character:CatA:::character:MouseA:'
        ),
      ])
    );
  });

  it('should reject same-faction character, knowledge-card, and special-skill counter relations', () => {
    const invalidCounterTraits = [
      createCharacterRelationTrait('counters', 'MouseA', 'MouseB'),
      createCharacterRelationTrait('counterEachOther', 'CatA', 'CatB'),
      createRelationTrait(
        'countersKnowledgeCards',
        { name: 'MouseA', type: 'character' },
        { name: 'MouseCard', type: 'knowledgeCard' }
      ),
      createRelationTrait(
        'counteredBySpecialSkills',
        { name: 'MouseA', type: 'character' },
        { name: 'MouseSkill', type: 'specialSkill', factionId: 'mouse' }
      ),
    ];

    expect(
      findCharacterRelationValidationErrors(invalidCounterTraits, testValidationContext)
    ).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          'Invalid counter relation counters::character:MouseA:::character:MouseB:'
        ),
        expect.stringContaining(
          'Invalid counter relation counterEachOther::character:CatA:::character:CatB:'
        ),
        expect.stringContaining(
          'Invalid counter relation countersKnowledgeCards::character:MouseA:::knowledgeCard:MouseCard:'
        ),
        expect.stringContaining(
          'Invalid counter relation counteredBySpecialSkills::character:MouseA:::specialSkill:MouseSkill:mouse'
        ),
      ])
    );
  });

  it('should reject contradictory non-character relation cells', () => {
    const subject = { name: 'MouseA', type: 'character' } as const;
    const contradictoryCellTraits = [
      createRelationTrait('countersKnowledgeCards', subject, {
        name: 'CatCard',
        type: 'knowledgeCard',
      }),
      createRelationTrait('counteredByKnowledgeCards', subject, {
        name: 'CatCard',
        type: 'knowledgeCard',
      }),
      createRelationTrait('countersSpecialSkills', subject, {
        name: 'CatSkill',
        type: 'specialSkill',
        factionId: 'cat',
      }),
      createRelationTrait('counteredBySpecialSkills', subject, {
        name: 'CatSkill',
        type: 'specialSkill',
        factionId: 'cat',
      }),
      createRelationTrait('advantageMaps', subject, { name: '经典之家', type: 'map' }),
      createRelationTrait('disadvantageMaps', subject, { name: '经典之家', type: 'map' }),
      createRelationTrait('advantageModes', subject, { name: '经典模式', type: 'mode' }),
      createRelationTrait('disadvantageModes', subject, { name: '经典模式', type: 'mode' }),
    ];

    expect(
      findCharacterRelationValidationErrors(contradictoryCellTraits, testValidationContext)
    ).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          'Contradictory non-character relation cell knowledgeCardCounters::character:MouseA:::knowledgeCard:CatCard:'
        ),
        expect.stringContaining(
          'Contradictory non-character relation cell specialSkillCounters::character:MouseA:::specialSkill:CatSkill:cat'
        ),
        expect.stringContaining(
          'Contradictory non-character relation cell maps::character:MouseA:::map:经典之家:'
        ),
        expect.stringContaining(
          'Contradictory non-character relation cell modes::character:MouseA:::mode:经典模式:'
        ),
      ])
    );
  });

  it('should reject contradictory projected character relation cells', () => {
    const contradictoryCellTraits = [
      createCharacterRelationTrait('counters', 'MouseA', 'CatA'),
      createCharacterRelationTrait('counters', 'CatA', 'MouseA'),
      createCharacterRelationTrait('counterEachOther', 'MouseB', 'CatB'),
      createCharacterRelationTrait('counteredBy', 'CatB', 'MouseB'),
    ];

    expect(
      findCharacterRelationValidationErrors(contradictoryCellTraits, testValidationContext)
    ).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          'Contradictory projected character relation cell character:MouseA:::character:CatA:'
        ),
        expect.stringContaining(
          'Contradictory projected character relation cell character:MouseB:::character:CatB:'
        ),
      ])
    );
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
