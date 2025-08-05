// GotoLink.tsx
import React, { useEffect, useRef, useState } from 'react';
import useSWR from 'swr';
import PreviewCard, { GotoPreviewCardProps } from './ui/PreviewCard';
import Link from 'next/link';

type GotoLinkProps = {
  name: string;
  className?: string;
  children: React.ReactNode;
};

export default function GotoLink({ name, className, children }: GotoLinkProps) {
  const [show, setShow] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetcher = async (url: string): Promise<GotoPreviewCardProps | null> => {
    const res = await fetch(url);
    if (!res.ok) return null;
    const result = await res.json();
    if (result && result.url && result.type && result.name) {
      return {
        url: result.url,
        type: result.type,
        name: result.name,
        description: result.description ?? '',
        imageUrl: result.imageUrl ?? '',
        className: '',
      };
    }
    return null;
  };

  const { data, isLoading } = useSWR<GotoPreviewCardProps | null>(
    show ? `/api/goto/${encodeURIComponent(name)}` : null,
    fetcher
  );

  const [url, setURL] = useState<string>(`/goto/${encodeURIComponent(name)}`);

  useEffect(() => {
    if (data?.url) {
      setURL(data.url);
    }
  }, [data?.url]);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setShow(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setShow(false), 120);
  };

  return (
    <div
      className='relative inline-block'
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link href={url} className={className} tabIndex={0}>
        {children}
      </Link>
      {show && (
        <div
          className='absolute z-50 left-1/2 -translate-x-1/2 mt-2'
          style={{ minWidth: 260, maxWidth: 320 }}
        >
          <div className='pointer-events-none'>
            {isLoading ? (
              <div className='w-full max-w-xs p-4 flex flex-row items-start bg-gray-100 dark:bg-gray-800 rounded-lg shadow-md animate-pulse'>
                <div className='w-24 h-24 flex-shrink-0 bg-gray-200 dark:bg-gray-700 rounded-lg mr-4' />
                <div className='flex flex-col flex-1 space-y-2'>
                  <div className='h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded' />
                  <div className='h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded' />
                  <div className='h-3 w-28 bg-gray-200 dark:bg-gray-700 rounded' />
                </div>
              </div>
            ) : data ? (
              <PreviewCard {...data} />
            ) : (
              <div className='w-full max-w-xs p-4 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg shadow-md'>
                <div className='text-gray-400 text-lg'>未找到“{name}”的跳转目标</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
