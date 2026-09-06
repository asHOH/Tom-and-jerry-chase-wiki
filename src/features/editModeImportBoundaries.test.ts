import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';

const featureRoots = [
  'src/features/achievements',
  'src/features/buffs',
  'src/features/character-relations',
  'src/features/characters',
  'src/features/entities',
  'src/features/fixtures',
  'src/features/items',
  'src/features/knowledge-cards',
  'src/features/maps',
  'src/features/mechanics',
  'src/features/modes',
  'src/features/shared',
  'src/features/special-skills',
  'src/features/tools',
];

const appFeatureConsumers = [
  'src/app/(main)/characters/[characterId]/CharacterDetailsClient.tsx',
  'src/app/(main)/characters/user/[characterId]/UserCharacterPageClient.tsx',
];

const broadEditModeContextImportPattern =
  /import\s+\{[^}]*\b(?:useLocal[A-Z]\w*|usePageEditMode|PUBLISHABLE_ENTITY_TYPES|clearAllEditModeData|entityRegistry|getEntityRegistry)\b[^}]*\}\s+from ['"]@\/context\/EditModeContext['"]/;

const rawEditRuntimeImportPattern =
  /from ['"]@\/(?:lib\/edit\/(?:activeEditRuntime|editStores)|hooks\/useDraftDataRuntime)['"]/;

const mutationRuntimeExceptions = [
  'src/features/achievements/achievement-detail/AchievementAttributesCard.tsx',
  'src/features/buffs/components/buff-detail/BuffAttributesCard.tsx',
  'src/features/buffs/components/buff-detail/BuffDetails.tsx',
  'src/features/character-relations/matrix/useRelationMatrixEditMode.ts',
  'src/features/characters/components/character-detail/CharacterDetails.tsx',
  'src/features/characters/components/character-detail/knowledge-cards/KnowledgeCardManager.tsx',
  'src/features/characters/components/character-detail/knowledge-cards/KnowledgeCardSection.tsx',
  'src/features/characters/components/character-detail/positioning-tags/PositioningTagsSection.tsx',
  'src/features/characters/components/character-detail/skills/RecommendedStorePlansSection.tsx',
  'src/features/characters/components/character-detail/skills/SkillAllocationSection.tsx',
  'src/features/characters/components/character-detail/skills/SkillCard.tsx',
  'src/features/characters/components/character-detail/skills/SkillCardMedia.tsx',
  'src/features/characters/components/character-detail/skills/SkillCardProperties.tsx',
  'src/features/characters/components/character-detail/skills/SpecialSkillsSection.tsx',
  'src/features/characters/components/character-detail/useCharacterActions.ts',
  'src/features/characters/components/character-grid/CharacterCreate.tsx',
  'src/features/characters/components/character-grid/CharacterImport.tsx',
  'src/features/characters/utils/characterRelationOverlay.ts',
  'src/features/entities/entity-detail/EntityAttributesCard.tsx',
  'src/features/entities/entity-detail/EntityDetails.tsx',
  'src/features/entities/entity-detail/EntitySkillCard.tsx',
  'src/features/fixtures/components/fixture-detail/FixtureAttributesCard.tsx',
  'src/features/items/components/item-detail/ItemAttributesCard.tsx',
  'src/features/knowledge-cards/components/knowledge-card-detail/KnowledgeCardAttributesCard.tsx',
  'src/features/maps/interactive-map/InteractiveMapPage.tsx',
  'src/features/maps/map-detail/MapAttributesCard.tsx',
  'src/features/mechanics/sections/TraitEditor.tsx',
  'src/features/modes/components/mode-detail/ModeAttributesCard.tsx',
  'src/features/special-skills/components/special-skill-detail/SpecialSkillAttributesCard.tsx',
].sort();

function listSourceFiles(root: string): string[] {
  return readdirSync(root).flatMap((entry) => {
    const filePath = join(root, entry);
    const stats = statSync(filePath);

    if (stats.isDirectory()) {
      return listSourceFiles(filePath);
    }

    if (!stats.isFile()) {
      return [];
    }

    const fileName = filePath.split(/[\\/]/).at(-1) ?? '';
    if (!/\.(ts|tsx)$/.test(fileName) || /\.(test|spec)\.(ts|tsx)$/.test(fileName)) {
      return [];
    }

    return [filePath];
  });
}

describe('feature edit mode import boundaries', () => {
  it('keeps feature code from importing page-local or registry APIs from EditModeContext', () => {
    const offenders = featureRoots
      .flatMap((root) => listSourceFiles(root))
      .concat(appFeatureConsumers)
      .filter((filePath) => broadEditModeContextImportPattern.test(readFileSync(filePath, 'utf8')))
      .map((filePath) => relative(process.cwd(), filePath));

    expect(offenders).toEqual([]);
  });

  it('keeps raw edit-runtime imports limited to explicit mutation exceptions', () => {
    const consumers = featureRoots
      .flatMap((root) => listSourceFiles(root))
      .filter((filePath) => rawEditRuntimeImportPattern.test(readFileSync(filePath, 'utf8')))
      .map((filePath) => relative(process.cwd(), filePath).replaceAll('\\', '/'))
      .sort();

    expect(consumers).toEqual(mutationRuntimeExceptions);
  });
});
