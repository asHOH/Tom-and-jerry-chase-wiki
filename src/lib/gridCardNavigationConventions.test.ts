import { readFileSync } from 'fs';
import path from 'path';

const gridFiles = [
  'src/features/achievements/achievement-grid/AchievementGrid.tsx',
  'src/features/buffs/components/buff-grid/BuffGrid.tsx',
  'src/features/entities/entity-grid/EntityGrid.tsx',
  'src/features/fixtures/components/fixture-grid/FixtureGrid.tsx',
  'src/features/items/components/item-grid/ItemGrid.tsx',
  'src/features/items/components/itemGroups/itemGroup-detail/ItemGroupDetails.tsx',
  'src/features/items/components/itemGroups/itemGroup-grid/ItemGroupGrid.tsx',
  'src/features/maps/map-grid/MapGrid.tsx',
  'src/features/modes/components/mode-grid/ModeGrid.tsx',
];

describe('grid card navigation conventions', () => {
  it.each(gridFiles)('lets card components own navigation in %s', (file) => {
    const source = readFileSync(path.join(process.cwd(), file), 'utf8');

    expect(source).not.toMatch(/<Link[\s\S]*?<\w+CardDisplay/u);
  });
});
