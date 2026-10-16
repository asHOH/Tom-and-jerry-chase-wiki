import { buffs, entities, itemGroups, items, specialSkills, traits } from '@/data/static';
import { variantEdges } from '@/data/variants';

it('supplies an explicit faction for checked-in references to shared special-skill names', () => {
  const sharedNames = new Set(
    Object.keys(specialSkills.cat).filter((name) => Object.hasOwn(specialSkills.mouse, name))
  );
  const ambiguousPaths: string[] = [];
  const inspect = (value: unknown, path: string) => {
    if (value === null || typeof value !== 'object') return;
    const record = value as Record<string, unknown>;
    if (
      record.type === 'specialSkill' &&
      typeof record.name === 'string' &&
      sharedNames.has(record.name) &&
      record.factionId !== 'cat' &&
      record.factionId !== 'mouse'
    ) {
      ambiguousPaths.push(path);
    }
    for (const [key, child] of Object.entries(record)) inspect(child, `${path}.${key}`);
  };

  inspect({ buffs, entities, itemGroups, items, traits, variantEdges }, 'data');
  expect(ambiguousPaths).toEqual([]);
});
