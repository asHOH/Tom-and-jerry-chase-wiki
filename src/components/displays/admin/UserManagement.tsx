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
          className={`mb-4 p-3 rounded ${
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
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white p-6 rounded shadow-lg max-w-md w-full mx-4'>
            <h2 className='text-xl font-bold mb-4'>编辑用户</h2>
            <label className='block mb-2'>
              昵称:
              <input
                type='text'
                className='border border-gray-300 px-2 py-1 w-full mt-1 rounded'
                defaultValue={selectedUser.nickname}
                id='nickname'
              />
            </label>
            <label className='block mb-4'>
              密码:
              <input
                type='password'
                className='border border-gray-300 px-2 py-1 w-full mt-1 rounded'
                placeholder='留空则不修改密码'
                id='password'
              />
            </label>
            <div className='flex justify-end gap-2'>
              <button
                className='bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded'
                onClick={handleCloseModal}
              >
                取消
              </button>
              <button
                className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded'
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

      <div className='bg-white shadow rounded p-4'>
        <div className='flex items-center justify-between mb-4'>
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
            <tbody className='bg-white divide-y divide-gray-200'>
              {users.map((user) => (
                <tr key={user.id}>
                  <td className='px-4 py-3 text-sm text-gray-800'>{user.nickname}</td>
                  <td className='px-4 py-3 text-sm text-gray-600'>
                    <select
                      className='border border-gray-300 px-2 py-1 rounded'
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
                      className='bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded'
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
