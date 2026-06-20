import type { ReactNode } from 'react';
import { render } from '@testing-library/react';

import type { CharacterWithFaction } from '@/lib/types';
import { characters } from '@/data';

import CharacterDetailsClient from './CharacterDetailsClient';

const mockExitEditMode = jest.fn();
const mockUseEditMode = jest.fn();
const TEST_CHARACTER_ID = '__character_details_client_character__';

jest.mock('@/context/EditModeContext', () => ({
  useEditMode: () => mockUseEditMode(),
}));

jest.mock('@/hooks/useLocalEditEntity', () => ({
  useLocalCharacter: () => ({ characterId: 'Tom' }),
}));

jest.mock('@/hooks/usePageEditMode', () => ({
  usePageEditMode: () => ({
    isDirty: false,
    isPublishing: false,
    draftInfo: null,
    draftsSummary: [],
    discardChanges: jest.fn(),
    publishChanges: jest.fn(),
    getActionCount: () => 0,
  }),
}));

jest.mock('@/hooks/useSearchParamEditMode', () => ({
  useSearchParamEditMode: () => ({ exitEditMode: mockExitEditMode }),
}));

jest.mock('@/hooks/useKeyboardNavigation', () => ({
  useKeyboardNavigation: jest.fn(),
}));

jest.mock('@/context/ToastContext', () => ({
  useToast: () => ({ info: jest.fn() }),
}));

jest.mock('@/features/characters/components/character-detail', () => ({
  CharacterDetails: ({ children }: { children?: ReactNode }) => <>{children}</>,
}));

jest.mock('@/components/ui/EditModeToolbar', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/components/OnboardingTutorial', () => ({
  __esModule: true,
  default: () => null,
}));

describe('CharacterDetailsClient', () => {
  let snapshot: Record<string, unknown>;

  beforeEach(() => {
    snapshot = structuredClone(characters) as Record<string, unknown>;
    mockExitEditMode.mockReset();
    mockUseEditMode.mockReturnValue({ isEditMode: false });

    (characters as Record<string, CharacterWithFaction>)[TEST_CHARACTER_ID] = {
      id: TEST_CHARACTER_ID,
      description: 'canonical props',
      factionId: 'cat',
      imageUrl: '',
      createDate: null,
      skills: [],
      knowledgeCardGroups: [],
    } as CharacterWithFaction;
  });

  afterEach(() => {
    Object.keys(characters).forEach((key) => {
      delete (characters as Record<string, unknown>)[key];
    });
    Object.entries(snapshot).forEach(([key, value]) => {
      (characters as Record<string, unknown>)[key] = value;
    });
  });

  it('does not overwrite existing character store data when not in edit mode', () => {
    const characterStore = characters as Record<string, { description?: string }>;
    characterStore[TEST_CHARACTER_ID]!.description = 'public update';

    render(
      <CharacterDetailsClient
        character={{
          id: TEST_CHARACTER_ID,
          description: 'canonical props',
          factionId: 'cat',
          imageUrl: '',
          createDate: null,
          skills: [],
          knowledgeCardGroups: [],
        }}
      />
    );

    expect(characterStore[TEST_CHARACTER_ID]!.description).toBe('public update');
  });
});
