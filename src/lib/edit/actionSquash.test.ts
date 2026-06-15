import { squashActions } from './actionSquash';
import type { Action, ActionHistoryEntry } from './diffUtils';

const setAction = (path: string, oldValue: unknown, newValue: unknown): Action => ({
  op: 'set',
  path,
  oldValue,
  newValue,
});

const deleteAction = (path: string, oldValue: unknown): Action => ({
  op: 'delete',
  path,
  oldValue,
  newValue: undefined,
});

describe('squashActions', () => {
  it('should only protect the parent subtree of nested structural edits', () => {
    const deleteSkill = deleteAction('Tom.skills.1', { name: 'old skill' });
    const oldSkillName = setAction('Tom.skills.0.name', 'Skill A', 'Skill B');
    const newSkillName = setAction('Tom.skills.0.name', 'Skill B', 'Skill C');
    const oldDescription = setAction('Tom.description', 'old description', 'middle description');
    const newDescription = setAction('Tom.description', 'middle description', 'new description');

    expect(
      squashActions([deleteSkill, oldSkillName, newSkillName, oldDescription, newDescription])
    ).toEqual([
      deleteSkill,
      oldSkillName,
      newSkillName,
      setAction('Tom.description', 'old description', 'new description'),
    ]);
  });

  it('should squash unrelated repeated sets when another root has structural edits', () => {
    const deleteTomSkill = deleteAction('Tom.skills.1', { name: 'old skill' });
    const oldJerryDescription = setAction('Jerry.description', 'old', 'middle');
    const newJerryDescription = setAction('Jerry.description', 'middle', 'new');

    expect(squashActions([deleteTomSkill, oldJerryDescription, newJerryDescription])).toEqual([
      deleteTomSkill,
      setAction('Jerry.description', 'old', 'new'),
    ]);
  });

  it('should preserve entry grouping for kept actions', () => {
    const structuralBatch: ActionHistoryEntry = [
      deleteAction('Tom.skills.1', { name: 'old skill' }),
      setAction('Tom.skills.0.name', 'Skill A', 'Skill B'),
    ];
    const oldDescription = setAction('Tom.description', 'old description', 'middle description');
    const newDescription = setAction('Tom.description', 'middle description', 'new description');

    expect(squashActions([structuralBatch, oldDescription, newDescription])).toEqual([
      structuralBatch,
      setAction('Tom.description', 'old description', 'new description'),
    ]);
  });

  it('should preserve the original old value when squashing repeated sets', () => {
    const firstPositioningTags = setAction(
      'Tuffy.mousePositioningTags',
      ['cheese'],
      ['cheese', 'rescue']
    );
    const latestPositioningTags = setAction(
      'Tuffy.mousePositioningTags',
      ['cheese', 'rescue'],
      ['cheese', 'rescue.']
    );

    expect(squashActions([firstPositioningTags, latestPositioningTags])).toEqual([
      setAction('Tuffy.mousePositioningTags', ['cheese'], ['cheese', 'rescue.']),
    ]);
  });

  it('should fold descendant sets into a newly set parent object', () => {
    const newKnowledgeCardGroup = setAction('剑客杰瑞.knowledgeCardGroups.4', undefined, {
      cards: [],
      description: '待补充',
    });
    const updatedDescription = setAction(
      '剑客杰瑞.knowledgeCardGroups.4.description',
      '待补充',
      '打苏蕊，逃窜可换应激反应，不屈可换绝地反击'
    );
    const updatedCards = setAction(
      '剑客杰瑞.knowledgeCardGroups.4.cards',
      [],
      ['S-缴械', 'S-舍己', 'C-不屈', 'C-救救我', 'A-逃窜']
    );

    expect(squashActions([newKnowledgeCardGroup, updatedDescription, updatedCards])).toEqual([
      setAction('剑客杰瑞.knowledgeCardGroups.4', undefined, {
        cards: ['S-缴械', 'S-舍己', 'C-不屈', 'C-救救我', 'A-逃窜'],
        description: '打苏蕊，逃窜可换应激反应，不屈可换绝地反击',
      }),
    ]);
  });
});
