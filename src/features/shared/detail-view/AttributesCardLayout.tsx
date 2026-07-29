'use client';

import { ReactNode, type CSSProperties } from 'react';

import { componentTokens, designTokens } from '@/lib/design';
import { useMobile } from '@/hooks/useMediaQuery';
import { useEditMode } from '@/context/EditModeContext';
import DiscussEditButtons from '@/components/ui/DiscussEditButtons';
import EntityCardFrame from '@/components/ui/EntityCardFrame';
import GameImage from '@/components/ui/GameImage';
import PageTitle from '@/components/ui/PageTitle';

interface AttributesCardLayoutProps {
  imageUrl: string;
  alt: string;
  title: ReactNode;
  subtitle?: ReactNode | undefined;
  aliases?: readonly string[] | undefined;
  aliasLabel?: string | undefined;
  aliasesContent?: ReactNode | undefined;
  attributes: ReactNode;
  navigation?: ReactNode | undefined;
  wikiHistory?: ReactNode | undefined;
}

export default function AttributesCardLayout({
  imageUrl,
  alt,
  title,
  subtitle,
  aliases,
  aliasLabel = '别名',
  aliasesContent,
  attributes,
  navigation,
  wikiHistory,
}: AttributesCardLayoutProps) {
  const isMobile = useMobile();
  const { isEditMode } = useEditMode();
  const spacing = designTokens.spacing;
  const spacingVars = {
    '--space-xs': spacing.xs,
    '--space-xs4': spacing.xs4,
    '--space-md': spacing.md,
  } as const;
  const aliasList = (aliases ?? []).filter(Boolean);

  return (
    <div style={spacingVars as CSSProperties}>
      <EntityCardFrame variant='detail'>
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
                <PageTitle className='py-0 pt-(--space-xs) text-2xl md:text-2xl'>
                  {title}{' '}
                </PageTitle>
                <DiscussEditButtons compact isEditMode={isEditMode} className='mt-1' />
                {subtitle && (
                  <p className='text-lg font-normal text-gray-400 dark:text-gray-500'>{subtitle}</p>
                )}
                {aliasList.length > 0 && (
                  <p className='text-xs text-gray-400 dark:text-gray-500'>
                    {aliasLabel}: {aliasList.join('、')}
                  </p>
                )}
                {aliasesContent && (
                  <div className='mt-1 text-xs text-gray-400 dark:text-gray-500'>
                    {aliasesContent}
                  </div>
                )}
                {wikiHistory}
              </div>
            </div>
          </div>
        ) : (
          <div className='pb-(--space-xs4)'>
            <GameImage src={imageUrl} alt={alt} size='CARD_DETAILS' />
            <div className='px-(--space-md) pt-(--space-xs)'>
              <PageTitle className='py-0 text-3xl md:text-3xl'>
                {title}{' '}
                {subtitle && (
                  <span className='text-xl font-normal text-gray-400 dark:text-gray-500'>
                    {subtitle}
                  </span>
                )}
              </PageTitle>
              <DiscussEditButtons compact isEditMode={isEditMode} className='mt-2' />
            </div>
            {aliasList.length > 0 && (
              <div className='mx-(--space-md) text-sm text-gray-400 dark:text-gray-500'>
                {aliasLabel}: {aliasList.join('、')}
              </div>
            )}
            {aliasesContent && (
              <div className='mx-(--space-md) mt-1 text-sm text-gray-400 dark:text-gray-500'>
                {aliasesContent}
              </div>
            )}
            <div className='mx-(--space-md) text-sm text-gray-400 dark:text-gray-500'>
              {wikiHistory}
            </div>
          </div>
        )}

        <div className='mx-(--space-md) grid items-center gap-1 border-t border-gray-300 py-(--space-xs4) dark:border-gray-600'>
          {attributes}
        </div>

        {navigation}
      </EntityCardFrame>
    </div>
  );
}
