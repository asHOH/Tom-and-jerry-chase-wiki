import { createGameActionDiff } from './gameActionDiff';
import { foldUnchangedSkillStructure } from './skillStructureDiff';

const skill = {
  id: '剑客汤姆-weapon1',
  name: '剑盾防御',
  type: 'weapon1',
  skillLevels: [{ level: 1, description: '' }],
};
const usage = { forecast: 0, aftercast: 0.9, cancelableAftercast: ['道具键*', '道具键'] };
const before = { ...skill, ...usage };
const after = { ...skill, parts: [usage], aliases: ['能防泰菲的地雷'] };

it('shows the alias change without repeated unchanged usage values', () => {
  const result = foldUnchangedSkillStructure([before], [after]);
  expect(result.convertedSkills).toEqual(['剑盾防御']);
  const diff = createGameActionDiff(result.oldValue, [after]);
  expect(diff.removedLines).toBe(0);
  expect(diff.addedLines).toBe(3);
  expect(before).not.toHaveProperty('parts');
  expect(after.parts).toEqual([usage]);
});

it('handles the reverse conversion and nested character replacements', () => {
  const result = foldUnchangedSkillStructure(
    { skills: [after] },
    { skills: [{ ...before, aliases: after.aliases }] }
  );
  expect(result.convertedSkills).toEqual(['剑盾防御']);
  expect(result.oldValue).toEqual({ skills: [{ ...before, aliases: after.aliases }] });
});

it.each([
  { ...after, parts: [{ ...usage, aftercast: 1 }] },
  { ...after, parts: [usage, {}] },
  { ...after, parts: [] },
  { ...after, parts: [{ ...usage, unexpected: true }] },
  { ...after, forecast: 0 },
  { ...after, id: 'different-skill' },
  { ...after, type: 'active' },
])('preserves real or ambiguous structure changes: %j', (next) => {
  expect(foldUnchangedSkillStructure(before, next)).toEqual({
    oldValue: before,
    convertedSkills: [],
  });
});

it('does not treat similar ordinary objects as skills', () => {
  expect(foldUnchangedSkillStructure(usage, { parts: [usage] })).toEqual({
    oldValue: usage,
    convertedSkills: [],
  });
});
