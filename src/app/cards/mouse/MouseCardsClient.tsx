'use client';

import dynamic from 'next/dynamic';
import { AppProvider } from '@/context/AppContext';
import { KnowledgeCardGridProps } from '@/lib/types';

// Dynamic import for KnowledgeCardGrid component
const KnowledgeCardGrid = dynamic(
  () =>
    import('@/components/displays/knowledge-cards').then((mod) => ({
      default: mod.KnowledgeCardGrid,
    })),
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

export default function MouseCardsClient(props: KnowledgeCardGridProps) {
  return (
    <AppProvider>
      <KnowledgeCardGrid {...props} />
    </AppProvider>
  );
}
