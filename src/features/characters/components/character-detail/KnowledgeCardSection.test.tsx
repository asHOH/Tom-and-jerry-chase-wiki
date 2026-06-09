/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from '@testing-library/react';

import { characters } from '@/data';

import { KnowledgeCardGroupDisplay } from './KnowledgeCardSection';

jest.mock('@/components/GotoLink', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/components/Image', () => ({
  __esModule: true,
  default: ({ alt }: { alt: string }) => <span aria-label={alt} role='img' />,
}));

jest.mock('usehooks-ts', () => ({
  useMediaQuery: jest.fn(() => false),
}));

describe('KnowledgeCard nested persistence (sanity tests)', () => {
  const charId = 'test-char-for-knowledgecard-section';

  beforeEach(() => {
    // reset test character in the Valtio characters store
    // minimal shape used by the components
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

  afterEach(() => {
    // cleanup
    delete (characters as any)[charId];
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
  const defaultProps = {
    group: ['C-飞跃', 'C-追风'] as const,
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
    contributorInformation: undefined,
    isDarkMode: false,
    getCardPriority: (cardId: string) => (cardId === 'C-飞跃' ? '3级质变' : undefined),
  };

  it('shows priority warnings on target cards instead of as a group meta tag', () => {
    render(<KnowledgeCardGroupDisplay {...defaultProps} />);

    expect(screen.queryByText('飞跃建议升到三级再佩戴')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '飞跃建议升到三级再佩戴' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: '追风建议升到三级再佩戴' })
    ).not.toBeInTheDocument();
  });
});
