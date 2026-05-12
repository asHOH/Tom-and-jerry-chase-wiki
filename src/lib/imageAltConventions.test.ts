import { readFileSync } from 'fs';
import path from 'path';

const gridCardFiles = [
  'src/features/achievements/achievement-grid/AchievementCardDisplay.tsx',
  'src/features/buffs/components/buff-grid/BuffCardDisplay.tsx',
  'src/features/characters/components/character-grid/CharacterDisplay.tsx',
  'src/features/characters/components/character-ranking/CharacterRankingCard.tsx',
  'src/features/entities/entity-grid/EntityCardDisplay.tsx',
  'src/features/fixtures/components/fixture-grid/FixtureCardDisplay.tsx',
  'src/features/items/components/item-grid/ItemCardDisplay.tsx',
  'src/features/items/components/itemGroups/itemGroup-detail/SingleItemCardDisplay.tsx',
  'src/features/items/components/itemGroups/itemGroup-grid/ItemGroupCardDisplay.tsx',
  'src/features/knowledge-cards/components/knowledge-card-grid/KnowledgeCardDisplay.tsx',
  'src/features/maps/map-grid/MapCardDisplay.tsx',
  'src/features/modes/components/mode-grid/ModeCardDisplay.tsx',
  'src/features/special-skills/components/special-skill-grid/SpecialSkillGrid.tsx',
];

const repeatedLabelAltPatterns = [
  /imageAlt=\{`[^`]*图标[^`]*`\}/u,
  /alt=\{`[^`]*图标[^`]*`\}/u,
  /imageAlt=\{`[^`]*地图预览[^`]*`\}/u,
  /alt=\{`\$\{name\}`\}/u,
  /alt=\{name\}/u,
  /alt=\{skill\.name\}/u,
];

describe('grid card image alt conventions', () => {
  it.each(gridCardFiles)('does not repeat visible card labels in %s', (file) => {
    const source = readFileSync(path.join(process.cwd(), file), 'utf8');

    for (const pattern of repeatedLabelAltPatterns) {
      expect(source).not.toMatch(pattern);
    }
  });
});
