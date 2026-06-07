import React from 'react';
import { render, screen } from '@testing-library/react';

import TextWithHoverTooltips from './TextWithHoverTooltips';

jest.mock('@/context/DarkModeContext', () => ({
  useDarkMode: () => [false, jest.fn()] as const,
}));

jest.mock('@/hooks/useLocalEditEntity', () => ({
  useLocalCharacter: () => ({ characterId: '汤姆' }),
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
  it('renders plain text unchanged', () => {
    render(<TextWithHoverTooltips text='普通描述' />);

    expect(screen.getByText('普通描述')).toBeInTheDocument();
  });

  it('renders markdown bold text', () => {
    render(<TextWithHoverTooltips text='造成**眩晕**效果' />);

    expect(screen.getByText('眩晕')).toHaveClass('underline', 'decoration-2', 'underline-offset-2');
  });

  it('renders bracket tooltip text', () => {
    render(<TextWithHoverTooltips text='[短按](用于触发技能)' />);

    expect(screen.getByText('短按')).toHaveAttribute('data-tooltip', '用于触发技能');
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
});
