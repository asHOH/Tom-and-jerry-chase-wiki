'use client';

import React, { useState } from 'react';

interface User {
  id: string;
  nickname: string;
  role: string;
}

interface UserManagementProps {
  users: User[];
  mutateUsers: () => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, mutateUsers }) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

      setMessage({ type: 'success', text: '用户已更新' });
      mutateUsers(); // Revalidate the users data
      handleCloseModal();
    } catch (err) {
      console.error('Error updating user:', err);
      setMessage({ type: 'error', text: '更新用户失败' });
    }
  };

  const handleRoleUpdate = async (userId: string, newRole: string) => {
    try {
      const response = await fetch('/api/auth/update-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (!response.ok) {
        throw new Error('Failed to update role');
      }

      setMessage({ type: 'success', text: '角色已更新' });
      mutateUsers(); // Revalidate the users data
    } catch (err) {
      console.error('Error updating role:', err);
      setMessage({ type: 'error', text: '更新角色失败' });
      // Revert the local change by re-fetching data
      mutateUsers();
    }
  };

  return (
    <>
      {message && (
        <div
          className={`mb-4 rounded p-3 ${
            message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {message.text}
          <button onClick={() => setMessage(null)} className='ml-3 text-sm underline'>
            关闭
          </button>
        </div>
      )}

      {modalOpen && selectedUser && (
        <div className='bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black'>
          <div className='mx-4 w-full max-w-md rounded bg-white p-6 shadow-lg'>
            <h2 className='mb-4 text-xl font-bold'>编辑用户</h2>
            <label className='mb-2 block'>
              昵称:
              <input
                type='text'
                className='mt-1 w-full rounded border border-gray-300 px-2 py-1'
                defaultValue={selectedUser.nickname}
                id='nickname'
              />
            </label>
            <label className='mb-4 block'>
              密码:
              <input
                type='password'
                className='mt-1 w-full rounded border border-gray-300 px-2 py-1'
                placeholder='留空则不修改密码'
                id='password'
              />
            </label>
            <div className='flex justify-end gap-2'>
              <button
                className='rounded bg-gray-500 px-4 py-2 text-white hover:bg-gray-600'
                onClick={handleCloseModal}
              >
                取消
              </button>
              <button
                className='rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600'
                onClick={() => {
                  const nicknameInput = document.getElementById('nickname') as HTMLInputElement;
                  const passwordInput = document.getElementById('password') as HTMLInputElement;
                  handleUpdateUser(nicknameInput.value, passwordInput.value);
                }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      <div className='rounded bg-white p-4 shadow'>
        <div className='mb-4 flex items-center justify-between'>
          <h2 className='text-xl font-semibold'>用户管理</h2>
          <div className='text-sm text-gray-600'>{users.length} 个用户</div>
        </div>

        <div className='overflow-x-auto'>
          <table className='min-w-full divide-y divide-gray-200'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='px-4 py-2 text-left text-sm font-medium text-gray-700'>昵称</th>
                <th className='px-4 py-2 text-left text-sm font-medium text-gray-700'>角色</th>
                <th className='px-4 py-2 text-left text-sm font-medium text-gray-700'>操作</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-200 bg-white'>
              {users.map((user) => (
                <tr key={user.id}>
                  <td className='px-4 py-3 text-sm text-gray-800'>{user.nickname}</td>
                  <td className='px-4 py-3 text-sm text-gray-600'>
                    <select
                      className='rounded border border-gray-300 px-2 py-1'
                      value={user.role}
                      onChange={(e) => {
                        const newRole = e.target.value;
                        handleRoleUpdate(user.id, newRole);
                      }}
                    >
                      <option value='Reviewer'>管理员</option>
                      <option value='Coordinator'>超管</option>
                      <option value='Contributor'>用户</option>
                    </select>
                  </td>
                  <td className='px-4 py-3 text-sm'>
                    <button
                      className='rounded bg-blue-500 px-3 py-1 text-white hover:bg-blue-600'
                      onClick={() => handleOpenModal(user)}
                    >
                      编辑
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={3} className='px-4 py-6 text-center text-gray-500'>
                    暂无用户
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default UserManagement;
