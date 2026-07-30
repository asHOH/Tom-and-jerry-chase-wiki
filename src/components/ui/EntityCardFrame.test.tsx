import React from 'react';
import { render, screen } from '@testing-library/react';

import EntityCardFrame from './EntityCardFrame';

jest.mock('@/components/Link', () => ({
  __esModule: true,
  default: function MockLink({
    children,
    href,
    preserveEditParam: _preserveEditParam,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
    children: React.ReactNode;
    preserveEditParam?: boolean;
  }) {
    return React.createElement('a', { href, ...props }, children);
  },
}));

describe('EntityCardFrame', () => {
  it('puts the accessible label only on the link for linked cards', () => {
    render(
      <EntityCardFrame href='/cards/jump' aria-label='查看飞跃知识卡详情'>
        <span>飞跃</span>
      </EntityCardFrame>
    );

    const link = screen.getByRole('link', { name: '查看飞跃知识卡详情' });
    expect(link).toHaveAttribute('href', '/cards/jump');
    expect(link.firstElementChild).toHaveClass(
      'cursor-pointer',
      'shadow-sm',
      'hover:border-blue-300',
      'hover:shadow-md'
    );
    expect(screen.getAllByLabelText('查看飞跃知识卡详情')).toHaveLength(1);
  });

  it('renders static detail content as a flat bordered surface', () => {
    render(
      <EntityCardFrame variant='detail'>
        <span>角色属性</span>
      </EntityCardFrame>
    );

    const frame = screen.getByText('角色属性').parentElement;
    expect(frame).toHaveClass(
      'rounded-lg',
      'border',
      'border-border',
      'bg-surface',
      'text-foreground',
      'h-full'
    );
    expect(frame).not.toHaveClass('shadow-sm', 'hover:shadow-md');
  });

  it('adds elevation and hover feedback to interactive surfaces', () => {
    render(
      <EntityCardFrame variant='catalog' interactive>
        <span>角色预览</span>
      </EntityCardFrame>
    );

    expect(screen.getByText('角色预览').parentElement).toHaveClass(
      'relative',
      'cursor-pointer',
      'shadow-sm',
      'hover:border-blue-300',
      'hover:shadow-md'
    );
  });
});
