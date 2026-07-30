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
  'src/features/discussion/components/NewTopicForm.tsx',
  'src/features/discussion/components/ReplyForm.tsx',
  'src/features/discussion/components/TopicSection.tsx',
  'src/features/discussion/TalkPageClient.tsx',
  'src/app/(main)/games/guess-character/components/ResultDialog.tsx',
  'src/app/(main)/games/playstyle-quiz/GameClient.tsx',
  'src/app/(main)/games/stat-showdown/components/GameOverDialog.tsx',
  'src/features/mechanics/sections/TraitCollection.tsx',
] as const;

const formControlPrimitiveTargets = [
  {
    primitive: 'FormInput',
    rawElementPattern: /<input\b/,
    relativePaths: [
      'src/features/discussion/components/NewTopicForm.tsx',
      'src/features/mechanics/sections/TraitCollection.tsx',
    ],
  },
  {
    primitive: 'FormSelect',
    rawElementPattern: /<select\b/,
    relativePaths: ['src/app/(main)/recommended/RecommendedPageClient.tsx'],
  },
  {
    primitive: 'FormTextarea',
    rawElementPattern: /<textarea\b/,
    relativePaths: [
      'src/features/discussion/components/NewTopicForm.tsx',
      'src/features/discussion/components/ReplyForm.tsx',
      'src/components/ui/EditModeToolbar.tsx',
    ],
  },
] as const;

const aliasIconPrimitiveTargets = [
  'src/features/achievements/achievement-detail/AchievementAttributesCard.tsx',
  'src/features/buffs/components/buff-detail/BuffAttributesCard.tsx',
  'src/features/characters/components/character-detail/skills/SkillCardProperties.tsx',
  'src/features/knowledge-cards/components/knowledge-card-detail/KnowledgeCardAttributesCard.tsx',
  'src/features/maps/map-detail/MapAttributesCard.tsx',
  'src/features/modes/components/mode-detail/ModeAttributesCard.tsx',
  'src/features/special-skills/components/special-skill-detail/SpecialSkillAttributesCard.tsx',
] as const;

const characterDetailIconPrimitiveTargets = [
  'src/features/characters/components/character-detail/CharacterDetails.tsx',
  'src/features/characters/components/character-detail/positioning-tags/PositioningTagsSection.tsx',
  'src/features/characters/components/character-detail/knowledge-cards/KnowledgeCardGroupDisplay.tsx',
  'src/features/characters/components/character-detail/knowledge-cards/KnowledgeCardSection.tsx',
  'src/features/characters/components/character-detail/knowledge-cards/KnowledgeCardGroupSetDisplay.tsx',
  'src/features/characters/components/character-detail/skills/SkillAllocationDisplay.tsx',
  'src/features/characters/components/character-detail/skills/SkillAllocationSection.tsx',
  'src/features/characters/components/character-detail/skills/SkillCard.tsx',
  'src/features/characters/components/character-detail/skills/SpecialSkillsSection.tsx',
  'src/features/characters/components/character-detail/character-relations/CharacterRelationPanel.tsx',
] as const;

const relationSelectorIconPrimitiveTargets = [
  'src/features/characters/components/character-detail/character-relations/RelationItemSelector.tsx',
  'src/components/ui/CharacterSelector.tsx',
] as const;

const knowledgeCardSemanticColorTargets = [
  'src/features/characters/components/character-detail/knowledge-cards/KnowledgeCardSection.tsx',
  'src/features/characters/components/character-detail/knowledge-cards/PriorityWarningBadge.tsx',
] as const;

const rawActionPattern =
  /<(?:button|Link)\b(?=[^>]*\bclassName=)[^>]*\b(?:bg-blue|bg-green|bg-red|bg-yellow|bg-gray-100|bg-gray-200|bg-gray-300|bg-gray-500|bg-gray-600)/;

const rawEditModeToolbarGenericActionPattern =
  /<button\b(?=[^>]*(?:onClick=\{handleDiscard\}|data-tutorial-id='edit-mode-toolbar-(?:preview|publish)'))/;

