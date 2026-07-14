import { fireEvent, render, screen } from '@testing-library/react';

import { ACTOR_ATTRIBUTE_KEYS, ACTOR_ATTRIBUTE_PRESENTATION } from '../attributePresentation';
import ActorAttributesSection from './ActorAttributesSection';

let mockIsDetailedView = false;

jest.mock('@/context/AppContext', () => ({
  useAppContext: () => ({ isDetailedView: mockIsDetailedView }),
}));

jest.mock('@/components/ui/Tooltip', () => {
  return function MockTooltip({
    children,
    content,
  }: {
    children: React.ReactNode;
    content: React.ReactNode;
  }) {
    return <span data-tooltip={String(content)}>{children}</span>;
  };
});

const getRankingLink = (
  container: HTMLElement,
  property: string,
  factionId: 'cat' | 'mouse'
): HTMLAnchorElement | undefined =>
  Array.from(container.querySelectorAll('a')).find((link) => {
    const url = new URL(link.href);
    return (
      url.pathname.replace(/\/$/, '') === `/ranks/${property}` &&
      url.searchParams.get('faction') === factionId
    );
  });

const getDisplayedAttributeLabels = (container: HTMLElement): string[] =>
  Array.from(container.querySelectorAll('p'), (row) => row.textContent?.split(':', 1)[0] ?? '');

