'use client';

import { ReactNode } from 'react';

import { componentTokens, designTokens } from '@/lib/design-tokens';
import { useMobile } from '@/hooks/useMediaQuery';
import BaseCard from '@/components/ui/BaseCard';
import GameImage from '@/components/ui/GameImage';

interface AttributesCardLayoutProps {
  imageUrl: string;
  alt: string;
  title: ReactNode;
  subtitle?: ReactNode | undefined;
  aliases?: string[] | undefined;
  aliasLabel?: string | undefined;
  attributes: ReactNode;
  navigation?: ReactNode | undefined;
}

export default function AttributesCardLayout({
  imageUrl,
  alt,
  title,
  subtitle,
  aliases,
  aliasLabel = '别名',
  attributes,
  navigation,
}: AttributesCardLayoutProps) {
  const isMobile = useMobile();
  const spacing = designTokens.spacing;
  const aliasList = (aliases ?? []).filter(Boolean);

  return (
    <BaseCard variant='details'>
      {isMobile ? (
        <div>
          <div
            className='auto-fit-grid grid-container grid'
            style={{ gridTemplateColumns: `5rem repeat(auto-fit, minmax(1px,1fr))` }}
          >
            <GameImage
              src={imageUrl}
              alt={alt}
              size='CARD_DETAILS'
              style={{
                height: '6rem',
                borderRadius: componentTokens.image.container.borderRadius.replace(/ .*? /, ' 0 '),
              }}
            />
            <div>
              <h1 className='text-2xl font-bold dark:text-white' style={{ paddingTop: spacing.xs }}>
                {title}{' '}
              </h1>
              {subtitle && (
                <h1 className='text-lg font-normal text-gray-400 dark:text-gray-500'>{subtitle}</h1>
              )}
              {aliasList.length > 0 && (
                <h1 className='text-xs text-gray-400 dark:text-gray-500'>
                  {aliasLabel}: {aliasList.join('、')}
                </h1>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ paddingBottom: spacing.xs4 }}>
          <GameImage src={imageUrl} alt={alt} size='CARD_DETAILS' />
          <div
            style={{ paddingLeft: spacing.md, paddingRight: spacing.md, paddingTop: spacing.xs }}
          >
            <h1 className='text-3xl font-bold dark:text-white'>
              {title}{' '}
              {subtitle && (
                <span className='text-xl font-normal text-gray-400 dark:text-gray-500'>
                  {subtitle}
                </span>
              )}
            </h1>
          </div>
          {aliasList.length > 0 && (
            <div
              className='text-sm text-gray-400 dark:text-gray-500'
              style={{ marginLeft: spacing.md, marginRight: spacing.md }}
            >
              {aliasLabel}: {aliasList.join('、')}
            </div>
          )}
        </div>
      )}

      <div
        className='grid items-center gap-1 border-t border-gray-300 dark:border-gray-600'
        style={{
          marginLeft: spacing.md,
          marginRight: spacing.md,
          paddingTop: spacing.xs4,
          paddingBottom: spacing.xs4,
        }}
      >
        {attributes}
      </div>

      {navigation}
    </BaseCard>
  );
}
