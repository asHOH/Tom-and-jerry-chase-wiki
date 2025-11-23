'use client';

import dynamic from 'next/dynamic';

import { KnowledgeCardDetailsProps } from '@/lib/types';

// Dynamic import for KnowledgeCardDetails component
const KnowledgeCardDetails = dynamic(
  () =>
    import('@/components/displays/knowledge-cards').then((mod) => ({
      default: mod.KnowledgeCardDetails,
    })),
  {
    loading: () => (
      <div className='mx-auto max-w-4xl space-y-6 p-6'>
        <div className='animate-pulse'>
          <div className='mb-4 h-8 w-1/3 rounded bg-gray-200 dark:bg-gray-700'></div>
          <div className='mb-6 h-64 rounded bg-gray-200 dark:bg-gray-700'></div>
          <div className='space-y-4'>
            <div className='h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700'></div>
            <div className='h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-700'></div>
          </div>
        </div>
      </div>
    ),
    ssr: false,
  }
);

export default function KnowledgeCardDetailsClient(props: KnowledgeCardDetailsProps) {
  return <KnowledgeCardDetails {...props} />;
}
