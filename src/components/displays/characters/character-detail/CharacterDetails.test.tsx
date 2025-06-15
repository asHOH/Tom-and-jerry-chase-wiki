import React from 'react';
import { render, screen } from '@testing-library/react';
import CharacterDetails from './CharacterDetails';
import type { CharacterWithFaction } from '@/lib/types';
import type { Skill } from '@/data/types';

// Mock the external dependencies
jest.mock('../../../../lib/tooltipUtils', () => ({
  getTooltipContent: jest.fn((property: string) => `${property} tooltip`),
  getPositioningTagTooltipContent: jest.fn((tagName: string) => `${tagName} positioning tooltip`),
}));

jest.mock('../../../../lib/design-tokens', () => ({
  getPositioningTagColors: jest.fn(() => ({
    color: '#000000',
    backgroundColor: '#ffffff',
  })),
  getPositioningTagContainerColor: jest.fn(() => 'bg-gray-100'),
  getSkillTypeColors: jest.fn(() => ({
    color: '#000000',
    backgroundColor: '#ffffff',
  })),
  getSkillLevelColors: jest.fn(() => ({
    color: '#000000',
    backgroundColor: '#ffffff',
  })),
  getSkillLevelContainerColor: jest.fn(() => 'bg-gray-100'),
}));

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({
    src,
    alt,
    width,
    height,
    ...props
  }: {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    [key: string]: unknown;
  }) {
    // Filter out Next.js specific props that shouldn't be passed to DOM
    const {
      unoptimized,
      priority,
      loading,
      quality,
      sizes,
      fill,
      placeholder,
      blurDataURL,
      onLoad,
      onLoadingComplete,
      onError,
      ...domProps
    } = props;

    // Consume the filtered props to avoid unused variable warnings
    void unoptimized;
    void priority;
    void loading;
    void quality;
    void sizes;
    void fill;
    void placeholder;
    void blurDataURL;
    void onLoad;
    void onLoadingComplete;
    void onError;

    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} width={width} height={height} {...domProps} />
    );
  };
});

// Mock the Tooltip component
jest.mock('../../../ui/Tooltip', () => {
  return function MockTooltip({
    children,
    content,
  }: {
    children: React.ReactNode;
    content: string;
  }) {
    // Use span instead of div to avoid nesting issues in p elements
    return <span data-tooltip={content}>{children}</span>;
  };
});

// Mock the Tag component
jest.mock('../../../ui/Tag', () => {
  return function MockTag({ children }: { children: React.ReactNode }) {
    return <span className='tag'>{children}</span>;
  };
});

// Mock the SkillAllocationDisplay component
jest.mock('./SkillAllocationDisplay', () => {
  return function MockSkillAllocationDisplay({ allocation }: { allocation: { id: string } }) {
    return <div data-testid='skill-allocation'>{allocation.id}</div>;
  };
});

