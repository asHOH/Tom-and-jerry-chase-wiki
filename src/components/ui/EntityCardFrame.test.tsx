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

    expect(screen.getByRole('link', { name: '查看飞跃知识卡详情' })).toHaveAttribute(
      'href',
      '/cards/jump'
    );
    expect(screen.getAllByLabelText('查看飞跃知识卡详情')).toHaveLength(1);
  });
});
