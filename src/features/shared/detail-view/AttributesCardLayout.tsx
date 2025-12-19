'use client';

import { ReactNode, type CSSProperties } from 'react';

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
  const spacingVars = {
    '--space-xs': spacing.xs,
    '--space-xs4': spacing.xs4,
    '--space-md': spacing.md,
  } as const;
  const aliasList = (aliases ?? []).filter(Boolean);

  return (
    <div style={spacingVars as CSSProperties}>
      <BaseCard variant='details'>
        {isMobile ? (
          <div>
            <div
              className='auto-fit-grid grid-container grid'
              style={{
                gridTemplateColumns: `5rem repeat(auto-fit, minmax(1px,1fr))`,
              }}
            >
              <GameImage
                src={imageUrl}
                alt={alt}
                size='CARD_DETAILS'
                style={{
                  height: '6rem',
                  borderRadius: componentTokens.image.container.borderRadius.replace(
                    / .*? /,
                    ' 0 '
                  ),
                }}
              />
              <div>
                <h1 className='pt-[var(--space-xs)] text-2xl font-bold dark:text-white'>
                  {title}{' '}
                </h1>
                {subtitle && (
                  <h1 className='text-lg font-normal text-gray-400 dark:text-gray-500'>
                    {subtitle}
                  </h1>
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
          <div className='pb-[var(--space-xs4)]'>
            <GameImage src={imageUrl} alt={alt} size='CARD_DETAILS' />
            <div className='px-[var(--space-md)] pt-[var(--space-xs)]'>
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
              <div className='mx-[var(--space-md)] text-sm text-gray-400 dark:text-gray-500'>
                {aliasLabel}: {aliasList.join('、')}
              </div>
            )}
          </div>
        )}

        <div className='mx-[var(--space-md)] grid items-center gap-1 border-t border-gray-300 py-[var(--space-xs4)] dark:border-gray-600'>
          {attributes}
        </div>

        {navigation}
      </BaseCard>
    </div>
  );
}
