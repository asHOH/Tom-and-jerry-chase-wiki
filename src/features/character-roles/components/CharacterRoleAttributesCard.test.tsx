import { fireEvent, render, screen } from '@testing-library/react';

import { CHARACTER_ROLE_ATTRIBUTE_KEYS } from '../tooltips';
import CharacterRoleAttributesCard from './CharacterRoleAttributesCard';

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

describe('CharacterRoleAttributesCard', () => {
  it('should use the explicit character summary and hide character-only fields', () => {
    const { container } = render(
      <CharacterRoleAttributesCard
        name='汤姆'
        EnglishName='Tom'
        context='character'
        factionId='cat'
      />
    );

    expect(screen.getByText('性别')).toBeInTheDocument();
    expect(screen.getByText('英文名')).toBeInTheDocument();
    expect(screen.queryByText('跳跃高度')).not.toBeInTheDocument();
    expect(screen.queryByText('角色类型')).not.toBeInTheDocument();
    expect(screen.queryByText('物理特质')).not.toBeInTheDocument();
    expect(screen.queryByText('重力参数')).not.toBeInTheDocument();
    expect(screen.queryByText('攻击力')).not.toBeInTheDocument();
    expect(getRankingLink(container, 'maxHp', 'cat')).toHaveTextContent('255');
    expect(getRankingLink(container, 'jumpHeight', 'cat')).toBeUndefined();
    expect(getRankingLink(container, 'jumpSpeed', 'cat')).toBeUndefined();
  });

  it('should expose folding state, focus visibility, and reduced-motion styling', () => {
    render(<CharacterRoleAttributesCard name='兔子大表哥' context='object' />);

    const button = screen.getByRole('button', { name: '展开' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveClass('focus-visible:ring-2');
    expect(button.querySelector('svg')).toHaveClass('motion-reduce:transition-none');

    fireEvent.click(button);
    expect(screen.getByRole('button', { name: '收起' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('重力参数').closest('p')).toHaveTextContent('重力参数: -3203');
    expect(CHARACTER_ROLE_ATTRIBUTE_KEYS).toContain('gravity');
    expect(CHARACTER_ROLE_ATTRIBUTE_KEYS).not.toContain('jumpHeight');
    expect(CHARACTER_ROLE_ATTRIBUTE_KEYS).not.toContain('baseHp');
    expect(CHARACTER_ROLE_ATTRIBUTE_KEYS).not.toContain('shoppingCooldown');
  });

  it('should omit non-applicable summary mechanics without substitution', () => {
    render(<CharacterRoleAttributesCard name='盔甲人' context='object' />);

    expect(screen.getByText('爪刀CD').closest('p')).toHaveTextContent('爪刀CD: 命中 2 秒');
    expect(screen.queryByText(/未命中/)).not.toBeInTheDocument();
    expect(screen.queryByText('爪刀范围')).not.toBeInTheDocument();
  });

  it('should link ordinary cooldowns independently and keep special cooldowns unlinked', () => {
    const { container } = render(
      <CharacterRoleAttributesCard
        name='苏蕊'
        context='character'
        factionId='cat'
        specialClawKnifeCdHit={8}
        specialClawKnifeCdUnhit={4}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '展开' }));

    const cooldownRow = screen.getByText('爪刀CD').closest('p');
    expect(cooldownRow).toHaveTextContent('爪刀CD: 未命中 4.9（特殊 4）秒 / 命中 7（特殊 8）秒');
    expect(getRankingLink(container, 'clawKnifeCdUnhit', 'cat')).toHaveTextContent('4.9');
    expect(getRankingLink(container, 'clawKnifeCdHit', 'cat')).toHaveTextContent('7');
    expect(cooldownRow?.querySelectorAll('a')).toHaveLength(2);
  });

  it('should apply mouse ranking links only to compatible displayed mechanics', () => {
    const { container } = render(
      <CharacterRoleAttributesCard name='杰瑞' context='character' factionId='mouse' />
    );

    fireEvent.click(screen.getByRole('button', { name: '展开' }));

    expect(screen.queryByText('跳跃高度')).not.toBeInTheDocument();
    expect(getRankingLink(container, 'cheesePushSpeed', 'mouse')).toHaveTextContent('5');
    expect(getRankingLink(container, 'wallCrackDamageBoost', 'mouse')).toHaveTextContent('1');
    expect(container.querySelector('a[href*="clawKnifeCd"]')).toBeNull();
  });
});
