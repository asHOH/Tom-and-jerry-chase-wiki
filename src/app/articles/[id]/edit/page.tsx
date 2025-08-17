'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import RichTextEditor from '@/components/ui/RichTextEditor';

const EditArticlePage: React.FC = () => {
  const { id } = useParams();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (id) {
      // Placeholder logic to fetch article data by ID
      console.log('Fetching article data for ID:', id);
      // Simulate fetching data
      setTitle('Example Title');
      setCategory('example-category-1');
      setContent('<p>Example content...</p>');
    }
  }, [id]);

  const handleSave = () => {
    // Placeholder logic for saving the updated article
    console.log('Article updated:', { id, title, category, content });
  };

  return (
    <div className='flex flex-col items-center p-6 bg-gray-100 min-h-screen'>
      <h1 className='text-3xl font-bold mb-6'>编辑文章</h1>
      <form
        onSubmit={(e) => e.preventDefault()}
        className='w-full max-w-lg bg-white p-6 rounded-lg shadow-md'
      >
        <div className='mb-4'>
          <label htmlFor='title' className='block text-sm font-medium text-gray-700'>
            标题：
          </label>
          <input
            id='title'
            type='text'
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm'
          />
        </div>
        <div className='mb-4'>
          <label htmlFor='category' className='block text-sm font-medium text-gray-700'>
            分类：
          </label>
          <select
            id='category'
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm'
          >
            <option value=''>Select a category</option>
            <option value='example-category-1'>Example Category 1</option>
            <option value='example-category-2'>Example Category 2</option>
          </select>
        </div>
        <div className='mb-4 prose'>
          <label className='block text-sm font-medium text-gray-700'>内容：</label>
          <RichTextEditor />
        </div>
        <button
          type='button'
          onClick={handleSave}
          className='w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
        >
          保存
        </button>
      </form>
    </div>
  );
};

export default EditArticlePage;
