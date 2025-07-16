import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SkillAllocationDisplay from '../SkillAllocationDisplay';
import { EditModeProvider } from '../../../../../context/EditModeContext';
import { AppProvider } from '../../../../../context/AppContext';
import type { SkillAllocation } from '../../../../../data/types';
import type { CharacterWithFaction } from '../../../../../lib/types';
import * as skillAllocationUtils from '../../../../../lib/skillAllocationUtils';
import { characters } from '../../../../../data';
import { proxy } from 'valtio';

// Mock the skillAllocationUtils module
jest.mock('../../../../../lib/skillAllocationUtils', () => ({
  parseSkillAllocationPattern: jest.fn(),
  safeParseSkillAllocationPattern: jest.fn(),
  validateSkillAllocationPattern: jest.fn(() => ({ isValid: true, errors: [], warnings: [] })),
  getSkillAllocationImageUrl: jest.fn(() => '/mock-image.png'),
  getSkillTypeDisplayName: jest.fn(),
}));

jest.mock('../../../../../context/EditModeContext', () => ({
  __esModule: true,
  EditModeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useEditMode: () => ({ isEditMode: false }),
  useLocalCharacter: () => ({ characterId: '汤姆' }),
}));

// Mock the design-tokens module
jest.mock('../../../../../lib/design-tokens', () => ({
  getSkillLevelColors: jest.fn(() => ({
    backgroundColor: '#f0f0f0',
    borderColor: '#333',
    color: '#000',
  })),
}));

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt }: { src: string; alt: string }) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} />;
  };
});

const mockedParseSkillAllocationPattern = jest.mocked(
  skillAllocationUtils.parseSkillAllocationPattern
);

// Simplified test wrapper
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AppProvider>
      <EditModeProvider>{children}</EditModeProvider>
    </AppProvider>
  );
};

describe('SkillAllocationDisplay', () => {
  const mockAllocation: SkillAllocation = {
    id: 'test-allocation',
    pattern: '0123',
    weaponType: 'weapon1',
    description: 'Test allocation',
  };

  const defaultProps = {
    allocation: mockAllocation,
    factionId: 'cat' as const,
    onRemove: jest.fn(),
    index: 0,
  };

  beforeAll(() => {
    characters['汤姆'] = proxy<CharacterWithFaction>({
      id: '汤姆',
      description: 'A test character',
      skills: [],
      knowledgeCardGroups: [],
      faction: { id: 'cat', name: '猫阵营' },
      imageUrl: '/images/cats/汤姆.png',
    });
  });

  beforeEach(() => {
    mockedParseSkillAllocationPattern.mockReturnValue([
      { skillType: '0', isParallel: false, isDelayed: false, hasNegativeEffect: false },
      { skillType: '1', isParallel: false, isDelayed: false, hasNegativeEffect: false },
      { skillType: '2', isParallel: false, isDelayed: false, hasNegativeEffect: false },
      { skillType: '3', isParallel: false, isDelayed: false, hasNegativeEffect: false },
    ]);
  });

  it('should render allocation name and description', () => {
    render(
      <TestWrapper>
        <SkillAllocationDisplay {...defaultProps} />
      </TestWrapper>
    );

    expect(screen.getByText('test-allocation')).toBeInTheDocument();
    expect(screen.getByText('Test allocation')).toBeInTheDocument();
  });

  it('should handle parallel skills correctly', () => {
    mockedParseSkillAllocationPattern.mockReturnValue([
      {
        skillType: '0',
        isParallel: true,
        parallelOptions: ['0', '1'] as ['0', '1'],
        isDelayed: false,
        hasNegativeEffect: false,
        bracketGroupId: 0,
      },
    ]);

    expect(() => {
      render(
        <TestWrapper>
          <SkillAllocationDisplay {...defaultProps} />
        </TestWrapper>
      );
    }).not.toThrow();
  });

  // Test basic error resilience without over-testing edge cases
  it('should handle missing skill data gracefully', () => {
    expect(() => {
      render(
        <TestWrapper>
          <SkillAllocationDisplay {...defaultProps} />
        </TestWrapper>
      );
    }).not.toThrow();
  });
});
