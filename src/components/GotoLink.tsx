// GotoLink.tsx
'use client';

import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import PreviewCard, { GotoPreviewCardProps } from './ui/PreviewCard';
import Link from 'next/link';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

type GotoLinkProps = {
  name: string;
  className?: string;
  children: React.ReactNode;
  asPreviewOnly?: boolean; // when true, do not navigate; only show preview tooltip
  hideImagePreview?: boolean; // when true, hide image in preview content
};

export default function GotoLink({
  name,
  className,
  children,
  asPreviewOnly = false,
  hideImagePreview = false,
}: GotoLinkProps) {
  const [open, setOpen] = useState(false);

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
    open ? `/api/goto/${encodeURIComponent(name)}` : null,
    fetcher
  );

  const [url, setURL] = useState<string>(`/goto/${encodeURIComponent(name)}`);

  useEffect(() => {
    if (data?.url) {
      setURL(data.url);
    }
  }, [data?.url]);

  const previewContent = isLoading ? (
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
      <div className='text-gray-400 text-lg'>未找到&ldquo;{name}&rdquo;的跳转目标</div>
    </div>
  );

  return (
    <TooltipPrimitive.Provider delayDuration={120}>
      <TooltipPrimitive.Root open={open} onOpenChange={setOpen}>
        <TooltipPrimitive.Trigger asChild>
          <span className='inline-block'>
            {asPreviewOnly ? (
              <span className={className} tabIndex={0}>
                {children}
              </span>
            ) : (
              <Link href={url} className={className} tabIndex={0}>
                {children}
              </Link>
            )}
          </span>
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side='bottom'
            align='center'
            sideOffset={8}
            className='z-50 pointer-events-none'
            style={{ minWidth: 260, maxWidth: 320 }}
          >
            {isLoading ? (
              previewContent
            ) : data ? (
              <PreviewCard {...data} hideImage={hideImagePreview} />
            ) : (
              previewContent
            )}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
