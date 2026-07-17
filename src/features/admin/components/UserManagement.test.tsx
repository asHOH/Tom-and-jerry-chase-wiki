import { render, screen } from '@testing-library/react';

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

    expect(screen.getByRole('link', { name: 'Alice' })).toHaveAttribute('href', '/users/user-1');
  });
});
