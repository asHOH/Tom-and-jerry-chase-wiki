import { applyActionEntry } from '@/lib/edit/diffUtils';
import { generateTypescriptCodeFromCharacter } from '@/lib/editUtils';
import type { CharacterWithFaction } from '@/lib/types';
import type { Skill } from '@/data/types';

import {
  addSkillPart,
  convertSkillToParts,
  getSkillUsageSections,
  removeSkillPart,
} from './skillUsage';

function createLegacySkill(overrides: Partial<Skill> = {}): Skill {
  return {
    id: '测试角色-active',
    name: '测试技能',
    type: 'active',
    skillLevels: [{ level: 1, description: '' }],
    ...overrides,
  } as Skill;
}

describe('skill usage parts', () => {
  it('keeps the original unlabelled layout for legacy skills', () => {
    const sections = getSkillUsageSections(
      createLegacySkill({ canMoveWhileUsing: true, canUseInAir: false })
    );

    expect(sections).toEqual([{ properties: ['移动释放'] }]);
  });

  it('keeps the original unlabelled layout for one-item part arrays', () => {
    const sections = getSkillUsageSections(
      createLegacySkill({ parts: [{ canMoveWhileUsing: true }] } as Partial<Skill>)
    );

    expect(sections).toEqual([{ properties: ['移动释放'] }]);
  });

  it('labels multiple parts and omits explicit false boolean properties', () => {
    const sections = getSkillUsageSections(
      createLegacySkill({
        parts: [
          { canMoveWhileUsing: true, forecast: 0 },
          { canMoveWhileUsing: false, canUseInAir: true },
        ],
      } as Partial<Skill>)
    );

    expect(sections).toEqual([
      { label: '第1段', properties: ['移动释放', '无前摇'] },
      { label: '第2段', properties: ['空中释放'] },
    ]);
  });

  it('converts legacy usage metadata into a first part and creates a blank second part', () => {
    const skill = createLegacySkill({
      canMoveWhileUsing: true,
      cancelableSkill: ['跳跃键'],
      forecast: 0.5,
    });

    convertSkillToParts(skill);

    expect(skill).not.toHaveProperty('canMoveWhileUsing');
    expect(skill).not.toHaveProperty('cancelableSkill');
    expect(skill).not.toHaveProperty('forecast');
    expect(skill).toMatchObject({
      parts: [
        {
          canMoveWhileUsing: true,
          cancelableSkill: ['跳跃键'],
          forecast: 0.5,
        },
        {},
      ],
    });
  });

  it('adds and removes parts while retaining one remaining part', () => {
    const skill = createLegacySkill({ parts: [{ canUseInAir: true }] } as Partial<Skill>);

    addSkillPart(skill);
    expect('parts' in skill && skill.parts).toHaveLength(2);

    removeSkillPart(skill, 0);
    expect('parts' in skill && skill.parts).toEqual([{}]);

    removeSkillPart(skill, 0);
    expect('parts' in skill && skill.parts).toEqual([{}]);
  });

  it('preserves parts in character export and supports nested action replay', () => {
    const skill = createLegacySkill({ parts: [{ canMoveWhileUsing: true }] } as Partial<Skill>);
    const character: CharacterWithFaction = {
      id: '测试角色',
      description: '',
      imageUrl: '/test.png',
      createDate: null,
      skills: [skill],
      knowledgeCardGroups: [],
    };

    const exported = generateTypescriptCodeFromCharacter(character);
    expect(exported).toContain('parts: [');
    expect(exported).toContain('canMoveWhileUsing: true');

    applyActionEntry(character as unknown as Record<string, unknown>, {
      op: 'set',
      path: 'skills.0.parts.0.canMoveWhileUsing',
      oldValue: true,
      newValue: false,
    });
    expect('parts' in character.skills[0]! && character.skills[0].parts[0]).toEqual({
      canMoveWhileUsing: false,
    });
  });
});
