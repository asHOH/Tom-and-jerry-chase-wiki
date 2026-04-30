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
  default: () => <div />,
}));

jest.mock('@/features/shared/components/SingleItemTraitsText', () => ({
  __esModule: true,
  default: () => <div />,
}));

jest.mock('@/features/shared/components/SingleItemWikiHistoryDisplay', () => ({
  __esModule: true,
  default: () => <div />,
}));

jest.mock('@/features/shared/traits/filterTraitsBySingleItem', () => ({
  filterTraitsBySingleItem: () => [],
}));

jest.mock('./CharacterAttributesSection', () => ({
  __esModule: true,
  default: () => <div />,
}));

jest.mock('./CharacterHistoryDisplay', () => ({
  __esModule: true,
  default: () => <div />,
}));

jest.mock('./CharacterRelationDisplay', () => ({
  __esModule: true,
  default: () => <div />,
}));

jest.mock('./CharacterSection', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <section>{children}</section>,
}));

jest.mock('./CharacterSectionIndex', () => ({
  __esModule: true,
  default: () => <div />,
}));

jest.mock('./ContentWriterDisplay', () => ({
  __esModule: true,
  default: () => <div />,
}));

jest.mock('./CreateDateDisplay', () => ({
  __esModule: true,
  default: () => <div />,
}));

jest.mock('./KnowledgeCardManager', () => ({
  __esModule: true,
  default: () => <div />,
}));

jest.mock('./PositioningTagsSection', () => ({
  __esModule: true,
  default: () => <div />,
}));

jest.mock('./SkillAllocationSection', () => ({
  __esModule: true,
  default: () => <div />,
}));

jest.mock('./SkillCard', () => ({
  __esModule: true,
  default: () => <div />,
}));

jest.mock('./SpecialSkillsSection', () => ({
  __esModule: true,
  default: () => <div />,
}));

jest.mock('./useCharacterActions', () => ({
  useCharacterActions: () => ({
    addSecondWeapon: jest.fn(),
    exportCharacter: jest.fn(),
  }),
}));

jest.mock('./WinRatesDisplay', () => ({
  __esModule: true,
  default: () => <div />,
}));

describe('CharacterDetails', () => {
  it('should render on the server without accessing document for the portal target', () => {
    expect(() => renderToString(<CharacterDetails />)).not.toThrow();
  });
});
