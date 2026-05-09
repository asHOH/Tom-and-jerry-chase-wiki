import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { cardsEdit, characters, itemsEdit } from '@/data/store';

import { editable } from './editable';

let mockIsEditMode = false;
const mockHandleSelectCharacter = jest.fn();

jest.mock('@/context/AppContext', () => ({
  useAppContext: () => ({ handleSelectCharacter: mockHandleSelectCharacter }),
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

function seedEditableStoreFixtures() {
  delete characters['renamed-character'];
  characters['test-character'] = {
    id: 'test-character',
    description: 'Original Character',
    factionId: 'cat',
    faction: { id: 'cat', name: 'Cat' },
    imageUrl: '',
    skills: [],
    knowledgeCardGroups: [],
  } as unknown as (typeof characters)[string];

  cardsEdit['test-card'] = {
    id: 'test-card',
    name: 'Original Card',
    description: 'Old card description',
  } as unknown as (typeof cardsEdit)[string];

  itemsEdit['test-item'] = {
    name: 'Original Item',
    description: 'Old item description',
  } as unknown as (typeof itemsEdit)[string];
}

function editAndBlur(element: HTMLElement, text: string) {
  element.textContent = text;
  fireEvent.blur(element);
}

describe('editable', () => {
  beforeEach(() => {
    mockIsEditMode = false;
    mockHandleSelectCharacter.mockClear();
    seedEditableStoreFixtures();
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

    render(<Span path='unseededDescription' initialValue='editable value' />);

    await waitFor(() => {
      expect(screen.getByText('editable value')).toHaveAttribute(
        'contenteditable',
        'plaintext-only'
      );
    });
  });

  it('saves trimmed edited text on blur', async () => {
    mockIsEditMode = true;
    const onSave = jest.fn();
    const Span = editable('items').span;

    render(<Span path='unseededDescription' initialValue='old value' onSave={onSave} />);

    const element = screen.getByText('old value');
    element.textContent = ' new value ';
    fireEvent.blur(element);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith('new value');
    });
  });

  it('writes knowledge card fields through the cards adapter', async () => {
    mockIsEditMode = true;
    const Span = editable('cards').span;

    render(<Span path='description' initialValue='Old card description' />);

    editAndBlur(screen.getByText('Old card description'), ' New card description ');

    await waitFor(() => {
      expect(cardsEdit['test-card']?.description).toBe('New card description');
    });
  });

  it('rejects knowledge card id edits without changing card keys', async () => {
    mockIsEditMode = true;
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const Span = editable('cards').span;

    render(<Span path='id' initialValue='test-card' />);

    editAndBlur(screen.getByText('test-card'), 'renamed-card');

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to save editable value:',
        expect.any(Error)
      );
    });
    expect(cardsEdit['test-card']?.id).toBe('test-card');
    expect(cardsEdit['renamed-card']).toBeUndefined();

    consoleErrorSpy.mockRestore();
  });

  it('writes character nested fields through the characters adapter', async () => {
    mockIsEditMode = true;
    const Span = editable('characters').span;

    render(<Span path='description' initialValue='Original Character' />);

    editAndBlur(screen.getByText('Original Character'), ' Updated Character ');

    await waitFor(() => {
      expect(characters['test-character']?.description).toBe('Updated Character');
    });
  });

  it('routes character id edits through character id change handling', async () => {
    mockIsEditMode = true;
    const Span = editable('characters').span;

    render(<Span path='id' factionId='cat' initialValue='test-character' />);

    editAndBlur(screen.getByText('test-character'), 'renamed-character');

    await waitFor(() => {
      expect(characters['renamed-character']?.id).toBe('renamed-character');
    });
    expect(mockHandleSelectCharacter).toHaveBeenCalledWith('renamed-character');
  });

  it('writes record scope fields through the record adapter', async () => {
    mockIsEditMode = true;
    const Span = editable('items').span;

    render(<Span path='description' initialValue='Old item description' />);

    editAndBlur(screen.getByText('Old item description'), ' New item description ');

    await waitFor(() => {
      expect(itemsEdit['test-item']?.description).toBe('New item description');
    });
  });

  it('rejects record route-key edits without changing record fields', async () => {
    mockIsEditMode = true;
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const Span = editable('items').span;

    render(<Span path='name' initialValue='Original Item' />);

    editAndBlur(screen.getByText('Original Item'), 'Renamed Item');

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to save editable value:',
        expect.any(Error)
      );
    });
    expect(itemsEdit['test-item']?.name).toBe('Original Item');

    consoleErrorSpy.mockRestore();
  });

  it('does not rely on TypeScript escape hatches in editable modules', () => {
    const offenders = listEditableSourceFiles()
      .filter((filePath) => forbiddenEditableSourcePattern.test(readFileSync(filePath, 'utf8')))
      .map((filePath) => relative(process.cwd(), filePath));

    expect(offenders).toEqual([]);
  });
});
