import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';
import { render, screen, waitFor } from '@testing-library/react';

import { editable } from './editable';

let mockIsEditMode = false;

jest.mock('@/context/AppContext', () => ({
  useAppContext: () => ({ handleSelectCharacter: jest.fn() }),
}));

jest.mock('@/context/EditModeContext', () => ({
  useEditMode: () => ({ isEditMode: mockIsEditMode }),
  useLocalAchievement: () => ({ achievementName: 'test-achievement' }),
  useLocalBuff: () => ({ buffName: 'test-buff' }),
  useLocalCard: () => ({ cardId: 'test-card' }),
  useLocalCharacter: () => ({ characterId: 'test-character' }),
  useLocalEntity: () => ({ entityName: 'test-entity' }),
  useLocalFixture: () => ({ fixtureName: 'test-fixture' }),
  useLocalItem: () => ({ itemName: 'test-item' }),
  useLocalMap: () => ({ mapName: 'test-map' }),
  useLocalMode: () => ({ modeName: 'test-mode' }),
  useLocalSpecialSkill: () => ({ factionId: 'cat', skillId: 'test-skill' }),
}));

jest.mock('@/features/shared/components/TextWithHoverTooltips', () => ({
  __esModule: true,
  default: ({ text }: { text: string }) => <>{text}</>,
}));

const editableDir = join(process.cwd(), 'src/components/ui');
const forbiddenEditableSourcePattern = new RegExp(
  [`@ts-${'expect-error'}`, String.raw`\sas ${'any'}\b`].join('|')
);

function listEditableSourceFiles(): string[] {
  return readdirSync(editableDir)
    .map((entry) => join(editableDir, entry))
    .filter((filePath) => {
      const stats = statSync(filePath);
      const fileName = filePath.split(/[\\/]/).at(-1) ?? '';
      return stats.isFile() && /^editable(?!\.test).*\.(ts|tsx)$/.test(fileName);
    });
}

describe('editable', () => {
  beforeEach(() => {
    mockIsEditMode = false;
  });

  it('returns stable scoped proxies and tag components', () => {
    const firstItemsEditable = editable('items');
    const secondItemsEditable = editable('items');

    expect(secondItemsEditable).toBe(firstItemsEditable);
    expect(secondItemsEditable.span).toBe(firstItemsEditable.span);
  });

  it('returns undefined for promise-like reserved keys', () => {
    const itemsEditable = editable('items') as unknown as Record<string, unknown>;

    expect(itemsEditable.then).toBeUndefined();
    expect(itemsEditable.catch).toBeUndefined();
    expect(itemsEditable.finally).toBeUndefined();
  });

  it('renders readonly text content outside edit mode', async () => {
    const Span = editable('items').span;

    render(<Span path='description' initialValue='readonly value' />);

    expect(screen.getByText('readonly value')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('readonly value')).toBeInTheDocument();
    });
  });

  it('renders plaintext contentEditable content in edit mode', async () => {
    mockIsEditMode = true;
    const Span = editable('items').span;

    render(<Span path='description' initialValue='editable value' />);

    await waitFor(() => {
      expect(screen.getByText('editable value')).toHaveAttribute(
        'contenteditable',
        'plaintext-only'
      );
    });
  });

  it('does not rely on TypeScript escape hatches in editable modules', () => {
    const offenders = listEditableSourceFiles()
      .filter((filePath) => forbiddenEditableSourcePattern.test(readFileSync(filePath, 'utf8')))
      .map((filePath) => relative(process.cwd(), filePath));

    expect(offenders).toEqual([]);
  });
});
