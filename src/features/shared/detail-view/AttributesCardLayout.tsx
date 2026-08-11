'use client';

import { ReactNode } from 'react';

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
  const aliasList = (aliases ?? []).filter(Boolean);

  return (
    <div>
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
                }}
              />
              <div>
                <PageTitle className='py-0 pt-2 text-2xl md:text-2xl'>{title} </PageTitle>
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
          <div className='pb-1'>
            <GameImage src={imageUrl} alt={alt} size='CARD_DETAILS' />
            <div className='px-4 pt-2'>
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
              <div className='mx-4 text-sm text-gray-400 dark:text-gray-500'>
                {aliasLabel}: {aliasList.join('、')}
              </div>
            )}
            {aliasesContent && (
              <div className='mx-4 mt-1 text-sm text-gray-400 dark:text-gray-500'>
                {aliasesContent}
              </div>
            )}
            <div className='mx-4 text-sm text-gray-400 dark:text-gray-500'>{wikiHistory}</div>
          </div>
        )}

        <div className='mx-4 grid items-center gap-1 border-t border-gray-300 py-1 dark:border-gray-600'>
          {attributes}
        </div>

        {navigation}
      </EntityCardFrame>
    </div>
  );
}
