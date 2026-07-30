import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import UserManagement from './UserManagement';

describe('UserManagement', () => {
  it('links user nicknames to their public profiles', () => {
    render(
      <UserManagement
        users={[{ id: 'user-1', nickname: 'Alice', groupIds: [] }]}
        groups={[]}
        canAssignGroups={false}
        canUpdateUsers={false}
        mutateUsers={jest.fn()}
      />
    );

    expect(screen.getByRole('link', { name: 'Alice' })).toHaveAttribute('href', '/users/Alice');
  });

  it('keeps the edit dialog open on Escape and backdrop interaction', async () => {
    render(
      <UserManagement
        users={[{ id: 'user-1', nickname: 'Alice', groupIds: [] }]}
        groups={[]}
        canAssignGroups={false}
        canUpdateUsers
        mutateUsers={jest.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '编辑' }));
    expect(screen.getByRole('dialog', { name: '编辑用户' })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    const backdrop = document.body.querySelector<HTMLElement>('.fixed.inset-0[aria-hidden="true"]');
    expect(backdrop).not.toBeNull();
    fireEvent.mouseDown(backdrop!);
    expect(screen.getByRole('dialog', { name: '编辑用户' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '取消' }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: '编辑用户' })).not.toBeInTheDocument();
    });
  });
});
