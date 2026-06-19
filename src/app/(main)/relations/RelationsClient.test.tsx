import { fireEvent, render, screen } from '@testing-library/react';

import RelationsClient from './RelationsClient';

describe('RelationsClient', () => {
  it('should default to mouse rows and cat columns, then fall back to mouse columns for cat rows', () => {
    render(<RelationsClient description='查看角色之间的关系。' />);

    expect(screen.getByRole('heading', { name: '角色关系' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '鼠阵营' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '猫角色' })).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: '猫阵营' }));

    expect(screen.getByRole('button', { name: '猫阵营' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByRole('button', { name: '猫角色' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '鼠角色' })).toHaveAttribute('aria-pressed', 'true');
  });
});
