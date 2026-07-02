import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();

const actionPrimitiveTargets = [
  'src/features/articles/components/ArticlesClient.tsx',
  'src/app/(main)/articles/pending/PendingClient.tsx',
  'src/app/(main)/articles/preview/PreviewClient.tsx',
  'src/app/(main)/articles/[id]/ArticleClient.tsx',
  'src/app/(main)/articles/[id]/history/ArticleHistoryClient.tsx',
  'src/features/admin/components/CategoryManagement.tsx',
  'src/features/admin/components/UserManagement.tsx',
  'src/components/LoginDialog.tsx',
  'src/components/ChangePasswordDialog.tsx',
  'src/features/characters/components/character-grid/CharacterCreate.tsx',
  'src/features/characters/components/character-grid/CharacterImport.tsx',
  'src/components/ui/FeedbackSection.tsx',
  'src/components/ui/KnowledgeCardPicker.tsx',
  'src/components/ui/RichTextEditor/LinkDialog.tsx',
  'src/components/ui/RichTextEditor/ImagePickerModal.tsx',
] as const;

const aliasIconPrimitiveTargets = [
  'src/features/achievements/achievement-detail/AchievementAttributesCard.tsx',
  'src/features/buffs/components/buff-detail/BuffAttributesCard.tsx',
  'src/features/characters/components/character-detail/character-attributes/AttributeDisplay.tsx',
  'src/features/characters/components/character-detail/skills/SkillCard.tsx',
  'src/features/knowledge-cards/components/knowledge-card-detail/KnowledgeCardAttributesCard.tsx',
  'src/features/maps/map-detail/MapAttributesCard.tsx',
  'src/features/modes/components/mode-detail/ModeAttributesCard.tsx',
  'src/features/special-skills/components/special-skill-detail/SpecialSkillAttributesCard.tsx',
] as const;

const characterDetailIconPrimitiveTargets = [
  'src/features/characters/components/character-detail/CharacterDetails.tsx',
  'src/features/characters/components/character-detail/positioning-tags/PositioningTagsSection.tsx',
  'src/features/characters/components/character-detail/knowledge-cards/KnowledgeCardSection.tsx',
  'src/features/characters/components/character-detail/knowledge-cards/KnowledgeCardGroupSetDisplay.tsx',
  'src/features/characters/components/character-detail/skills/SkillAllocationDisplay.tsx',
  'src/features/characters/components/character-detail/skills/SkillAllocationSection.tsx',
  'src/features/characters/components/character-detail/skills/SkillCard.tsx',
  'src/features/characters/components/character-detail/skills/SpecialSkillsSection.tsx',
  'src/features/characters/components/character-detail/character-relations/CharacterRelationPanel.tsx',
] as const;

const rawActionPattern =
  /<(?:button|Link)\b(?=[^>]*\bclassName=)[^>]*\b(?:bg-blue|bg-green|bg-red|bg-yellow|bg-gray-100|bg-gray-200|bg-gray-300|bg-gray-500|bg-gray-600)/;

const rawAliasAddButtonPattern =
  /<button\b(?=[\s\S]{0,800}aria-label='添加别名')(?=[\s\S]{0,800}<\/button>)[\s\S]{0,800}<\/button>/;

const hasRawAliasAddButton = (source: string) => rawAliasAddButtonPattern.test(source);

const rawMigratedIconButtonPattern =
  /<button\b(?=[\s\S]{0,800}(?:h-4 w-4|h-7 w-7|h-8 w-8))(?=[\s\S]{0,800}(?:bg-yellow-500|bg-red-500|bg-blue-500|bg-green-600|dark:bg-yellow-600|dark:bg-red-600|dark:bg-blue-600))(?=[\s\S]{0,800}<\/button>)[\s\S]{0,800}<\/button>/;

const hasRawMigratedIconButton = (source: string) => rawMigratedIconButtonPattern.test(source);

const tailwindConflictTargets = ['src/lib/design/componentClasses.ts'] as const;

const duplicateFocusVisibleOutlinePattern =
  /(?:^|[\s'"])focus-visible:outline(?!-)\s+focus-visible:outline-2(?!-)|(?:^|[\s'"])focus-visible:outline-2(?!-)\s+focus-visible:outline(?!-)/;

describe('UI style consistency', () => {
  it('uses shared action primitives in migrated article, admin, and modal surfaces', () => {
    const offenders = actionPrimitiveTargets.filter((relativePath) => {
      const source = fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');
      return rawActionPattern.test(source);
    });

    expect(offenders).toEqual([]);
  });

  it('uses AddAliasButton for migrated alias add controls', () => {
    const offenders = aliasIconPrimitiveTargets.filter((relativePath) => {
      const source = fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');
      return !source.includes('<AddAliasButton') || hasRawAliasAddButton(source);
    });

    expect(offenders).toEqual([]);
  });

  it('uses IconButton for migrated character detail edit controls', () => {
    const offenders = characterDetailIconPrimitiveTargets.filter((relativePath) => {
      const source = fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');
      return !source.includes('<IconButton') || hasRawMigratedIconButton(source);
    });

    expect(offenders).toEqual([]);
  });

  it('allows non-icon relation toggles to keep semantic Tailwind color classes', () => {
    const source = fs.readFileSync(
      path.join(
        projectRoot,
        'src/features/characters/components/character-detail/character-relations/CharacterRelationPanel.tsx'
      ),
      'utf8'
    );

    expect(source).toContain('dark:hover:bg-green-600');
    expect(source).not.toContain('dark:hover:bg-[#16a34a]');
  });

  it('does not combine conflicting focus-visible outline utilities', () => {
    const offenders = tailwindConflictTargets.filter((relativePath) => {
      const source = fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');
      return duplicateFocusVisibleOutlinePattern.test(source);
    });

    expect(offenders).toEqual([]);
  });
});