const rawAliasAddButtonPattern =
  /<button\b(?=[\s\S]{0,800}aria-label='添加别名')(?=[\s\S]{0,800}<\/button>)[\s\S]{0,800}<\/button>/;

const hasRawAliasAddButton = (source: string) => rawAliasAddButtonPattern.test(source);

const rawMigratedIconButtonPattern =
  /<button\b(?=[\s\S]{0,800}(?:h-4 w-4|h-7 w-7|h-8 w-8))(?=[\s\S]{0,800}(?:bg-yellow-500|bg-red-500|bg-blue-500|bg-green-600|dark:bg-yellow-600|dark:bg-red-600|dark:bg-blue-600))(?=[\s\S]{0,800}<\/button>)[\s\S]{0,800}<\/button>/;

const hasRawMigratedIconButton = (source: string) => rawMigratedIconButtonPattern.test(source);

const rawRelationSelectorAddButtonPattern =
  /<button\b(?=[\s\S]{0,800}(?:aria-label=\{triggerAriaLabel\}|aria-label=\{`添加\$\{relationType\}关系`\}))(?=[\s\S]{0,800}h-8 w-8)(?=[\s\S]{0,800}(?:bg-yellow-500|bg-blue-500|bg-purple-500|dark:bg-yellow-600|dark:bg-blue-600|dark:bg-purple-600))(?=[\s\S]{0,800}<\/button>)[\s\S]{0,800}<\/button>/;

const hasRawRelationSelectorAddButton = (source: string) =>
  rawRelationSelectorAddButtonPattern.test(source);

const tailwindConflictTargets = ['src/lib/design/componentClasses.ts'] as const;

const duplicateFocusVisibleOutlinePattern =
  /(?:^|[\s'"])focus-visible:outline(?!-)\s+focus-visible:outline-2(?!-)|(?:^|[\s'"])focus-visible:outline-2(?!-)\s+focus-visible:outline(?!-)/;

const hardCodedSemanticHexPattern = /#[0-9A-Fa-f]{3,8}|(?:bg|text|border)-\[#/;

describe('UI style consistency', () => {
  it('uses shared action primitives in migrated surfaces', () => {
    const offenders = actionPrimitiveTargets.filter((relativePath) => {
      const source = fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');
      return rawActionPattern.test(source);
    });

    expect(offenders).toEqual([]);
  });

  it('uses Button for generic edit toolbar actions', () => {
    const source = fs.readFileSync(
      path.join(projectRoot, 'src/components/ui/EditModeToolbar.tsx'),
      'utf8'
    );

    expect(source).not.toMatch(rawEditModeToolbarGenericActionPattern);
    expect(source.match(/<Button\b/g)).toHaveLength(3);
  });

  it('uses shared form controls in migrated generic form fields', () => {
    const offenders = formControlPrimitiveTargets.flatMap(
      ({ primitive, rawElementPattern, relativePaths }) =>
        relativePaths.flatMap((relativePath) => {
          const source = fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');
          return !source.includes(`<${primitive}`) || rawElementPattern.test(source)
            ? [`${relativePath} (${primitive})`]
            : [];
        })
    );

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

  it('uses IconButton for relation selector add triggers', () => {
    const offenders = relationSelectorIconPrimitiveTargets.filter((relativePath) => {
      const source = fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');
      return !source.includes('<IconButton') || hasRawRelationSelectorAddButton(source);
    });

    expect(offenders).toEqual([]);
  });

  it('keeps knowledge card semantic colors in design helpers or Tailwind palette classes', () => {
    const offenders = knowledgeCardSemanticColorTargets.filter((relativePath) => {
      const source = fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');
      return hardCodedSemanticHexPattern.test(source);
    });

    expect(offenders).toEqual([]);
  });

  it('does not combine conflicting focus-visible outline utilities', () => {
    const offenders = tailwindConflictTargets.filter((relativePath) => {
      const source = fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');
      return duplicateFocusVisibleOutlinePattern.test(source);
    });

    expect(offenders).toEqual([]);
  });
});
