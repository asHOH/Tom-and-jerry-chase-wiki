import { createElement, type AnchorHTMLAttributes, type ImgHTMLAttributes } from 'react';
import { render, screen } from '@testing-library/react';

import type { GotoDisambiguationCandidate } from '@/lib/types';

import PreviewCard, { type GotoPreviewCardProps } from './PreviewCard';

jest.mock('@/components/Link', () => ({
  __esModule: true,
  default: (props: AnchorHTMLAttributes<HTMLAnchorElement>) => createElement('a', props),
}));
jest.mock('@/components/Image', () => ({
  __esModule: true,
  default: (props: ImgHTMLAttributes<HTMLImageElement>) => createElement('img', props),
}));

const candidate: GotoDisambiguationCandidate = {
  url: '/items/example/',
  type: 'item',
  name: '候选道具',
  categoryLabel: '道具',
  kindDescription: '同名条目',
};
const suggestion: GotoDisambiguationCandidate = {
  ...candidate,
  url: '/buffs/example/',
  type: 'buff',
  name: '相关状态',
  categoryLabel: '状态',
  kindDescription: '别名匹配',
};
const base: GotoPreviewCardProps = {
  url: '/goto/example/',
  name: '测试条目',
  type: 'item',
};

it.each([
  { type: 'disambiguation', expected: candidate, heading: '测试条目可能指：' },
  { type: 'item', expected: suggestion, heading: '你可能还想看：' },
])(
  'renders only the appropriate $type links in a focusable preview group',
  ({ type, expected, heading }) => {
    const { container } = render(
      <PreviewCard
        {...base}
        type={type}
        description='备用描述'
        candidates={[candidate]}
        suggestions={[suggestion]}
      />
    );
    const group = screen.getByRole('group', {
      name: `${type === 'item' ? '道具' : '消歧义'}: 测试条目`,
    });
    expect(group).toHaveAttribute('tabindex', '0');
    expect(group.firstElementChild).toHaveClass('border-border', 'border', 'bg-surface');
    expect(group.firstElementChild).not.toHaveClass('cursor-pointer');
    expect(group.firstElementChild).not.toHaveClass('hover:shadow-md');
    expect(screen.getByText(heading)).toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(
      screen.getByRole('link', { name: `前往：${expected.name}（${expected.categoryLabel}）` })
    ).toHaveAttribute('href', expected.url);
    expect(screen.getByText(`（${expected.kindDescription}）`)).toHaveClass(
      'text-muted-foreground'
    );
    expect(screen.queryByTitle('备用描述') !== null).toBe(type === 'item');
    expect(container.querySelector('a a')).toBeNull();
  }
);

it.each([undefined, []])(
  'uses the description for disambiguation with candidates %j',
  (candidates) => {
    render(
      <PreviewCard
        {...base}
        type='disambiguation'
        description='备用描述'
        {...(candidates ? { candidates } : {})}
        suggestions={[suggestion]}
      />
    );
    expect(screen.getByTitle('备用描述')).toHaveTextContent('备用描述');
    expect(screen.queryByRole('link')).toBeNull();
  }
);

it.each([
  { imageUrl: '/skill.png', hideImage: false, visible: true },
  { imageUrl: '/skill.png', hideImage: true, visible: false },
  { imageUrl: '', hideImage: false, visible: false },
])('preserves skill title and owner with image visible=$visible', ({ visible, ...imageProps }) => {
  render(
    <PreviewCard
      {...base}
      {...imageProps}
      type='character-skill'
      ownerName='汤姆'
      ownerFactionId='cat'
      skillLevel={2}
    />
  );
  expect(screen.getByText('2级测试条目')).toHaveClass('truncate', 'font-bold');
  expect(screen.getByText('（猫‐汤姆）').textContent).toBe('\u00a0\u00a0（猫‐汤姆）');
  expect(screen.getByTitle('测试条目')).toHaveClass(
    ...(visible ? ['mb-1', 'w-full', 'min-w-0'] : ['min-w-0', 'flex-1'])
  );
  expect(screen.getByText('技能').classList.contains('mb-2')).toBe(visible);
  expect(screen.queryByRole('img') !== null).toBe(visible);
  if (visible)
    expect(screen.getByRole('img', { name: '测试条目' })).toHaveAttribute('src', '/skill.png');
});

it('uses faction labels and hides the skill owner for characters', () => {
  render(
    <PreviewCard {...base} type='character' factionId='mouse' ownerName='汤姆' skillLevel={2} />
  );
  expect(screen.getByText('鼠角色')).toBeInTheDocument();
  expect(screen.getByText('测试条目')).toBeInTheDocument();
  expect(screen.queryByText(/汤姆/)).toBeNull();
});

it.each<{ props: Partial<GotoPreviewCardProps>; expected: string; preserveWhitespace: boolean }>([
  {
    props: { description: '  普通描述\n第二行  ' },
    expected: '  普通描述\n第二行  ',
    preserveWhitespace: true,
  },
  {
    props: {
      type: 'character-skill',
      skillType: 'passive',
      description: '基础描述',
      skillLevelDescription: ' 等级描述 ',
    },
    expected: ' 等级描述 ',
    preserveWhitespace: false,
  },
  {
    props: {
      type: 'character-skill',
      skillType: 'passive',
      description: '基础描述',
      skillLevelDescription: ' \n ',
    },
    expected: '基础描述',
    preserveWhitespace: false,
  },
  {
    props: {
      type: 'character-skill',
      skillType: 'active',
      description: ' 基础描述 ',
      skillLevel: 2,
      skillLevelDescription: '等级描述',
    },
    expected: '基础描述 \nLv. 2: 等级描述',
    preserveWhitespace: false,
  },
  {
    props: {
      type: 'character-skill',
      skillType: 'weapon1',
      description: '基础描述',
      skillLevelDescription: '等级描述',
    },
    expected: '基础描述',
    preserveWhitespace: false,
  },
  {
    props: {
      type: 'character-skill',
      skillType: 'weapon2',
      skillLevel: 0,
      skillLevelDescription: '等级描述',
    },
    expected: 'Lv. 0: 等级描述',
    preserveWhitespace: false,
  },
])('preserves description formatting for $props', ({ props, expected, preserveWhitespace }) => {
  render(<PreviewCard {...base} {...props} />);
  const description = screen.getByTitle(expected, { normalizer: (value) => value });
  expect(description.textContent).toBe(expected);
  expect(description.classList.contains('whitespace-pre-wrap')).toBe(preserveWhitespace);
});

it.each([
  {},
  { type: 'character-skill', skillType: 'passive' },
  { type: 'character-skill', skillType: 'active' },
] satisfies Partial<GotoPreviewCardProps>[])('omits empty descriptions for %j', (props) => {
  const { container } = render(<PreviewCard {...base} {...props} />);
  expect(container.querySelector('.line-clamp-3')).toBeNull();
});
