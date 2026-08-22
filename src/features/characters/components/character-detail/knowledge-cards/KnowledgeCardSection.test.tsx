/* oxlint-disable typescript/no-explicit-any */
import { render, screen, waitFor } from '@testing-library/react';

import type { ActiveEditRuntime } from '@/lib/edit/activeEditRuntime';
import { StorageKey } from '@/lib/localStorage';
import { clearTestEditRuntime, installTestEditRuntime } from '@/testUtils/editRuntime';

import { KnowledgeCardGroupDisplay } from './KnowledgeCardGroupDisplay';
import KnowledgeCardSection from './KnowledgeCardSection';

jest.mock('@/context/AppContext', () => ({
  useAppContext: () => ({
    handleSelectCard: jest.fn(),
    isDetailedView: false,
  }),
}));

jest.mock('@/context/DarkModeContext', () => ({
  useDarkMode: () => [false, jest.fn()] as const,
}));

jest.mock('@/context/EditModeContext', () => ({
  useEditMode: () => ({ isEditMode: false }),
}));

jest.mock('@/components/GotoLink', () => ({
  __esModule: true,
  default: ({
    categoryHint,
    children,
    name,
  }: {
    categoryHint?: string;
    children: React.ReactNode;
    name: string;
  }) => (
    <span data-category-hint={categoryHint} data-goto-name={name}>
      {children}
    </span>
  ),
}));

jest.mock('@/components/Image', () => ({
  __esModule: true,
  default: ({ alt }: { alt: string }) => <span aria-label={alt} role='img' />,
}));

jest.mock('usehooks-ts', () => ({
  useMediaQuery: jest.fn(() => false),
}));

let runtime: ActiveEditRuntime;
let characters: ActiveEditRuntime['stores']['characters'];

beforeEach(() => {
  runtime = installTestEditRuntime();
  characters = runtime.stores.characters;
});

afterEach(() => {
  clearTestEditRuntime(runtime);
});

describe('KnowledgeCard nested persistence (sanity tests)', () => {
  const charId = 'test-char-for-knowledgecard-section';

  beforeEach(() => {
    (characters as any)[charId] = {
      id: charId,
      knowledgeCardGroups: [
        {
          id: 'preset-1',
          description: 'preset desc',
          detailedDescription: 'detailed',
          defaultFolded: false,
          groups: [
            { cards: ['cat-1'], description: 'g1' },
            { cards: ['cat-2'], description: 'g2' },
          ],
        },
      ],
    };
  });

  test('writing nested group cards updates the Valtio characters store', () => {
    // sanity write following the example pattern from implementation plan
    (characters as any)[charId]!.knowledgeCardGroups[0]!.groups[1]!.cards = Array.from(['cat-99']);

    expect((characters as any)[charId]!.knowledgeCardGroups[0]!.groups[1]!.cards).toEqual([
      'cat-99',
    ]);
  });

  test('updating group-set metadata persists to characters store', () => {
    (characters as any)[charId]!.knowledgeCardGroups[0]!.id = 'preset-1-renamed';
    (characters as any)[charId]!.knowledgeCardGroups[0]!.description = 'updated desc';
    (characters as any)[charId]!.knowledgeCardGroups[0]!.defaultFolded = true;

    expect((characters as any)[charId]!.knowledgeCardGroups[0]!.id).toBe('preset-1-renamed');
    expect((characters as any)[charId]!.knowledgeCardGroups[0]!.description).toBe('updated desc');
    expect((characters as any)[charId]!.knowledgeCardGroups[0]!.defaultFolded).toBe(true);
  });
});

describe('KnowledgeCardGroupDisplay', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-09-03T00:00:00+08:00'));
    (characters as any)['test-character'] = { id: 'test-character' };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const defaultProps = {
    group: ['S-绝地反击', 'C-飞跃'] as const,
    index: 0,
    description: undefined,
    isEditMode: false,
    viewMode: 'tree' as const,
    handleSelectCard: jest.fn(),
    characterId: 'test-character',
    handleEditClick: jest.fn(),
    onRemoveGroup: jest.fn(),
    getCardCost: () => 5,
    getCardRank: () => 'C',
    imageBasePath: '/images/mouseCards/',
    descriptionPath: 'knowledgeCardGroups.0.description',
    contributor: undefined,
    getCardPriority: (cardId: string) => (cardId === 'C-飞跃' ? '3级质变' : undefined),
  };

  it('hides priority warnings before September 3, 2026', () => {
    jest.setSystemTime(new Date('2026-09-02T23:59:59+08:00'));

    render(<KnowledgeCardGroupDisplay {...defaultProps} />);

    expect(
      screen.queryByRole('button', { name: '飞跃建议升到三级再佩戴' })
    ).not.toBeInTheDocument();
  });

  it('shows priority warnings on target cards starting September 3, 2026', () => {
    render(<KnowledgeCardGroupDisplay {...defaultProps} />);

    expect(screen.queryByText('飞跃建议升到三级再佩戴')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '飞跃建议升到三级再佩戴' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: '绝地反击建议升到三级再佩戴' })
    ).not.toBeInTheDocument();
  });

  it('uses the knowledge card category hint for tree image links', () => {
    render(<KnowledgeCardGroupDisplay {...defaultProps} />);

    expect(screen.getByLabelText('S-绝地反击').closest('[data-goto-name]')).toHaveAttribute(
      'data-category-hint',
      '知识卡'
    );
  });

  it('uses the knowledge card category hint for squeezed links', () => {
    render(<KnowledgeCardGroupDisplay {...defaultProps} viewMode='compact' />);

    expect(screen.getByText('绝地反击').closest('[data-goto-name]')).toHaveAttribute(
      'data-category-hint',
      '知识卡'
    );
  });
});

describe('KnowledgeCardSection', () => {
  const characterId = 'test-character-with-view-mode';

  beforeEach(() => {
    (characters as any)[characterId] = {
      id: characterId,
      factionId: 'mouse',
    };
  });

  afterEach(() => {
    localStorage.clear();
  });

  it.each(['image', 'flat', 'tree-folded', 'invalid'])(
    'normalizes unsupported stored view mode "%s" to tree',
    async (storedViewMode) => {
      localStorage.setItem(StorageKey.KnowledgeCardViewMode, storedViewMode);

      render(
        <KnowledgeCardSection
          knowledgeCardGroups={[{ cards: ['C-飞跃'] }]}
          factionId='mouse'
          characterId={characterId}
          onCreateGroup={jest.fn()}
          onRemoveGroup={jest.fn()}
        />
      );

      expect(screen.getByRole('button', { name: '当前: 图片视图' })).toBeInTheDocument();
      await waitFor(() =>
        expect(localStorage.getItem(StorageKey.KnowledgeCardViewMode)).toBe('tree')
      );
    }
  );
});