describe('ActorAttributesSection', () => {
  beforeEach(() => {
    mockIsDetailedView = false;
  });

  it('should use detailed attribute tooltips in detailed mode', () => {
    mockIsDetailedView = true;

    render(<ActorAttributesSection name='汤姆' context='character' factionId='cat' />);

    expect(screen.getByText('Hp上限')).toHaveAttribute(
      'data-tooltip',
      ACTOR_ATTRIBUTE_PRESENTATION.maxHp.detailedTooltip
    );
  });

  it('should use the explicit character summary and show only applicable cat fields for Tom', () => {
    const { container } = render(
      <ActorAttributesSection name='汤姆' EnglishName='Tom' context='character' factionId='cat' />
    );

    expect(screen.queryByText('性别')).not.toBeInTheDocument();
    expect(screen.queryByText('英文名')).not.toBeInTheDocument();
    expect(screen.queryByText('跳跃高度')).not.toBeInTheDocument();
    expect(screen.queryByText('角色类型')).not.toBeInTheDocument();
    expect(screen.queryByText('物理特质')).not.toBeInTheDocument();
    expect(screen.queryByText('重力参数')).not.toBeInTheDocument();
    expect(screen.queryByText('攻击力')).not.toBeInTheDocument();
    expect(screen.getByText('跳跃速度').closest('p')).toHaveTextContent('跳跃速度: 1850/s');
    expect(getDisplayedAttributeLabels(container)).toEqual([
      'Hp上限',
      'Hp恢复',
      '移速',
      '跳跃速度',
      '爪刀CD',
      '爪刀范围',
    ]);
    expect(getRankingLink(container, 'maxHp', 'cat')).toHaveTextContent('255');
    expect(getRankingLink(container, 'jumpHeight', 'cat')).toBeUndefined();
    expect(getRankingLink(container, 'jumpSpeed', 'cat')).toBeUndefined();

    fireEvent.click(screen.getByRole('button', { name: '展开' }));

    expect(screen.getByText('性别')).toBeInTheDocument();
    expect(screen.getByText('英文名')).toBeInTheDocument();
    expect(screen.getByText('爪刀CD').closest('p')).toHaveTextContent('爪刀CD: 2.25 / 4.5 s');
    expect(screen.getByText('购物到货时间').closest('p')).toHaveTextContent('购物到货时间: 2.5s');
    expect(screen.queryByText('攻击力')).not.toBeInTheDocument();
    expect(screen.queryByText('破坏力')).not.toBeInTheDocument();
    expect(screen.queryByText('推速')).not.toBeInTheDocument();
    expect(screen.queryByText('初始道具')).not.toBeInTheDocument();
    expect(screen.queryByText('老鼠夹')).not.toBeInTheDocument();
  });

  it('should expose folding state, focus visibility, and reduced-motion styling', () => {
    render(<ActorAttributesSection name='兔子大表哥' context='object' />);

    const button = screen.getByRole('button', { name: '展开' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveClass('focus-visible:ring-2');
    expect(button.querySelector('svg')).toHaveClass('motion-reduce:transition-none');

    fireEvent.click(button);
    expect(screen.getByRole('button', { name: '收起' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('重力参数').closest('p')).toHaveTextContent('重力参数: -3203');
    expect(ACTOR_ATTRIBUTE_KEYS).toContain('gravity');
    expect(ACTOR_ATTRIBUTE_KEYS).not.toContain('jumpHeight');
    expect(ACTOR_ATTRIBUTE_KEYS).not.toContain('baseHp');
    expect(ACTOR_ATTRIBUTE_KEYS).not.toContain('shoppingCooldown');
  });

  it('should omit non-applicable summary mechanics without substitution', () => {
    render(<ActorAttributesSection name='盔甲人' context='object' />);

    expect(screen.getByText('爪刀CD').closest('p')).toHaveTextContent('爪刀CD: 命中 2 s');
    expect(screen.queryByText(/未命中/)).not.toBeInTheDocument();
    expect(screen.queryByText('爪刀范围')).not.toBeInTheDocument();
  });

  it('should emphasize a nonzero cat attack while preserving its ranking link', () => {
    const { container } = render(
      <ActorAttributesSection name='布奇' context='character' factionId='cat' />
    );

    const attackRow = screen.getByText('攻击力').closest('p');
    const attackLink = getRankingLink(container, 'attackBoost', 'cat');
    expect(getDisplayedAttributeLabels(container)).toEqual([
      'Hp上限',
      '攻击力',
      '移速',
      '跳跃速度',
      '爪刀CD',
      '爪刀范围',
    ]);
    expect(attackRow).toHaveClass('text-amber-600', 'dark:text-amber-400');
    expect(attackLink).toHaveTextContent('15');
    expect(attackLink).toHaveClass('text-blue-500', 'dark:text-sky-300');
  });

  it('should link ordinary cooldowns independently and keep special cooldowns unlinked', () => {
    const { container } = render(
      <ActorAttributesSection
        name='苏蕊'
        context='character'
        factionId='cat'
        specialClawKnifeCdHit={8}
        specialClawKnifeCdUnhit={4}
      />
    );

    const cooldownRow = screen.getByText('爪刀CD').closest('p');
    expect(getDisplayedAttributeLabels(container)).toEqual([
      'Hp上限',
      '初始道具',
      '移速',
      '跳跃速度',
      '爪刀CD',
      '爪刀范围',
    ]);
    expect(screen.getByText('初始道具').closest('p')).toHaveTextContent('初始道具: 鞭炮束');
    expect(cooldownRow).toHaveTextContent('爪刀CD: 4.9 (4) / 7 (8) s');
    expect(getRankingLink(container, 'clawKnifeCdUnhit', 'cat')).toHaveTextContent('4.9');
    expect(getRankingLink(container, 'clawKnifeCdHit', 'cat')).toHaveTextContent('7');
    expect(cooldownRow?.querySelectorAll('a')).toHaveLength(2);
  });

  it('should apply mouse ranking links only to compatible displayed mechanics', () => {
    const { container } = render(
      <ActorAttributesSection name='杰瑞' context='character' factionId='mouse' />
    );

    expect(getDisplayedAttributeLabels(container)).toEqual([
      'Hp上限',
      '推速',
      '移速',
      '跳跃速度',
      '攻击力',
      '破坏力',
    ]);

    fireEvent.click(screen.getByRole('button', { name: '展开' }));

    expect(screen.queryByText('跳跃高度')).not.toBeInTheDocument();
    expect(screen.getByText('攻击力').closest('p')).toHaveTextContent('攻击力: 15');
    expect(screen.getByText('破坏力').closest('p')).toHaveTextContent('破坏力: 1');
    expect(screen.getByText('推速').closest('p')).toHaveTextContent('推速: 5%/s');
    expect(getRankingLink(container, 'attackBoost', 'mouse')).toHaveTextContent('15');
    expect(getRankingLink(container, 'cheesePushSpeed', 'mouse')).toHaveTextContent('5');
    expect(getRankingLink(container, 'wallCrackDamageBoost', 'mouse')).toHaveTextContent('1');
    expect(screen.queryByText('爪刀范围')).not.toBeInTheDocument();
    expect(screen.queryByText('爪刀CD')).not.toBeInTheDocument();
    expect(screen.queryByText('初始道具')).not.toBeInTheDocument();
    expect(screen.queryByText('购物到货时间')).not.toBeInTheDocument();
    expect(container.querySelector('a[href*="clawKnifeCd"]')).toBeNull();
  });

  it('should keep a legitimate zero mouse attack visible', () => {
    const { container } = render(
      <ActorAttributesSection name='雪梨' context='character' factionId='mouse' />
    );

    expect(screen.getByText('攻击力').closest('p')).toHaveTextContent('攻击力: 0');
    expect(getRankingLink(container, 'attackBoost', 'mouse')).toHaveTextContent('0');
  });
});
