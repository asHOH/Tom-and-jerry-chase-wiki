'use client';

import React, { useState } from 'react';
import RichTextEditor from '@/components/ui/RichTextEditor';

const NewArticlePage: React.FC = () => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');

  const handleSave = () => {
    // Placeholder logic for saving the article
    console.log('Article saved:', { title, category });
  };

  return (
    <div>
      <h1>Create New Article</h1>
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

export default NewArticlePage;
