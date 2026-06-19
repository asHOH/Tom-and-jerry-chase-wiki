/**
 * @jest-environment node
 */

import { type ReactNode } from 'react';
import { renderToString } from 'react-dom/server';

import CharacterDetails from './CharacterDetails';

jest.mock('motion/react', () => {
  return {
    AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
    m: {
      button: ({ children }: { children: ReactNode }) => <button type='button'>{children}</button>,
    },
  };
});

jest.mock('@/data', () => ({
  characters: (() => {
    const { proxy } = jest.requireActual<typeof import('valtio')>('valtio');

    return {
      testCharacter: proxy({
        id: 'testCharacter',
        factionId: 'cat',
        description: 'test description',
        imageUrl: '/test-character.png',
        createDate: '2026.1.1',
        aliases: [],
        skills: [],
        knowledgeCardGroups: [],
        catPositioningTags: [],
      }),
    };
  })(),
}));

jest.mock('@/context/EditModeContext', () => ({
  EditModeContext: ({ children }: { children: ReactNode }) => <>{children}</>,
  useEditMode: () => ({ isEditMode: false }),
}));

jest.mock('@/hooks/useLocalEditEntity', () => ({
  useLocalCharacter: () => ({ characterId: 'testCharacter' }),
}));

jest.mock('@/hooks/useMediaQuery', () => ({
  useMobile: () => false,
}));

jest.mock('@/components/Image', () => ({
  __esModule: true,
  default: ({ alt }: { alt: string }) => <span>{alt}</span>,
}));

jest.mock('@/components/ui/Card', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <section>{children}</section>,
}));

jest.mock('@/components/ui/CollapseCard', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <section>{children}</section>,
}));

jest.mock('@/components/ui/CharacterNavigationButtons', () => ({
  __esModule: true,
  default: () => <nav />,
}));

jest.mock('@/components/ui/EditButton', () => ({
  __esModule: true,
  default: () => <button type='button'>编辑</button>,
}));

jest.mock('@/components/icons/CommonIcons', () => ({
  CloseIcon: () => <span />,
  PlusIcon: () => <span />,
}));

jest.mock('@/components/ui/editable', () => ({
  editable: () => ({
    p: ({ initialValue }: { initialValue: string }) => <p>{initialValue}</p>,
    span: ({ initialValue }: { initialValue: string }) => <span>{initialValue}</span>,
  }),
}));

jest.mock('@/lib/singleItemReverse', () => ({
  __esModule: true,
  default: () => [],
}));

jest.mock('@/features/shared/components/SingleItemReverseCard', () => ({
  __esModule: true,
  default: () => <div>reverse-card</div>,
}));

jest.mock('@/features/shared/components/SingleItemTraitsText', () => ({
  __esModule: true,
  default: () => <div>traits-text</div>,
}));

jest.mock('@/features/shared/components/SingleItemWikiHistoryDisplay', () => ({
  __esModule: true,
  default: () => <div />,
}));

jest.mock('@/features/shared/traits/filterTraitsBySingleItem', () => ({
  filterTraitsBySingleItem: () => [],
}));

jest.mock('./character-attributes/CharacterAttributesSection', () => ({
  __esModule: true,
  default: () => <div />,
}));

jest.mock('./info-displays/CharacterHistoryDisplay', () => ({
  __esModule: true,
  default: () => <div />,
}));

jest.mock('./character-relations/CharacterRelationDisplay', () => ({
  __esModule: true,
  default: () => <div />,
}));

jest.mock('./sections/CharacterSection', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <section>{children}</section>,
}));

jest.mock('./sections/CharacterSectionIndex', () => ({
  __esModule: true,
  default: () => <div />,
}));

jest.mock('./info-displays/ContentWriterDisplay', () => ({
  __esModule: true,
  default: () => <div />,
}));

jest.mock('./info-displays/CreateDateDisplay', () => ({
  __esModule: true,
  default: () => <div />,
}));

jest.mock('./knowledge-cards/KnowledgeCardManager', () => ({
  __esModule: true,
  default: () => <div />,
}));

jest.mock('./positioning-tags/PositioningTagsSection', () => ({
  __esModule: true,
  default: () => <div />,
}));

jest.mock('./skills/SkillAllocationSection', () => ({
  __esModule: true,
  default: () => <div />,
}));

jest.mock('./skills/SkillCard', () => ({
  __esModule: true,
  default: () => <div />,
}));

jest.mock('./skills/SpecialSkillsSection', () => ({
  __esModule: true,
  default: () => <div />,
}));

jest.mock('./useCharacterActions', () => ({
  useCharacterActions: () => ({
    addSecondWeapon: jest.fn(),
    exportCharacter: jest.fn(),
  }),
}));

jest.mock('./info-displays/WinRatesDisplay', () => ({
  __esModule: true,
  default: () => <div />,
}));

describe('CharacterDetails', () => {
  it('should render on the server without accessing document for the portal target', () => {
    expect(() => renderToString(<CharacterDetails />)).not.toThrow();
  });

  it('should hide own traits and reverse cards when their counts are zero', () => {
    const html = renderToString(<CharacterDetails />);

    expect(html).not.toContain('traits-text');
    expect(html).not.toContain('reverse-card');
  });
});
