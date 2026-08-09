import React from 'react';
import { render, screen } from '@testing-library/react';

import TextWithHoverTooltips from './TextWithHoverTooltips';

let mockCharacterId = '汤姆';

jest.mock('@/context/DarkModeContext', () => ({
  useDarkMode: () => [false, jest.fn()] as const,
}));

jest.mock('@/hooks/useLocalEditEntity', () => ({
  useLocalCharacter: () => ({ characterId: mockCharacterId }),
}));

jest.mock('@/components/ui/Tooltip', () => ({
  __esModule: true,
  default: ({ children, content }: { children: React.ReactNode; content: React.ReactNode }) => {
    const getTextContent = (node: React.ReactNode): string =>
      React.Children.toArray(node)
        .map((child) => {
          if (typeof child === 'string' || typeof child === 'number') {
            return String(child);
          }
          if (React.isValidElement(child)) {
            const props = child.props as { children?: React.ReactNode };
            return getTextContent(props.children);
          }
          return '';
        })
        .join('');

    return <span data-tooltip={getTextContent(content)}>{children}</span>;
  },
}));

jest.mock('@/components/GotoLink', () => ({
  __esModule: true,
  default: ({
    name,
    categoryHint,
    children,
  }: {
    name: string;
    categoryHint?: string;
    children: React.ReactNode;
  }) => (
    <a data-name={name} data-category={categoryHint}>
      {children}
    </a>
  ),
}));

