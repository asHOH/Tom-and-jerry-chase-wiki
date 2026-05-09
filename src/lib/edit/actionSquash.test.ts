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
    ).toEqual([deleteSkill, oldSkillName, newSkillName, newDescription]);
  });

  it('should squash unrelated repeated sets when another root has structural edits', () => {
    const deleteTomSkill = deleteAction('Tom.skills.1', { name: 'old skill' });
    const oldJerryDescription = setAction('Jerry.description', 'old', 'middle');
    const newJerryDescription = setAction('Jerry.description', 'middle', 'new');

    expect(squashActions([deleteTomSkill, oldJerryDescription, newJerryDescription])).toEqual([
      deleteTomSkill,
      newJerryDescription,
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
      newDescription,
    ]);
  });
});
