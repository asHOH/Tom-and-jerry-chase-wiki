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

const rawActionPattern =
  /<(?:button|Link)\b(?=[^>]*\bclassName=)[^>]*\b(?:bg-blue|bg-green|bg-red|bg-yellow|bg-gray-100|bg-gray-200|bg-gray-300|bg-gray-500|bg-gray-600)/;

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

  it('does not combine conflicting focus-visible outline utilities', () => {
    const offenders = tailwindConflictTargets.filter((relativePath) => {
      const source = fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');
      return duplicateFocusVisibleOutlinePattern.test(source);
    });

    expect(offenders).toEqual([]);
  });
});
