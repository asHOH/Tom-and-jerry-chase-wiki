import { readFileSync } from 'fs';

import { PUBLISHABLE_ENTITY_TYPES } from './publishableEntityTypes';

describe('publishableEntityTypes', () => {
  it('defines the complete ordered publishable-domain contract', () => {
    expect(PUBLISHABLE_ENTITY_TYPES).toEqual([
      'characters',
      'cards',
      'entities',
      'buffs',
      'items',
      'fixtures',
      'maps',
      'modes',
      'specialSkills',
      'achievements',
      'traits',
    ]);
    expect(Object.isFrozen(PUBLISHABLE_ENTITY_TYPES)).toBe(true);
  });

  it('has no imports that can evaluate stores or game-data values', () => {
    const source = readFileSync('src/lib/gameData/publishableEntityTypes.ts', 'utf8');

    expect(source).not.toMatch(/^\s*import\s/m);
    expect(source).not.toMatch(/^\s*export\s+.+\s+from\s/m);
  });
});
