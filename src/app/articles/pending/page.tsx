'use client';

import { useUser } from '@/hooks/useUser';
import { useEffect, useState } from 'react';
type PendingArticle = {
  id: string;
  title: string;
  editorNickname: string;
  status: string;
};

const PendingModerationPage = () => {
  const { role } = useUser();
  const [pendingArticles, setPendingArticles] = useState<PendingArticle[]>([]);

  useEffect(() => {
    const loadPendingArticles = async () => {
      const response = await fetch('/api/articles/pending');
      const articles: PendingArticle[] = await response.json();
      setPendingArticles(articles);
    };

    loadPendingArticles();
  }, []);

  return (
    <div className='container mx-auto p-4'>
      <h1 className='text-2xl font-bold mb-4'>Pending Moderation</h1>
      <ul>
        {pendingArticles.map((article) => (
          <li key={article.id} className='border-b py-2'>
            <div>
              <strong>{article.title}</strong> by {article.editorNickname}
            </div>
            <div>Status: {article.status}</div>
            {role === 'Reviewer' || role === 'Coordinator' ? (
              <button className='text-blue-500 hover:underline mt-2'>Edit</button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PendingModerationPage;
