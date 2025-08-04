// GotoPreviewCard.tsx
import React, { useEffect, useState } from 'react';
import PreviewCard, { GotoPreviewCardProps } from './ui/PreviewCard';
import { getGotoResult } from '@/lib/gotoUtils';

type GotoPreviewCardPropsWithName = {
  name: string;
  className?: string;
};

export default function GotoPreviewCard({ name, className }: GotoPreviewCardPropsWithName) {
  const [data, setData] = useState<GotoPreviewCardProps | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getGotoResult(name).then((result) => {
      if (mounted) {
        if (result) {
          setData({
            url: result.url,
            type: result.type,
            name: result.name,
            description: result.description ?? '',
            imageUrl: result.imageUrl ?? '',
            className: '',
          });
        } else {
          setData(null);
        }
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, [name]);

  if (loading) {
    return (
      <div className={className}>
        <div className='w-full max-w-xs p-4 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg shadow-md animate-pulse'>
          <div className='w-24 h-24 mb-3 bg-gray-200 dark:bg-gray-700 rounded-lg' />
          <div className='h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-2' />
          <div className='h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-1' />
          <div className='h-3 w-28 bg-gray-200 dark:bg-gray-700 rounded' />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={className}>
        <div className='w-full max-w-xs p-4 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg shadow-md'>
          <div className='text-gray-400 text-lg'>未找到“{name}”的跳转目标</div>
        </div>
      </div>
    );
  }

  return <PreviewCard {...data} className={className ?? ''} />;
}
