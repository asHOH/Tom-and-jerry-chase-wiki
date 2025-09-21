'use client';
import dynamic from 'next/dynamic';

type Props = { description?: string };

const KnowledgeCardGrid = dynamic<Props>(
  () => import('@/components/displays/knowledge-cards/knowledge-card-grid/KnowledgeCardGrid'),
  {
    loading: () => (
      <div className='max-w-6xl mx-auto p-6 space-y-6'>
        <div className='animate-pulse'>
          <div className='h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4'></div>
          <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4'>
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className='h-32 bg-gray-200 dark:bg-gray-700 rounded'></div>
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
