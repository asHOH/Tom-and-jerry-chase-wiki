'use client';

import { useEffect, useState } from 'react';

import { Database } from '@/data/database.types';

type Category = Database['public']['Tables']['categories']['Row'];

const visibilityLabel = (v: Category['default_visibility']) => {
  if (v === 'approved') return '已通过';
  if (v === 'pending') return '待审核';
  if (v === 'rejected') return '已拒绝';
  if (v === 'revoked') return '已撤销';
  return v ?? '';
};

type NewCategory = {
  name: string;
  parent_category_id?: string | undefined;
  default_visibility: Category['default_visibility'];
};

const CategoryManagement = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [newCategory, setNewCategory] = useState<NewCategory>({
    name: '',
    parent_category_id: undefined,
    default_visibility: 'approved',
  });

  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/categories');
      if (!res.ok) throw new Error('Failed to fetch categories');
      const data = await res.json();
      setCategories((data || []) as Category[]);
    } catch (e) {
      console.error('Error fetching categories:', e);
      setMessage({ type: 'error', text: '获取分类失败' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategory.name || !newCategory.default_visibility) {
      setMessage({ type: 'error', text: '请填写分类名称与默认可见性' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCategory.name,
          parent_category_id: newCategory.parent_category_id ?? null,
          default_visibility: newCategory.default_visibility,
        }),
      });
      if (!res.ok) throw new Error('Failed to create category');
      setMessage({ type: 'success', text: '已创建分类' });
      await fetchCategories();
      setNewCategory({ name: '', parent_category_id: undefined, default_visibility: 'approved' });
    } catch (e) {
      console.error('Error creating category:', e);
      setMessage({ type: 'error', text: '创建分类失败' });
    } finally {
      setLoading(false);
    }
  };

  const handleEditCategory = async () => {
    if (!editingCategory || !editingCategory.id) return;
    if (!editingCategory.name || !editingCategory.default_visibility) {
      setMessage({ type: 'error', text: '请填写分类名称与默认可见性' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingCategory.id,
          name: editingCategory.name,
          parent_category_id: editingCategory.parent_category_id ?? null,
          default_visibility: editingCategory.default_visibility,
        }),
      });
      if (!res.ok) throw new Error('Failed to update category');
      setMessage({ type: 'success', text: '分类已更新' });
      await fetchCategories();
      setEditingCategory(null);
    } catch (e) {
      console.error('Error editing category:', e);
      setMessage({ type: 'error', text: '更新分类失败' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('确定要删除此分类吗？此操作无法恢复。')) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Failed to delete category');
      setMessage({ type: 'success', text: '分类已删除' });
      await fetchCategories();
    } catch (e) {
      console.error('Error deleting category:', e);
      setMessage({ type: 'error', text: '删除分类失败' });
    } finally {
      setLoading(false);
    }
  };

  // helper to get display name for parent
  const parentName = (parentId: string | null | undefined) =>
    categories.find((c) => c.id === parentId)?.name ?? '无';

  return (
    <div className='mx-auto max-w-4xl p-6'>
      <h1 className='mb-4 text-3xl font-bold'>分类管理</h1>

      {message && (
        <div
          className={`mb-4 rounded p-3 ${
            message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className='mb-6 rounded bg-white p-4 shadow'>
        <h2 className='mb-3 text-xl font-semibold'>创建新分类</h2>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
          <input
            type='text'
            placeholder='分类名称'
            value={newCategory.name}
            onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
            className='flex-1 rounded border p-2'
          />
          <select
            aria-label='父分类'
            value={newCategory.parent_category_id ?? ''}
            onChange={(e) =>
              setNewCategory({
                ...newCategory,
                parent_category_id: e.target.value === '' ? undefined : (e.target.value as string),
              })
            }
            className='rounded border p-2'
          >
            <option value=''>无（根分类）</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <select
            aria-label='默认可见性'
            value={newCategory.default_visibility || ''}
            onChange={(e) =>
              setNewCategory({
                ...newCategory,
                default_visibility: e.target.value as Category['default_visibility'],
              })
            }
            className='rounded border p-2'
          >
            <option value='approved'>已通过</option>
            <option value='pending'>待审核</option>
          </select>
          <button
            onClick={handleCreateCategory}
            className='rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700'
            disabled={loading}
          >
            创建
          </button>
        </div>
      </div>

      <div className='rounded bg-white p-4 shadow'>
        <div className='mb-3 flex items-center justify-between'>
          <h2 className='text-xl font-semibold'>现有分类</h2>
          <div className='text-sm text-gray-600'>
            {loading ? '加载中...' : `${categories.length} 个分类`}
          </div>
        </div>

        <div className='overflow-x-auto'>
          <table className='min-w-full divide-y divide-gray-200'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='px-4 py-2 text-left text-sm font-medium text-gray-700'>名称</th>
                <th className='px-4 py-2 text-left text-sm font-medium text-gray-700'>父分类</th>
                <th className='px-4 py-2 text-left text-sm font-medium text-gray-700'>
                  默认可见性
                </th>
                <th className='px-4 py-2 text-left text-sm font-medium text-gray-700'>操作</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-200 bg-white'>
              {categories.map((category) => (
                <tr key={category.id}>
                  <td className='px-4 py-3 text-sm text-gray-800'>{category.name}</td>
                  <td className='px-4 py-3 text-sm text-gray-600'>
                    {parentName(category.parent_category_id)}
                  </td>
                  <td className='px-4 py-3 text-sm text-gray-600'>
                    {visibilityLabel(category.default_visibility)}
                  </td>
                  <td className='px-4 py-3 text-sm'>
                    <div className='flex gap-2'>
                      <button
                        onClick={() => setEditingCategory(category)}
                        className='rounded bg-yellow-500 px-3 py-1 text-white hover:bg-yellow-600'
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className='rounded bg-red-600 px-3 py-1 text-white hover:bg-red-700'
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={4} className='px-4 py-6 text-center text-gray-500'>
                    暂无分类
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingCategory && (
        <div className='mt-6 rounded bg-white p-4 shadow'>
          <h2 className='mb-3 text-xl font-semibold'>编辑分类</h2>
          <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
            <input
              type='text'
              placeholder='分类名称'
              value={editingCategory.name ?? ''}
              onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
              className='flex-1 rounded border p-2'
            />
            <select
              aria-label='父分类'
              value={editingCategory.parent_category_id ?? ''}
              onChange={(e) =>
                setEditingCategory((prev) => ({
                  ...prev,
                  parent_category_id: e.target.value === '' ? null : (e.target.value as string),
                }))
              }
              className='rounded border p-2'
            >
              <option value=''>无（根分类）</option>
              {categories
                .filter((c) => c.id !== editingCategory.id) // avoid choosing itself as parent
                .map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
            </select>
            <select
              aria-label='默认可见性'
              value={editingCategory.default_visibility ?? ''}
              onChange={(e) =>
                setEditingCategory((prev) => ({
                  ...prev,
                  default_visibility: e.target.value as Category['default_visibility'],
                }))
              }
              className='rounded border p-2'
            >
              <option value='approved'>已通过</option>
              <option value='pending'>待审核</option>
            </select>
            <div className='flex gap-2'>
              <button
                onClick={handleEditCategory}
                className='rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700'
                disabled={loading}
              >
                保存
              </button>
              <button
                onClick={() => setEditingCategory(null)}
                className='rounded bg-gray-300 px-4 py-2 text-gray-800 hover:bg-gray-400'
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManagement;
