'use client';

import React, { useState } from 'react';
import { useSWRConfig } from 'swr';

import { cn } from '@/lib/design';
import { USER_API_KEY } from '@/hooks/useUser';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { FormInput } from '@/components/ui/FormControls';

import type { PermissionGroup } from './PermissionGroupManagement';

type User = {
  id: string;
  nickname: string;
  groupIds: string[];
};

type UserManagementProps = {
  users: User[];
  groups: PermissionGroup[];
  canAssignGroups: boolean;
  canUpdateUsers: boolean;
  mutateUsers: () => void;
};

const UserManagement: React.FC<UserManagementProps> = ({
  users,
  groups,
  canAssignGroups,
  canUpdateUsers,
  mutateUsers,
}) => {
  const { mutate: mutateCache } = useSWRConfig();
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

  const handleGroupUpdate = async (userId: string, groupIds: string[]) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/groups`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to update groups');
      }

      setMessage({ type: 'success', text: '权限组已更新' });
      mutateUsers(); // Revalidate the users data
      await mutateCache(USER_API_KEY);
    } catch (err) {
      console.error('Error updating groups:', err);
      setMessage({ type: 'error', text: '更新权限组失败' });
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
              <Button variant='secondary' onClick={handleCloseModal}>
                取消
              </Button>
              <Button
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
                  权限组
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
                    <div className='flex min-w-48 flex-wrap gap-2'>
                      {groups.map((group) => {
                        const checked = user.groupIds.includes(group.id);
                        return (
                          <label
                            key={group.id}
                            className='inline-flex items-center gap-1 rounded border px-2 py-1'
                          >
                            <input
                              type='checkbox'
                              checked={checked}
                              disabled={!canAssignGroups}
                              onChange={() => {
                                const next = checked
                                  ? user.groupIds.filter((id) => id !== group.id)
                                  : [...user.groupIds, group.id];
                                void handleGroupUpdate(user.id, next);
                              }}
                            />
                            {group.name}
                          </label>
                        );
                      })}
                    </div>
                  </td>
                  <td className='px-4 py-3 text-sm'>
                    {canUpdateUsers && (
                      <Button size='sm' onClick={() => handleOpenModal(user)}>
                        编辑
                      </Button>
                    )}
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
