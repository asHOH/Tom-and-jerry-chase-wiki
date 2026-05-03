'use client';

import type { ReactNode } from 'react';

import { cn, componentTokens } from '@/lib/design';
import { useMobile } from '@/hooks/useMediaQuery';
import BaseCard from '@/components/ui/BaseCard';
import GameImage from '@/components/ui/GameImage';

type CatalogCardImageSize = keyof typeof componentTokens.image.dimensions;

type CatalogCardProps = {
  title: string;
  imageSrc: string;
  imageAlt: string;
  ariaLabel: string;
  tags?: ReactNode;
  tagsAriaLabel?: string;
  overlay?: ReactNode;
  href?: string;
  preserveEditParam?: boolean;
  imageSize?: CatalogCardImageSize;
  imageClassName?: string;
  contentClassName?: string;
  titleClassName?: string;
  tagsClassName?: string;
  className?: string;
  preload?: boolean;
  truncateTitle?: boolean;
  titleLengthForCompact?: number;
};

const defaultImageClassName = 'h-32 w-auto hover:scale-105 md:h-auto';
const defaultContentClassName = 'w-full pt-1 pb-3 text-center md:px-3';
const defaultTagsClassName =
  'flex flex-wrap items-center justify-center gap-1.5 text-sm text-gray-600 dark:text-gray-300';

export default function CatalogCard({
  title,
  imageSrc,
  imageAlt,
  ariaLabel,
  tags,
  tagsAriaLabel,
  overlay,
  href,
  preserveEditParam,
  imageSize = 'ITEM_CARD',
  imageClassName,
  contentClassName,
  titleClassName,
  tagsClassName,
  className,
  preload = false,
  truncateTitle = false,
  titleLengthForCompact = 6,
}: CatalogCardProps) {
  const isMobile = useMobile();
  const shouldUseCompactTitle = isMobile && title.length >= titleLengthForCompact;
  const navigationProps = href
    ? {
        href,
        preserveEditParam: preserveEditParam ?? false,
      }
    : {};

  return (
    <BaseCard
      variant='item'
      aria-label={ariaLabel}
      className={className ?? ''}
      {...navigationProps}
    >
      <div className={overlay ? 'relative' : undefined}>
        <GameImage
          src={imageSrc}
          alt={imageAlt}
          size={imageSize}
          className={cn(defaultImageClassName, imageClassName)}
          preload={preload}
        />
        {overlay}
      </div>
      <div className={cn(defaultContentClassName, contentClassName)}>
        <h3
          className={cn(
            truncateTitle
              ? 'h-6 truncate overflow-hidden font-bold whitespace-nowrap text-gray-800 dark:text-white'
              : 'h-6 font-bold whitespace-pre text-gray-800 dark:text-white',
            shouldUseCompactTitle ? 'text-md' : 'mb-1 text-lg',
            titleClassName
          )}
          title={truncateTitle ? title : undefined}
        >
          {title}
        </h3>
        {tags && (
          <div
            className={cn(defaultTagsClassName, tagsClassName)}
            role='group'
            aria-label={tagsAriaLabel ?? `${title}属性`}
          >
            {tags}
          </div>
        )}
      </div>
    </BaseCard>
  );
}
