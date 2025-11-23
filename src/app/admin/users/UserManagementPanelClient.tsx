'use client';

import { useEffect, useState } from 'react';

interface User {
  id: string;
  nickname: string;
  role: string;
}

const UserManagementPanelClient = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/auth/fetch-users');
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        const data = await response.json();
        setUsers(data);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred');
        }
      }
    };

    fetchUsers();
  }, []);

  if (error) {
    return <p className='text-red-500'>Error: {error}</p>;
  }

  const handleOpenModal = (user: User) => {
    setSelectedUser(user);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedUser(null);
    setModalOpen(false);
  };

  const handleUpdateUser = async (nickname: string, password: string) => {
    if (!selectedUser) return;

    try {
      const response = await fetch('/api/auth/update-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser.id, nickname, password }),
      });
      if (!response.ok) {
        throw new Error('Failed to update user');
      }
      setUsers((prevUsers) =>
        prevUsers.map((u) => (u.id === selectedUser.id ? { ...u, nickname } : u))
      );
      handleCloseModal();
    } catch (err) {
      console.error('Error updating user:', err);
    }
  };

  return (
    <>
      {modalOpen && (
        <div className='bg-opacity-50 fixed inset-0 flex items-center justify-center bg-black'>
          <div className='rounded bg-white p-6 shadow-lg'>
            <h2 className='mb-4 text-xl font-bold'>编辑用户</h2>
            <label className='mb-2 block'>
              昵称:
              <input
                type='text'
                className='w-full border border-gray-300 px-2 py-1'
                defaultValue={selectedUser?.nickname}
                id='nickname'
              />
            </label>
            <label className='mb-4 block'>
              密码:
              <input
                type='password'
                className='w-full border border-gray-300 px-2 py-1'
                id='password'
              />
            </label>
            <div className='flex justify-end'>
              <button
                className='mr-2 rounded bg-gray-500 px-4 py-2 text-white'
                onClick={handleCloseModal}
              >
                取消
              </button>
              <button
                className='rounded bg-blue-500 px-4 py-2 text-white'
                onClick={() =>
                  handleUpdateUser(
                    (document.getElementById('nickname') as HTMLInputElement).value,
                    (document.getElementById('password') as HTMLInputElement).value
                  )
                }
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
      <div className='p-6'>
        <h1 className='mb-4 text-2xl font-bold'>User Management Panel</h1>
        <table className='w-full table-auto border-collapse border border-gray-300'>
          <thead>
            <tr>
              <th className='border border-gray-300 px-4 py-2'>昵称</th>
              <th className='border border-gray-300 px-4 py-2'>角色</th>
              <th className='border border-gray-300 px-4 py-2'>操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td className='border border-gray-300 px-4 py-2'>{user.nickname}</td>
                <td className='border border-gray-300 px-4 py-2'>
                  <select
                    aria-label='用户角色'
                    className='border border-gray-300 px-2 py-1'
                    value={user.role}
                    onChange={async (e) => {
                      const newRole = e.target.value;
                      const oldRole = user.role;
                      setUsers((prevUsers) =>
                        prevUsers.map((u) => (u.id === user.id ? { ...u, role: newRole } : u))
                      );
                      try {
                        const response = await fetch('/api/auth/update-role', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ userId: user.id, role: newRole }),
                        });
                        if (!response.ok) {
                          throw new Error('Failed to update role');
                        }
                      } catch (err) {
                        console.error('Error updating role:', err);
                        setUsers((prevUsers) =>
                          prevUsers.map((u) => (u.id === user.id ? { ...u, role: oldRole } : u))
                        );
                      }
                    }}
                  >
                    <option value='Reviewer'>审阅者</option>
                    <option value='Coordinator'>协调员</option>
                    <option value='Contributor'>贡献者</option>
                  </select>
                </td>
                <td className='border border-gray-300 px-4 py-2'>
                  <button
                    type='button'
                    className='rounded bg-blue-500 px-2 py-1 text-white'
                    onClick={() => handleOpenModal(user)}
                  >
                    编辑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default UserManagementPanelClient;
