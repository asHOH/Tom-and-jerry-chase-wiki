// GotoLink.tsx
'use client';

import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import PreviewCard, { GotoPreviewCardProps } from './ui/PreviewCard';
import type { CategoryHint } from '@/lib/types';
import Link from 'next/link';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

type GotoLinkProps = {
  name: string;
  className?: string;
  children: React.ReactNode;
  asPreviewOnly?: boolean; // when true, do not navigate; only show preview tooltip
  hideImagePreview?: boolean; // when true, hide image in preview content
  categoryHint?: CategoryHint; // optional type/category hint to disambiguate targets
};

export default function GotoLink({
  name,
  className,
  children,
  asPreviewOnly = false,
  hideImagePreview = false,
  categoryHint,
}: GotoLinkProps) {
  const [open, setOpen] = useState(false);
  // Use a thinner, solid underline with a small offset by default.
  // Caller-supplied className (e.g., 'no-underline' or custom thickness) will override due to ordering.
  const linkClasses = ['decoration-1 underline-offset-2 decoration-solid', className ?? '']
    .join(' ')
    .trim();

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
        ...(result.factionId ? { factionId: result.factionId } : {}),
        ...(result.ownerName ? { ownerName: result.ownerName } : {}),
        ...(result.ownerFactionId ? { ownerFactionId: result.ownerFactionId } : {}),
        ...(result.skillLevel ? { skillLevel: result.skillLevel } : {}),
        ...(result.skillType ? { skillType: result.skillType } : {}),
        ...(result.skillLevelDescription
          ? { skillLevelDescription: result.skillLevelDescription }
          : {}),
      };
    }
    return null;
  };

  const { data, isLoading } = useSWR<GotoPreviewCardProps | null>(
    open
      ? `/api/goto/${encodeURIComponent(name)}${
          categoryHint ? `?category=${encodeURIComponent(categoryHint)}` : ''
        }`
      : null,
    fetcher
  );

  const [url, setURL] = useState<string>(
    `/goto/${encodeURIComponent(name)}${categoryHint ? `?category=${encodeURIComponent(categoryHint)}` : ''}`
  );

  useEffect(() => {
    if (data?.url) {
      setURL(data.url);
    }
  }, [data?.url]);

  const previewContent = isLoading ? (
    <div className='w-full p-4 flex flex-row items-start bg-gray-100 dark:bg-gray-800 rounded-lg shadow-md animate-pulse'>
      <div className='w-24 h-24 flex-shrink-0 bg-gray-200 dark:bg-gray-700 rounded-lg mr-4' />
      <div className='flex flex-col flex-1 space-y-2'>
        <div className='h-4 w-1/3 bg-gray-200 dark:bg-gray-700 rounded' />
        <div className='h-6 w-1/2 bg-gray-200 dark:bg-gray-700 rounded' />
        <div className='h-3 w-2/5 bg-gray-200 dark:bg-gray-700 rounded' />
      </div>
    </div>
  ) : data ? (
    <PreviewCard
      {...data}
      clickable={false}
      hideImage={hideImagePreview}
      className='w-full max-w-none'
    />
  ) : (
    <div className='w-full p-4 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg shadow-md'>
      <div className='text-gray-400 text-lg'>未找到&ldquo;{name}&rdquo;的跳转目标</div>
    </div>
  );

  return (
    <TooltipPrimitive.Provider delayDuration={120}>
      <TooltipPrimitive.Root open={open} onOpenChange={setOpen}>
        <TooltipPrimitive.Trigger asChild>
          <span className='inline-block'>
            {asPreviewOnly ? (
              <span className={linkClasses} tabIndex={0}>
                {children}
              </span>
            ) : (
              <Link href={url} className={linkClasses} tabIndex={0}>
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
            style={{ width: 'clamp(320px, 50vw, 640px)' }}
          >
            {previewContent}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
