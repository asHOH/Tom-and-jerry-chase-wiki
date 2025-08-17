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
    <div>
      <h1>Edit Article</h1>
      <form onSubmit={(e) => e.preventDefault()}>
        <div>
          <label htmlFor='title'>Title:</label>
          <input
            id='title'
            type='text'
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor='category'>Category:</label>
          <select
            id='category'
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          >
            <option value=''>Select a category</option>
            <option value='example-category-1'>Example Category 1</option>
            <option value='example-category-2'>Example Category 2</option>
          </select>
        </div>
        <div>
          <label>Content:</label>
          <RichTextEditor />
        </div>
        <button type='button' onClick={handleSave}>
          Save
        </button>
      </form>
    </div>
  );
};

export default EditArticlePage;
