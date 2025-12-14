'use client';

import { useState } from 'react';
import { notFound } from 'next/navigation';
import { Database } from '@/data/database.types';
import CategoryManagement from '@/features/admin/components/CategoryManagement';
import UserManagement from '@/features/admin/components/UserManagement';
import useSWR from 'swr';

import { useUser } from '@/hooks/useUser';

type Category = Database['public']['Tables']['categories']['Row'];

interface User {
  id: string;
  nickname: string;
  role: string;
}

// Fetcher functions for SWR
const fetchUsers = async (): Promise<User[]> => {
  const response = await fetch('/api/auth/fetch-users');
  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }
  return response.json();
};

const fetchCategories = async (): Promise<Category[]> => {
  const response = await fetch('/api/admin/categories');
  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }
  return response.json();
};

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'categories'>('users');

  // Check user authentication and role
  const user = useUser();

  const enableUserAccess = user.role === 'Coordinator';

  // Fetch data using SWR
  const {
    data: users = [],
    error: usersError,
    mutate: mutateUsers,
  } = useSWR(user ? 'users' : null, fetchUsers);

  const {
    data: categories = [],
    error: categoriesError,
    mutate: mutateCategories,
  } = useSWR(user ? 'categories' : null, fetchCategories);

  if (user.role === 'Contributor' || !user.role || usersError || categoriesError) {
    notFound();
  }

  return (
    <div className='mx-auto max-w-6xl p-6'>
      <h1 className='mb-6 text-3xl font-bold'>管理面板</h1>

      {/* Tab Navigation */}
      <div className='mb-6 flex border-b border-gray-200'>
        {enableUserAccess && (
          <button
            onClick={() => setActiveTab('users')}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            用户管理
          </button>
        )}
        <button
          onClick={() => setActiveTab('categories')}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'categories'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          分类管理
        </button>
      </div>

      {/* Tab Content */}
      {enableUserAccess && activeTab === 'users' && (
        <UserManagement users={users} mutateUsers={mutateUsers} />
      )}

      {activeTab === 'categories' && (
        <CategoryManagement categories={categories} mutateCategories={mutateCategories} />
      )}
    </div>
  );
};

export default AdminPanel;
