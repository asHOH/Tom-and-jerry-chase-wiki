// GotoLink.tsx
'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import useSWR from 'swr';

import type { CategoryHint } from '@/lib/types';
import Link from '@/components/Link';

import PreviewCard, { GotoPreviewCardProps } from './ui/PreviewCard';

type GotoLinkProps = {
  name: string;
  className?: string;
  children: React.ReactNode;
  asPreviewOnly?: boolean; // when true, do not navigate; only show preview tooltip
  hideImagePreview?: boolean; // when true, hide image in preview content
  categoryHint?: CategoryHint; // optional type/category hint to disambiguate targets
  descMode?: 'description' | 'detailed'; // for skill descriptions/level descriptions in previews
};

export default function GotoLink({
  name,
  className,
  children,
  asPreviewOnly = false,
  hideImagePreview = false,
  categoryHint,
  descMode,
}: GotoLinkProps) {
  const [open, setOpen] = useState(false);
  const [isTouchEnvironment, setIsTouchEnvironment] = useState(false);
  const pointerTypeRef = useRef<'mouse' | 'pen' | 'touch' | 'unknown'>('unknown');
  const lastTapTimeRef = useRef<number>(0);
  const triggerRef = useRef<HTMLSpanElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const touchInstructionsId = useId();
  const DOUBLE_TAP_DELAY_MS = 350;

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const evaluateTouchEnvironment = () => {
      const hasCoarsePointer =
        typeof window.matchMedia === 'function'
          ? window.matchMedia('(pointer: coarse)').matches
          : false;
      const hasTouchPoints = navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
      setIsTouchEnvironment(hasCoarsePointer || hasTouchPoints);
    };

    evaluateTouchEnvironment();

    const mediaQueryList =
      typeof window.matchMedia === 'function' ? window.matchMedia('(pointer: coarse)') : null;

    if (mediaQueryList) {
      const handleChange = () => evaluateTouchEnvironment();
      if (typeof mediaQueryList.addEventListener === 'function') {
        mediaQueryList.addEventListener('change', handleChange);
        return () => mediaQueryList.removeEventListener('change', handleChange);
      }
      if (typeof mediaQueryList.addListener === 'function') {
        mediaQueryList.addListener(handleChange);
        return () => mediaQueryList.removeListener(handleChange);
      }
    }

    return undefined;
  }, []);

  useEffect(() => {
    if (!isTouchEnvironment || !open) {
      return;
    }

    const handleOutsidePress = (event: Event) => {
      const targetNode = event.target as Node | null;
      if (!targetNode) return;
      if (triggerRef.current?.contains(targetNode)) return;
      if (contentRef.current?.contains(targetNode)) return;
      setOpen(false);
      lastTapTimeRef.current = 0;
    };

    document.addEventListener('pointerdown', handleOutsidePress);
    document.addEventListener('touchstart', handleOutsidePress);

    return () => {
      document.removeEventListener('pointerdown', handleOutsidePress);
      document.removeEventListener('touchstart', handleOutsidePress);
    };
  }, [isTouchEnvironment, open]);
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

  const queryString = (() => {
    const sp = new URLSearchParams();
    if (categoryHint) sp.set('category', categoryHint);
    if (descMode) sp.set('descMode', descMode);
    const qs = sp.toString();
    return qs ? `?${qs}` : '';
  })();

  const { data, isLoading } = useSWR<GotoPreviewCardProps | null>(
    open ? `/api/goto/${encodeURIComponent(name)}${queryString}` : null,
    fetcher
  );

  const [url, setURL] = useState<string>(`/goto/${encodeURIComponent(name)}${queryString}`);

  useEffect(() => {
    if (data?.url) {
      setURL(data.url);
    }
  }, [data?.url]);

  const basePreviewContent = isLoading ? (
    <div className='flex w-full animate-pulse flex-row items-start rounded-lg bg-gray-100 p-4 shadow-md dark:bg-gray-800'>
      <div className='mr-4 h-24 w-24 shrink-0 rounded-lg bg-gray-200 dark:bg-gray-700' />
      <div className='flex flex-1 flex-col space-y-2'>
        <div className='h-4 w-1/3 rounded bg-gray-200 dark:bg-gray-700' />
        <div className='h-6 w-1/2 rounded bg-gray-200 dark:bg-gray-700' />
        <div className='h-3 w-2/5 rounded bg-gray-200 dark:bg-gray-700' />
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
    <div className='flex w-full flex-col items-center justify-center rounded-lg bg-gray-100 p-4 shadow-md dark:bg-gray-800'>
      <div className='text-lg text-gray-400'>未找到&ldquo;{name}&rdquo;的跳转目标</div>
    </div>
  );

  const previewContent =
    !isTouchEnvironment || asPreviewOnly ? (
      basePreviewContent
    ) : (
      <div className='space-y-2'>
        {basePreviewContent}
        <div className='flex justify-center'>
          <span className='rounded-md bg-gray-100/95 px-3 py-1 text-center text-xs text-gray-600 shadow-sm select-none dark:bg-gray-800/90 dark:text-gray-200'>
            双击跳转到对应页面
          </span>
        </div>
      </div>
    );

  const handlePointerDown = (event: React.PointerEvent<HTMLSpanElement>) => {
    pointerTypeRef.current = event.pointerType || 'unknown';
  };

  const handleTouchStart: React.TouchEventHandler<HTMLSpanElement> = () => {
    pointerTypeRef.current = 'touch';
  };

  const handleTriggerClick = (event: React.MouseEvent<HTMLElement>) => {
    const pointerType = pointerTypeRef.current;
    const isTouchInteraction =
      pointerType === 'touch' || (pointerType === 'unknown' && isTouchEnvironment);

    if (!isTouchInteraction) {
      return;
    }

    if (asPreviewOnly) {
      event.preventDefault();
      setOpen((previous) => !previous);
      lastTapTimeRef.current = Date.now();
      return;
    }

    const now = Date.now();
    const timeSinceLastTap = now - lastTapTimeRef.current;

    if (open && timeSinceLastTap > 0 && timeSinceLastTap < DOUBLE_TAP_DELAY_MS) {
      lastTapTimeRef.current = 0;
      setOpen(false);
      return;
    }

    event.preventDefault();
    lastTapTimeRef.current = now;
    setOpen(true);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (pointerTypeRef.current === 'touch') {
      if (!nextOpen && open) {
        // Ignore tooltip auto-close after touch; we manage closure manually.
        return;
      }
      setOpen(nextOpen);
      if (!nextOpen) {
        lastTapTimeRef.current = 0;
      }
      return;
    }

    setOpen(nextOpen);
  };

  const srOnlyInstructions = asPreviewOnly ? '单击可预览' : '单击可预览，双击跳转到对应页面';

  return (
    <TooltipPrimitive.Provider delayDuration={120}>
      <TooltipPrimitive.Root open={open} onOpenChange={handleOpenChange}>
        <TooltipPrimitive.Trigger asChild>
          <span
            className='inline-block'
            ref={triggerRef}
            onPointerDown={handlePointerDown}
            onTouchStart={handleTouchStart}
          >
            {asPreviewOnly ? (
              <span
                className={linkClasses}
                tabIndex={0}
                onClick={handleTriggerClick}
                aria-describedby={isTouchEnvironment ? touchInstructionsId : undefined}
              >
                {children}
                {isTouchEnvironment ? (
                  <span id={touchInstructionsId} className='sr-only'>
                    {srOnlyInstructions}
                  </span>
                ) : null}
              </span>
            ) : (
              <Link
                href={url}
                className={linkClasses}
                tabIndex={0}
                onClick={handleTriggerClick}
                aria-describedby={isTouchEnvironment ? touchInstructionsId : undefined}
              >
                {children}
                {isTouchEnvironment ? (
                  <span id={touchInstructionsId} className='sr-only'>
                    {srOnlyInstructions}
                  </span>
                ) : null}
              </Link>
            )}
          </span>
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side='bottom'
            align='center'
            sideOffset={8}
            className='pointer-events-none z-50'
            style={{ width: 'clamp(300px, 60vw, 720px)' }}
            ref={contentRef}
          >
            {previewContent}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
