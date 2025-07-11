'use client';

import dynamic from 'next/dynamic';
import { KnowledgeCardDetailsProps } from '@/lib/types';
import { AppProvider } from '@/context/AppContext';

// Dynamic import for KnowledgeCardDetails component
const KnowledgeCardDetails = dynamic(
  () =>
    import('@/components/displays/knowledge-cards').then((mod) => ({
      default: mod.KnowledgeCardDetails,
    })),
  {
    loading: () => (
      <div className='max-w-4xl mx-auto p-6 space-y-6'>
        <div className='animate-pulse'>
          <div className='h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4'></div>
          <div className='h-64 bg-gray-200 dark:bg-gray-700 rounded mb-6'></div>
          <div className='space-y-4'>
            <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4'></div>
            <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2'></div>
          </div>
        </div>
      </div>
    ),
    ssr: false,
  }
);

export default function KnowledgeCardDetailsClient(props: KnowledgeCardDetailsProps) {
  return (
    <AppProvider>
      <KnowledgeCardDetails {...props} />
    </AppProvider>
  );
}
