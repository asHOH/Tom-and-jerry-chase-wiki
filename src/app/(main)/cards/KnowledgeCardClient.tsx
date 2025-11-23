'use client';

import dynamic from 'next/dynamic';

type Props = { description?: string };

const KnowledgeCardGrid = dynamic<Props>(
  () => import('@/components/displays/knowledge-cards/knowledge-card-grid/KnowledgeCardGrid'),
  {
    loading: () => (
      <div className='mx-auto max-w-6xl space-y-6 p-6'>
        <div className='animate-pulse'>
          <div className='mb-4 h-8 w-1/3 rounded bg-gray-200 dark:bg-gray-700'></div>
          <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'>
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className='h-32 rounded bg-gray-200 dark:bg-gray-700'></div>
            ))}
          </div>
        </div>
      </div>
    ),
    ssr: false,
  }
);

export default function KnowledgeCardClient(props: Props) {
  return <KnowledgeCardGrid {...props} />;
}