describe('TextWithHoverTooltips', () => {
  beforeEach(() => {
    mockCharacterId = '汤姆';
  });

  it('renders plain text unchanged', () => {
    render(<TextWithHoverTooltips text='普通描述' />);

    expect(screen.getByText('普通描述')).toBeInTheDocument();
  });

  it('renders markdown bold text', () => {
    render(<TextWithHoverTooltips text='造成**眩晕**效果' />);

    expect(screen.getByText('眩晕')).toHaveClass(
      'box-decoration-clone',
      'bg-amber-100/70',
      'font-medium'
    );
  });

  it('renders automatic links inside markdown highlights', () => {
    render(<TextWithHoverTooltips text='**布奇**登场' />);

    const link = screen.getByText('布奇');
    expect(link).toHaveAttribute('data-name', '布奇');
    expect(link.closest('.box-decoration-clone')).toHaveClass('bg-amber-100/70');
  });

  it('preserves inline-class tokens inside markdown highlights', () => {
    render(<TextWithHoverTooltips text='**$重点$text-orange-500#**' />);

    const styledText = screen.getByText('重点');
    expect(styledText).toHaveClass('text-orange-500');
    expect(styledText.closest('.box-decoration-clone')).toHaveClass('bg-amber-100/70');
  });

  it('renders bracket tooltip text', () => {
    render(<TextWithHoverTooltips text='[短按](用于触发技能)' />);

    expect(screen.getByText('短按')).toHaveAttribute('data-tooltip', '用于触发技能');
  });

  it('renders bracket tooltips inside markdown highlights', () => {
    render(<TextWithHoverTooltips text='**[短按](用于触发技能)**' />);

    const trigger = screen.getByText('短按');
    expect(trigger).toHaveAttribute('data-tooltip', '用于触发技能');
    expect(trigger.closest('.box-decoration-clone')).toHaveClass('bg-amber-100/70');
  });

  it('renders semantic markup inside bracket-tooltip content through the same parser', () => {
    render(<TextWithHoverTooltips text='[短按](获得{隐身})' />);

    expect(screen.getByText('短按')).toHaveAttribute('data-tooltip', '获得隐身');
  });

  it('renders braced text as a goto link', () => {
    render(<TextWithHoverTooltips text='获得{主动技能}' />);

    expect(screen.getByText('主动技能')).toHaveAttribute('data-category', '技能');
    expect(screen.getByText('主动技能')).toHaveAttribute('data-name', '发怒冲刺');
  });

  it('renders numeric damage tooltip when attack boost is available', () => {
    render(<TextWithHoverTooltips text='造成{5}伤害' />);

    expect(screen.getByText('5')).toHaveClass('text-red-500');
    expect(screen.getByText(/伤害/)).toBeInTheDocument();
  });

  it('keeps addition expressions distinct from calculated damage suffix ownership', () => {
    const { container } = render(<TextWithHoverTooltips text='{5+2}伤害' />);

    expect(screen.getByText('7')).toHaveAttribute('data-tooltip', '基础伤害5+角色增伤2');
    expect(container.textContent).toBe('7伤害');
  });

  it.each(['5+2+999', '5abc+2xyz', '5+2xyz'])(
    'preserves malformed addition expression %s instead of partially evaluating it',
    (expression) => {
      render(<TextWithHoverTooltips text={`{${expression}}`} />);

      expect(screen.getByText(expression)).toHaveAttribute('data-tooltip', expression);
    }
  );

  it('classifies styled numeric markup before consuming its damage suffix', () => {
    const { container } = render(<TextWithHoverTooltips text='{$5$text-purple-500#}伤害' />);

    expect(container.textContent).toBe('5伤害');
  });

  it('renders custom class spans', () => {
    render(<TextWithHoverTooltips text='$暂未收录$italic text-gray-500#' />);

    expect(screen.getByText('暂未收录')).toHaveClass('italic', 'text-gray-500');
  });

  it('normalizes book-title brackets to goto links', () => {
    render(<TextWithHoverTooltips text='升级《主动技能》' />);

    expect(screen.getByText('主动技能')).toHaveAttribute('data-category', '技能');
    expect(screen.getByText('主动技能')).toHaveAttribute('data-name', '发怒冲刺');
  });

  it('renders knowledge card links with category hints', () => {
    render(<TextWithHoverTooltips text='携带{击晕(知识卡)}' />);

    expect(screen.getByText('击晕').closest('a')).toHaveAttribute('data-name', '击晕');
    expect(screen.getByText('击晕').closest('a')).toHaveAttribute('data-category', '知识卡');
  });

  it('preserves knowledge card links inside markdown highlights', () => {
    render(<TextWithHoverTooltips text='**{击晕(知识卡)}**' />);

    const card = screen.getByText('击晕');
    expect(card.closest('a')).toHaveAttribute('data-category', '知识卡');
    expect(card.closest('.box-decoration-clone')).toHaveClass('bg-amber-100/70');
  });

  it('renders generic goto links for non-card entries', () => {
    render(<TextWithHoverTooltips text='获得{隐身}' />);

    expect(screen.getByText('隐身')).toHaveAttribute('data-name', '隐身');
  });

  it('resolves current character expressions', () => {
    render(<TextWithHoverTooltips text='命中CD为{:clawKnifeCdHit}秒' />);

    expect(screen.getByText('4.5')).toHaveClass('text-blue-500');
  });

  it('auto-wraps other character names but not the current character', () => {
    const { container, rerender } = render(<TextWithHoverTooltips text='布奇登场' />);

    expect(screen.getByText('布奇')).toHaveAttribute('data-name', '布奇');

    rerender(<TextWithHoverTooltips text='汤姆登场' />);

    expect(container.querySelector('[data-name="汤姆"]')).not.toBeInTheDocument();
    expect(screen.getByText('汤姆登场')).toBeInTheDocument();
  });

  it('auto-wraps eligible names around existing semantic markup', () => {
    render(<TextWithHoverTooltips text='布奇造成{5*}伤害' />);

    expect(screen.getByText('布奇')).toHaveAttribute('data-name', '布奇');
  });

  it('replaces buff id placeholders before rendering', () => {
    render(<TextWithHoverTooltips text='状态：!{2}' />);

    expect(screen.getByText('冰冻-1')).toHaveClass('text-orange-500');
    expect(screen.getByText('眩晕')).toHaveAttribute('data-name', '眩晕');
  });

  it('renders base-only damage with character attack boost in the tooltip', () => {
    mockCharacterId = '布奇';

    render(<TextWithHoverTooltips text='造成{5*}伤害' />);

    expect(screen.getByText('20')).toHaveClass('text-red-500');
    expect(screen.getByText('20').closest('[data-tooltip]')).toHaveAttribute(
      'data-tooltip',
      expect.stringContaining('基础伤害5+角色增伤15')
    );
  });

  it('renders tagged damage notes and avoids duplicate trailing damage text', () => {
    const { container } = render(<TextWithHoverTooltips text='造成{5*,无来源}伤害' />);

    expect(screen.getByText('无来源')).toBeInTheDocument();
    expect(screen.getByText('5').closest('[data-tooltip]')).toHaveAttribute(
      'data-tooltip',
      expect.stringContaining('该伤害无来源')
    );
    expect(container.textContent).toBe('造成5无来源伤害');
  });

  it.each([
    ['**{5*}伤害**', '5伤害'],
    ['**{5*}**伤害', '5伤害'],
    ['**{_20*}**伤害', '20伤害'],
  ])('renders highlighted damage suffixes exactly once for %s', (text, expectedText) => {
    const { container } = render(<TextWithHoverTooltips text={text} />);

    expect(container.textContent).toBe(expectedText);
    expect(container.querySelector('.box-decoration-clone')).toHaveTextContent(expectedText);
  });

  it('renders wall crack damage tooltips', () => {
    render(<TextWithHoverTooltips text='对墙缝造成{_20*}伤害' />);

    expect(screen.getByText('20')).toHaveClass('text-red-500');
    expect(screen.getByText('20').closest('[data-tooltip]')).toHaveAttribute(
      'data-tooltip',
      expect.stringContaining('基础墙缝伤害20')
    );
  });

  it('highlights quoted text and standalone numbers/operators', () => {
    render(<TextWithHoverTooltips text='“速度+10%”外加5' />);

    expect(screen.getByText('速度+10%')).toHaveClass('text-orange-500');
    expect(screen.getByText('5')).toHaveClass('text-blue-500', 'dark:text-sky-300');
  });

  it('does not reuse highlight keys after braced buff fields split text', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    try {
      render(<TextWithHoverTooltips text='{移速}×0.7；{跳跃能力}×0.9；{视野范围缩放}×1.2' />);

      const duplicateKeyMessages = consoleErrorSpy.mock.calls.filter(([message]) =>
        String(message).includes('Encountered two children with the same key')
      );
      expect(duplicateKeyMessages).toHaveLength(0);
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });
});
