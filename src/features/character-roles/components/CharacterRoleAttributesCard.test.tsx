import { fireEvent, render, screen } from '@testing-library/react';

import CharacterRoleAttributesCard from './CharacterRoleAttributesCard';

describe('CharacterRoleAttributesCard', () => {
  it('should use the explicit character summary and hide character-only fields', () => {
    render(
      <CharacterRoleAttributesCard
        name='汤姆'
        EnglishName='Tom'
        context='character'
        factionId='cat'
      />
    );

    expect(screen.getByText('性别')).toBeInTheDocument();
    expect(screen.getByText('英文名')).toBeInTheDocument();
    expect(screen.getByText('跳跃高度')).toBeInTheDocument();
    expect(screen.queryByText('角色类型')).not.toBeInTheDocument();
    expect(screen.queryByText('物理特质')).not.toBeInTheDocument();
    expect(screen.queryByText('重力参数')).not.toBeInTheDocument();
    expect(screen.queryByText('攻击力')).not.toBeInTheDocument();
  });

  it('should expose folding state, focus visibility, and reduced-motion styling', () => {
    render(<CharacterRoleAttributesCard name='兔子大表哥' context='object' />);

    const button = screen.getByRole('button', { name: '展开全部' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveClass('focus-visible:ring-2');
    expect(button.querySelector('svg')).toHaveClass('motion-reduce:transition-none');

    fireEvent.click(button);
    expect(screen.getByRole('button', { name: '收起' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('重力参数')).toBeInTheDocument();
    expect(screen.getByText('跳跃高度')).toBeInTheDocument();
  });

  it('should omit non-applicable summary mechanics without substitution', () => {
    render(<CharacterRoleAttributesCard name='盔甲人' context='object' />);

    expect(screen.getByText('命中 2 秒')).toBeInTheDocument();
    expect(screen.queryByText(/未命中/)).not.toBeInTheDocument();
    expect(screen.queryByText('攻击范围')).not.toBeInTheDocument();
  });
});
