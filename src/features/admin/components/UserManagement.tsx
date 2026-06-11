'use client';

import React, { useState } from 'react';

import { cn } from '@/lib/design';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { FormInput, FormSelect } from '@/components/ui/FormControls';

interface User {
  id: string;
  nickname: string;
  role: string | null;
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
          className={cn(
            'mb-4 rounded p-3',
            message.type === 'success'
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
          )}
        >
          {message.text}
          <button onClick={() => setMessage(null)} className='ml-3 text-sm underline'>
            关闭
          </button>
        </div>
      )}

      {modalOpen && selectedUser && (
        <div className='bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black'>
          <Card className='mx-4 w-full max-w-md p-6 dark:text-slate-100'>
            <h2 className='mb-4 text-xl font-bold text-gray-900 dark:text-gray-100'>编辑用户</h2>
            <label className='mb-2 block'>
              昵称:
              <FormInput
                type='text'
                className='mt-1'
                size='sm'
                defaultValue={selectedUser.nickname}
                id='nickname'
              />
            </label>
            <label className='mb-4 block'>
              密码:
              <FormInput
                type='password'
                className='mt-1'
                size='sm'
                placeholder='留空则不修改密码'
                id='password'
              />
            </label>
            <div className='flex justify-end gap-2'>
              <Button type='button' variant='secondary' onClick={handleCloseModal}>
                取消
              </Button>
              <Button
                type='button'
                onClick={() => {
                  const nicknameInput = document.getElementById('nickname') as HTMLInputElement;
                  const passwordInput = document.getElementById('password') as HTMLInputElement;
                  handleUpdateUser(nicknameInput.value, passwordInput.value);
                }}
              >
                保存
              </Button>
            </div>
          </Card>
        </div>
      )}

      <Card className='dark:text-slate-200'>
        <div className='mb-4 flex items-center justify-between'>
          <h2 className='text-xl font-semibold text-gray-900 dark:text-gray-100'>用户管理</h2>
          <div className='text-sm text-gray-600 dark:text-gray-400'>{users.length} 个用户</div>
        </div>

        <div className='overflow-x-auto'>
          <table className='min-w-full divide-y divide-gray-200 dark:divide-slate-700'>
            <thead className='bg-gray-50 dark:bg-slate-900/40'>
              <tr>
                <th className='px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-slate-200'>
                  昵称
                </th>
                <th className='px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-slate-200'>
                  角色
                </th>
                <th className='px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-slate-200'>
                  操作
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-200 bg-white dark:divide-slate-700 dark:bg-slate-800'>
              {users.map((user) => (
                <tr key={user.id}>
                  <td className='px-4 py-3 text-sm text-gray-800 dark:text-slate-100'>
                    {user.nickname}
                  </td>
                  <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-300'>
                    <FormSelect
                      title='修改角色'
                      value={user.role ?? 'Contributor'}
                      onChange={(e) => {
                        handleRoleUpdate(user.id, e.target.value);
                      }}
                      fullWidth={false}
                      size='sm'
                    >
                      <option value='Reviewer'>管理员</option>
                      <option value='Coordinator'>超管</option>
                      <option value='Contributor'>用户</option>
                    </FormSelect>
                  </td>
                  <td className='px-4 py-3 text-sm'>
                    <Button type='button' size='sm' onClick={() => handleOpenModal(user)}>
                      编辑
                    </Button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className='px-4 py-6 text-center text-gray-500 dark:text-gray-400'
                  >
                    暂无用户
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
};

export default UserManagement;
