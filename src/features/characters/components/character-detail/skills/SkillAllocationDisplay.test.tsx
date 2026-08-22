import React from 'react';
import { render, screen } from '@testing-library/react';

import '@testing-library/jest-dom';

import type { ActiveEditRuntime } from '@/lib/edit/activeEditRuntime';
import type { CharacterWithFaction } from '@/lib/types';
import { EditModeProvider } from '@/context/EditModeContext';
import type { SkillAllocation } from '@/data/types';
import * as skillAllocationUtils from '@/features/characters/utils/skillAllocation';
import { clearTestEditRuntime, installTestEditRuntime } from '@/testUtils/editRuntime';

import SkillAllocationDisplay from './SkillAllocationDisplay';

// Mock the skillAllocationUtils module
jest.mock('@/features/characters/utils/skillAllocation', () => ({
  parseSkillAllocationPattern: jest.fn(),
  safeParseSkillAllocationPattern: jest.fn(),
  validateSkillAllocationPattern: jest.fn(() => ({ isValid: true, errors: [], warnings: [] })),
  getSkillAllocationImageUrl: jest.fn(() => '/mock-image.png'),
  getSkillTypeDisplayName: jest.fn(),
}));

jest.mock('@/context/EditModeContext', () => ({
  __esModule: true,
  EditModeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useEditMode: () => ({ isEditMode: false }),
}));

jest.mock('@/hooks/useLocalEditEntity', () => ({
  __esModule: true,
  useLocalCharacter: () => ({ characterId: '汤姆' }),
}));

// Mock the public design module used by SkillAllocationDisplay.
jest.mock('@/lib/design', () => ({
  ...jest.requireActual('@/lib/design'),
  getSkillLevelColors: jest.fn(() => ({
    backgroundColor: '#f0f0f0',
    borderColor: '#333',
    color: '#000',
  })),
}));

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt }: { src: string; alt: string }) {
    // oxlint-disable-next-line nextjs/no-img-element
    return <img src={src} alt={alt} />;
  };
});

const mockedParseSkillAllocationPattern = jest.mocked(
  skillAllocationUtils.parseSkillAllocationPattern
);

// Simplified test wrapper
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <EditModeProvider>{children}</EditModeProvider>;
};

describe('SkillAllocationDisplay', () => {
  let runtime: ActiveEditRuntime;
  let characters: ActiveEditRuntime['stores']['characters'];

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

  beforeEach(() => {
    runtime = installTestEditRuntime();
    characters = runtime.stores.characters;
    characters['汤姆'] = {
      id: '汤姆',
      description: 'A test character',
      skills: [],
      knowledgeCardGroups: [],
      imageUrl: '/images/cats/汤姆.png',
      createDate: '2018.2.8',
    } as CharacterWithFaction;
    mockedParseSkillAllocationPattern.mockReturnValue([
      { skillTypeNum: '0', isParallel: false, isDelayed: false, hasNegativeEffect: false },
      { skillTypeNum: '1', isParallel: false, isDelayed: false, hasNegativeEffect: false },
      { skillTypeNum: '2', isParallel: false, isDelayed: false, hasNegativeEffect: false },
      { skillTypeNum: '3', isParallel: false, isDelayed: false, hasNegativeEffect: false },
    ]);
  });

  afterEach(() => {
    clearTestEditRuntime(runtime);
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
        skillTypeNum: '0',
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