describe('CharacterDetails', () => {
  const mockSkills: Skill[] = [
    {
      id: 'test-active',
      name: '测试主动技能',
      type: 'ACTIVE',
      description: '主动技能描述',
      detailedDescription: '详细主动技能描述',
      skillLevels: [
        {
          level: 1,
          description: '一级效果',
          cooldown: 10,
        },
        {
          level: 2,
          description: '二级效果',
          cooldown: 8,
        },
      ],
    },
    {
      id: 'test-passive',
      name: '测试被动技能',
      type: 'PASSIVE',
      skillLevels: [
        {
          level: 1,
          description: '被动效果',
        },
      ],
    },
  ];

  const mockCharacter: CharacterWithFaction = {
    id: '测试角色',
    factionId: 'cat',
    description: '这是一个测试角色',
    imageUrl: '/test-image.png',
    faction: {
      id: 'cat',
      name: '猫阵营',
    },
    maxHp: 200,
    hpRecovery: 2.5,
    moveSpeed: 750,
    jumpHeight: 420,
    clawKnifeCdHit: 4.5,
    clawKnifeCdUnhit: 2.3,
    clawKnifeRange: 300,
    catPositioningTags: [
      {
        tagName: '进攻',
        isMinor: false,
        description: '擅长进攻',
        additionalDescription: '进攻能力很强',
      },
    ],
    skillAllocations: [
      {
        id: '测试加点',
        pattern: '121220001',
        weaponType: 'weapon1',
        description: '测试加点方案',
      },
    ],
    skills: mockSkills,
    knowledgeCardGroups: [
      ['S-击晕', 'A-熊熊燃烧', 'A-穷追猛打', 'B-皮糙肉厚'],
      ['S-击晕', 'A-熊熊燃烧', 'A-长爪', 'B-皮糙肉厚'],
    ],
  };
  it('should render character basic information', () => {
    render(<CharacterDetails character={mockCharacter} />);

    expect(screen.getByText('测试角色')).toBeTruthy();
    expect(screen.getByText('(猫阵营)')).toBeTruthy();
    expect(screen.getByText('这是一个测试角色')).toBeTruthy();
  });

  it('should render character attributes', () => {
    render(<CharacterDetails character={mockCharacter} />);

    expect(screen.getByText(/Hp上限/)).toBeTruthy();
    expect(screen.getByText(/200/)).toBeTruthy();
    expect(screen.getByText(/Hp恢复/)).toBeTruthy();
    expect(screen.getByText(/2.5/)).toBeTruthy();
    expect(screen.getByText(/移速/)).toBeTruthy();
    expect(screen.getByText(/750/)).toBeTruthy();
  });

  it('should render cat-specific attributes', () => {
    render(<CharacterDetails character={mockCharacter} />);

    expect(screen.getByText(/爪刀CD/)).toBeTruthy();
    expect(screen.getByText(/2.3 \/ 4.5 秒/)).toBeTruthy();
    expect(screen.getByText(/爪刀范围/)).toBeTruthy();
    expect(screen.getByText(/300/)).toBeTruthy();
  });

  it('should render positioning tags', () => {
    render(<CharacterDetails character={mockCharacter} />);

    expect(screen.getByText('定位')).toBeTruthy();
    expect(screen.getByText('进攻')).toBeTruthy();
    expect(screen.getByText('擅长进攻')).toBeTruthy();
  });

  it('should render additional description in detailed view', () => {
    render(<CharacterDetails character={mockCharacter} isDetailedView={true} />);

    expect(screen.getByText('进攻能力很强')).toBeTruthy();
  });

  it('should render skill allocations', () => {
    render(<CharacterDetails character={mockCharacter} />);

    expect(screen.getByText('推荐加点')).toBeTruthy();
    expect(screen.getByTestId('skill-allocation')).toBeTruthy();
    expect(screen.getByText('测试加点')).toBeTruthy();
  });

  it('should render skills section', () => {
    render(<CharacterDetails character={mockCharacter} />);

    expect(screen.getByText('技能描述')).toBeTruthy();
    expect(screen.getByText(/主动 · 测试主动技能/)).toBeTruthy();
    expect(screen.getByText(/被动 · 测试被动技能/)).toBeTruthy();
  });

  it('should render skill levels', () => {
    render(<CharacterDetails character={mockCharacter} />);

    expect(screen.getAllByText(/Lv\. 1:/).length).toBeGreaterThan(0);
    expect(screen.getByText('一级效果')).toBeTruthy();
    expect(screen.getByText(/Lv\. 2:/)).toBeTruthy();
    expect(screen.getByText('二级效果')).toBeTruthy();
  });

  it('should use detailed descriptions in detailed view', () => {
    render(<CharacterDetails character={mockCharacter} isDetailedView={true} />);

    expect(screen.getByText('详细主动技能描述')).toBeTruthy();
  });

  it('should render knowledge card groups', () => {
    render(<CharacterDetails character={mockCharacter} />);

    expect(screen.getByText('推荐知识卡组')).toBeTruthy();
    expect(screen.getByText('1')).toBeTruthy(); // First group number
    expect(screen.getByText('2')).toBeTruthy(); // Second group number

    // Check for specific cards in the first group
    expect(screen.getByAltText('S-击晕')).toBeTruthy();
    expect(screen.getByAltText('A-熊熊燃烧')).toBeTruthy();
    expect(screen.getByAltText('A-穷追猛打')).toBeTruthy();
    expect(screen.getByAltText('B-皮糙肉厚')).toBeTruthy();

    // Check for specific cards in the second group
    expect(screen.getByAltText('A-长爪')).toBeTruthy();

    // Verify image sources
    expect(screen.getByAltText('S-击晕')).toHaveProperty('src', '/images/catCards/S-击晕.png');
    expect(screen.getByAltText('A-熊熊燃烧')).toHaveProperty(
      'src',
      '/images/catCards/A-熊熊燃烧.png'
    );
  });

  it('should render knowledge card tooltips with correct content', () => {
    render(<CharacterDetails character={mockCharacter} />);

    expect(screen.getByAltText('S-击晕').closest('span')).toHaveProperty('data-tooltip', '击晕');
    expect(screen.getByAltText('A-熊熊燃烧').closest('span')).toHaveProperty(
      'data-tooltip',
      '熊熊燃烧'
    );
  });

  it('should not render knowledge card groups section if knowledgeCardGroups is empty', () => {
    const characterWithoutKnowledgeCards = { ...mockCharacter, knowledgeCardGroups: [] };
    render(<CharacterDetails character={characterWithoutKnowledgeCards} />);
    expect(screen.queryByText('推荐知识卡组')).toBeNull();
  });

  it('should render mouse character correctly', () => {
    const mouseCharacter: CharacterWithFaction = {
      ...mockCharacter,
      id: '测试老鼠',
      factionId: 'mouse',
      faction: {
        id: 'mouse',
        name: '鼠阵营',
      },
      cheesePushSpeed: 2.5,
      wallCrackDamageBoost: 1.5,
      mousePositioningTags: [
        {
          tagName: '奶酪',
          isMinor: false,
          description: '擅长推奶酪',
          additionalDescription: '推奶酪能力很强',
        },
      ],
      knowledgeCardGroups: [['A-冲冠一怒', 'A-团队领袖']],
    };

    render(<CharacterDetails character={mouseCharacter} />);

    expect(screen.getByText('测试老鼠')).toBeTruthy();
    expect(screen.getByText('(鼠阵营)')).toBeTruthy();
    expect(screen.getByText(/推速/)).toBeTruthy();
    expect(
      screen.getByText((_content, element) => {
        // Look for the specific p element that contains push speed with unit
        const isTargetElement =
          element?.tagName === 'P' &&
          element?.textContent?.includes('推速') &&
          element?.textContent?.includes('%/秒');
        return Boolean(isTargetElement);
      })
    ).toBeTruthy();
    expect(screen.getByText(/墙缝增伤/)).toBeTruthy();
    expect(screen.getByText(/1.5/)).toBeTruthy();
    expect(screen.getByText('奶酪')).toBeTruthy();

    // Check mouse knowledge cards
    expect(screen.getByText('推荐知识卡组')).toBeTruthy();
    expect(screen.getByAltText('A-冲冠一怒')).toBeTruthy();
    expect(screen.getByAltText('A-冲冠一怒')).toHaveProperty(
      'src',
      '/images/mouseCards/A-冲冠一怒.png'
    );
    expect(screen.getByAltText('A-冲冠一怒').closest('span')).toHaveProperty(
      'data-tooltip',
      '冲冠一怒'
    );
  });
});
