import type { KnowledgeCardGroup, SuggestedSpecialSkillItem } from '@/data/types';

import { mergeCharacterRecommendations } from './recommendations';

describe('mergeCharacterRecommendations', () => {
  it('appends faction knowledge-card groups after character groups', () => {
    const characterGroup: KnowledgeCardGroup = {
      cards: ['S-角色卡组'],
      description: '角色卡组',
    };
    const generalGroup: KnowledgeCardGroup = {
      cards: ['S-通用卡组'],
      description: '通用卡组',
    };

    const result = mergeCharacterRecommendations(
      { knowledgeCardGroups: [characterGroup] },
      { generalKnowledgeCardGroups: [generalGroup], generalSpecialSkills: [] }
    );

    expect(result.knowledgeCardGroups).toEqual([characterGroup, generalGroup]);
  });

  it('keeps a character special-skill entry and custom description over a shared entry', () => {
    const generalSpecialSkill: SuggestedSpecialSkillItem = {
      name: '通用特技',
      description: '通用说明',
    };
    const characterSpecialSkill: SuggestedSpecialSkillItem = {
      name: '通用特技',
      description: '角色专属说明',
    };
    const characterOnlySpecialSkill: SuggestedSpecialSkillItem = {
      name: '角色特技',
      description: '角色特技说明',
    };
    const sharedOnlySpecialSkill: SuggestedSpecialSkillItem = {
      name: '共享特技',
      description: '共享特技说明',
    };

    const result = mergeCharacterRecommendations(
      {
        knowledgeCardGroups: [],
        specialSkills: [characterSpecialSkill, characterOnlySpecialSkill],
      },
      {
        generalKnowledgeCardGroups: [],
        generalSpecialSkills: [generalSpecialSkill, sharedOnlySpecialSkill],
      }
    );

    expect(result.specialSkills).toEqual([
      characterSpecialSkill,
      characterOnlySpecialSkill,
      sharedOnlySpecialSkill,
    ]);
  });

  it('adds shared special skills when a character has no special-skill override', () => {
    const sharedSpecialSkill: SuggestedSpecialSkillItem = {
      name: '共享特技',
      description: '共享特技说明',
    };

    const result = mergeCharacterRecommendations(
      { knowledgeCardGroups: [] },
      { generalKnowledgeCardGroups: [], generalSpecialSkills: [sharedSpecialSkill] }
    );

    expect(result.specialSkills).toEqual([sharedSpecialSkill]);
  });

  it('preserves an explicitly empty character special-skill list when there are no shared skills', () => {
    const result = mergeCharacterRecommendations(
      { knowledgeCardGroups: [], specialSkills: [] },
      { generalKnowledgeCardGroups: [], generalSpecialSkills: [] }
    );

    expect(result.specialSkills).toEqual([]);
  });
});
