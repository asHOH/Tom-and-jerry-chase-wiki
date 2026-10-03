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
            <div className='grid grid-cols-[5rem_minmax(0,1fr)] gap-3 p-3'>
              <GameImage
                src={imageUrl}
                alt={alt}
                size='CARD_DETAILS'
                style={{
                  height: '6rem',
                }}
              />
              <div className='min-w-0'>
                <PageTitle className='py-0 pt-2 text-2xl md:text-2xl'>{title} </PageTitle>
                <DiscussEditButtons compact isEditMode={isEditMode} className='mt-1' />
                {subtitle && (
                  <p className='text-muted-foreground text-lg font-normal'>{subtitle}</p>
                )}
                {aliasList.length > 0 && (
                  <p className='text-muted-foreground text-xs'>
                    {aliasLabel}: {aliasList.join('、')}
                  </p>
                )}
                {aliasesContent && (
                  <div className='text-muted-foreground mt-1 text-xs'>{aliasesContent}</div>
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
                  <span className='text-muted-foreground text-xl font-normal'>{subtitle}</span>
                )}
              </PageTitle>
              <DiscussEditButtons compact isEditMode={isEditMode} className='mt-2' />
            </div>
            {aliasList.length > 0 && (
              <div className='text-muted-foreground mx-4 text-sm'>
                {aliasLabel}: {aliasList.join('、')}
              </div>
            )}
            {aliasesContent && (
              <div className='text-muted-foreground mx-4 mt-1 text-sm'>{aliasesContent}</div>
            )}
            <div className='text-muted-foreground mx-4 text-sm'>{wikiHistory}</div>
          </div>
        )}

        <div className='border-border mx-4 grid min-w-0 items-center gap-2 border-t py-3'>
          {attributes}
        </div>

        {navigation}
      </EntityCardFrame>
    </div>
  );
}
