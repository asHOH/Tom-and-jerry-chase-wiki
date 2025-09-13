'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { supabase } from '@/lib/supabase/client';
import { Database } from '@/data/database.types';
import UserManagement from '@/components/displays/admin/UserManagement';
import CategoryManagement from '@/components/displays/admin/CategoryManagement';
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
  const { data, error } = await supabase.rpc('get_categories');
  if (error) {
    throw new Error('Failed to fetch categories');
  }
  return (data || []) as Category[];
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

  if (user.role === 'Contributor') {
    return (
      <div className='p-6 max-w-4xl mx-auto'>
        <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded'>
          访问被拒绝: 您没有权限访问此页面
        </div>
      </div>
    );
  }

  if (!user.role) {
    return (
      <div className='p-6 max-w-4xl mx-auto'>
        <div className='bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded'>
          正在验证权限...
        </div>
      </div>
    );
  }

  if (usersError || categoriesError) {
    return (
      <div className='p-6 max-w-4xl mx-auto'>
        <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded'>
          Error loading admin data: {usersError?.message || categoriesError?.message}
        </div>
      </div>
    );
  }

  return (
    <div className='p-6 max-w-6xl mx-auto'>
      <h1 className='text-3xl font-bold mb-6'>管理面板</h1>

      {/* Tab Navigation */}
      <div className='flex border-b border-gray-200 mb-6'>
        {enableUserAccess && (
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
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
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
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
