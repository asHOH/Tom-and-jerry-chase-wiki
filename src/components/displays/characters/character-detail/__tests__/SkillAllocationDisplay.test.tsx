import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SkillAllocationDisplay from '../SkillAllocationDisplay';
import type { SkillAllocation } from '../../../../../data/types';
import * as skillAllocationUtils from '../../../../../lib/skillAllocationUtils';

// Mock the skillAllocationUtils module
jest.mock('../../../../../lib/skillAllocationUtils', () => ({
  parseSkillAllocationPattern: jest.fn(),
  getSkillAllocationImageUrl: jest.fn(() => '/mock-image.png'),
  getSkillTypeDisplayName: jest.fn(),
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
  return function MockImage({ alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={alt} {...props} />;
  };
});

describe('SkillAllocationDisplay Error Handling', () => {
  const mockAllocation: SkillAllocation = {
    id: 'test-allocation',
    pattern: '[01]23',
    weaponType: 'weapon1',
    description: 'Test allocation',
  };

  const mockCharacterSkills = [
    { type: 'PASSIVE' as const, name: '被动技能', imageUrl: '/passive.png' },
    { type: 'ACTIVE' as const, name: '主动技能', imageUrl: '/active.png' },
    { type: 'WEAPON1' as const, name: '武器1', imageUrl: '/weapon1.png' },
    { type: 'WEAPON2' as const, name: '武器2', imageUrl: '/weapon2.png' },
  ];

  const defaultProps = {
    allocation: mockAllocation,
    characterName: '汤姆',
    factionId: 'cat' as const,
    characterSkills: mockCharacterSkills,
    isDetailed: false,
  };

  const mockedParseSkillAllocationPattern = jest.mocked(
    skillAllocationUtils.parseSkillAllocationPattern
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Invalid Parallel Options Error Handling', () => {
    it('should handle invalid parallel options gracefully', () => {
      // Mock parseSkillAllocationPattern to return invalid parallel options
      mockedParseSkillAllocationPattern.mockReturnValue([
        {
          skillType: '0',
          isParallel: true,
          // TypeScript will complain, but we're testing runtime error handling
          parallelOptions: [undefined as unknown as '0', '1'],
          isDelayed: false,
          hasNegativeEffect: false,
        },
      ]);

      // This should throw an error due to invalid parallel options
      expect(() => {
        render(<SkillAllocationDisplay {...defaultProps} />);
      }).toThrow('Invalid parallel options');
    });

    it('should handle missing second parallel option', () => {
      mockedParseSkillAllocationPattern.mockReturnValue([
        {
          skillType: '0',
          isParallel: true,
          parallelOptions: ['0'] as unknown as ['0', '1'], // Invalid: missing second option
          isDelayed: false,
          hasNegativeEffect: false,
        },
      ]);

      expect(() => {
        render(<SkillAllocationDisplay {...defaultProps} />);
      }).toThrow('Invalid parallel options');
    });

    it('should handle empty parallel options array', () => {
      mockedParseSkillAllocationPattern.mockReturnValue([
        {
          skillType: '0',
          isParallel: true,
          parallelOptions: [] as unknown as ['0', '1'], // Invalid: empty array
          isDelayed: false,
          hasNegativeEffect: false,
        },
      ]);

      expect(() => {
        render(<SkillAllocationDisplay {...defaultProps} />);
      }).toThrow('Invalid parallel options');
    });
  });

  describe('Graceful Degradation', () => {
    it('should render without crashing when skill images are missing', () => {
      mockedParseSkillAllocationPattern.mockReturnValue([
        {
          skillType: '1',
          isParallel: false,
          isDelayed: false,
          hasNegativeEffect: false,
        },
      ]);

      const propsWithoutSkillImages = {
        ...defaultProps,
        characterSkills: [
          { type: 'ACTIVE' as const, name: '主动技能' }, // No imageUrl
        ],
      };

      expect(() => {
        render(<SkillAllocationDisplay {...propsWithoutSkillImages} />);
      }).not.toThrow();

      expect(screen.getByText('test-allocation')).toBeInTheDocument();
    });

    it('should handle missing skill name gracefully', () => {
      mockedParseSkillAllocationPattern.mockReturnValue([
        {
          skillType: '1',
          isParallel: false,
          isDelayed: false,
          hasNegativeEffect: false,
        },
      ]);

      // For this test, we'll use an empty skills array to test the fallback behavior
      const propsWithoutSkillName = {
        ...defaultProps,
        characterSkills: [],
      };

      expect(() => {
        render(<SkillAllocationDisplay {...propsWithoutSkillName} />);
      }).not.toThrow();
    });

    it('should handle empty allocation pattern', () => {
      mockedParseSkillAllocationPattern.mockReturnValue([]);

      const propsWithEmptyPattern = {
        ...defaultProps,
        allocation: { ...mockAllocation, pattern: '' },
      };

      expect(() => {
        render(<SkillAllocationDisplay {...propsWithEmptyPattern} />);
      }).not.toThrow();

      expect(screen.getByText('test-allocation')).toBeInTheDocument();
    });

    it('should handle missing descriptions gracefully', () => {
      mockedParseSkillAllocationPattern.mockReturnValue([
        {
          skillType: '1',
          isParallel: false,
          isDelayed: false,
          hasNegativeEffect: false,
        },
      ]);

      const propsWithoutDescription = {
        ...defaultProps,
        allocation: {
          id: 'test-allocation',
          pattern: '1',
          weaponType: 'weapon1' as const,
          description: '', // Empty description
        },
      };

      expect(() => {
        render(<SkillAllocationDisplay {...propsWithoutDescription} />);
      }).not.toThrow();

      expect(screen.getByText('test-allocation')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle valid parallel options correctly', () => {
      mockedParseSkillAllocationPattern.mockReturnValue([
        {
          skillType: '0',
          isParallel: true,
          parallelOptions: ['0', '1'], // Valid parallel options
          isDelayed: false,
          hasNegativeEffect: false,
        },
      ]);

      expect(() => {
        render(<SkillAllocationDisplay {...defaultProps} />);
      }).not.toThrow();

      expect(screen.getByText('test-allocation')).toBeInTheDocument();
    });

    it('should handle mixed parallel and normal skills', () => {
      mockedParseSkillAllocationPattern.mockReturnValue([
        {
          skillType: '0',
          isParallel: true,
          parallelOptions: ['0', '1'],
          isDelayed: false,
          hasNegativeEffect: false,
        },
        {
          skillType: '2',
          isParallel: false,
          isDelayed: false,
          hasNegativeEffect: false,
        },
      ]);

      expect(() => {
        render(<SkillAllocationDisplay {...defaultProps} />);
      }).not.toThrow();

      expect(screen.getByText('test-allocation')).toBeInTheDocument();
    });
  });
});
