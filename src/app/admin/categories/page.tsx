'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Database } from '@/data/database.types'; // Assuming this file contains Supabase type definitions
type Category = Database['public']['Tables']['categories']['Row'];

const CategoryManagement = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState<
    Pick<Category, 'name' | 'parent_category_id' | 'default_visibility'>
  >({
    name: '',
    parent_category_id: null,
    default_visibility: 'approved',
  });
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase.rpc('get_categories');
    if (error) {
      console.error('Error fetching categories:', error);
    } else {
      setCategories(data);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategory.name || !newCategory.default_visibility) {
      console.error('Error: Missing required fields');
      return;
    }
    const { error } = await supabase.rpc('create_category', {
      _name: newCategory.name,
      _parent_category_id: newCategory.parent_category_id!,
      _default_visibility: newCategory.default_visibility,
    });
    if (error) {
      console.error('Error creating category:', error);
    } else {
      fetchCategories();
      setNewCategory({ name: '', parent_category_id: null, default_visibility: 'approved' });
    }
  };

  const handleEditCategory = async () => {
    if (!editingCategory || !editingCategory.id) return;
    const { error } = await supabase.rpc('update_category', {
      _id: editingCategory.id,
      _name: editingCategory.name!,
      _parent_category_id: editingCategory.parent_category_id!,
      _default_visibility: editingCategory.default_visibility!,
    });
    if (error) {
      console.error('Error editing category:', error);
    } else {
      fetchCategories();
      setEditingCategory(null);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const { error } = await supabase.rpc('delete_category', { _id: id });
    if (error) {
      console.error('Error deleting category:', error);
    } else {
      fetchCategories();
    }
  };

  return (
    <div className='p-4'>
      <h1 className='text-2xl font-bold mb-4'>Category Management</h1>
      <div className='mb-4'>
        <h2 className='text-xl font-semibold'>Create New Category</h2>
        <input
          type='text'
          placeholder='Category Name'
          value={newCategory.name}
          onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
          className='border p-2 mr-2'
        />
        <select
          value={newCategory.default_visibility || ''}
          onChange={(e) =>
            setNewCategory({
              ...newCategory,
              default_visibility: e.target.value as unknown as 'pending' | 'approved',
            })
          }
          className='border p-2 mr-2'
        >
          <option value='approved'>Approved</option>
          <option value='pending'>Pending</option>
        </select>
        <button onClick={handleCreateCategory} className='bg-blue-500 text-white px-4 py-2'>
          Create
        </button>
      </div>
      <div>
        <h2 className='text-xl font-semibold'>Existing Categories</h2>
        <table className='table-auto w-full border-collapse border border-gray-300'>
          <thead>
            <tr>
              <th className='border border-gray-300 px-4 py-2'>Name</th>
              <th className='border border-gray-300 px-4 py-2'>Parent Category</th>
              <th className='border border-gray-300 px-4 py-2'>Default Visibility</th>
              <th className='border border-gray-300 px-4 py-2'>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id}>
                <td className='border border-gray-300 px-4 py-2'>{category.name}</td>
                <td className='border border-gray-300 px-4 py-2'>
                  {category.parent_category_id || 'None'}
                </td>
                <td className='border border-gray-300 px-4 py-2'>{category.default_visibility}</td>
                <td className='border border-gray-300 px-4 py-2'>
                  <button
                    onClick={() => setEditingCategory(category)}
                    className='bg-yellow-500 text-white px-2 py-1 mr-2'
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className='bg-red-500 text-white px-2 py-1'
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editingCategory && (
        <div className='mt-4'>
          <h2 className='text-xl font-semibold'>Edit Category</h2>
          <input
            type='text'
            placeholder='Category Name'
            value={editingCategory.name}
            onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
            className='border p-2 mr-2'
          />
          <select
            value={editingCategory?.default_visibility || ''}
            onChange={(e) =>
              setEditingCategory((prev) => ({
                ...prev,
                default_visibility: e.target.value as 'pending' | 'approved',
              }))
            }
            className='border p-2 mr-2'
          >
            <option value='approved'>Approved</option>
            <option value='pending'>Pending</option>
          </select>
          <button onClick={handleEditCategory} className='bg-green-500 text-white px-4 py-2'>
            Save
          </button>
        </div>
      )}
    </div>
  );
};

export default CategoryManagement;
