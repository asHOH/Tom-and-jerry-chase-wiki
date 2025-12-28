'use client';

import { useEffect, useRef, useState } from 'react';

import { useMobile } from '@/hooks/useMediaQuery';
import { useSpecifyTypeKeyboardNavigation } from '@/hooks/useSpecifyTypeKeyboardNavigation';
import { useAppContext } from '@/context/AppContext';
import { Map as MapType } from '@/data/types';
import DetailShell, { DetailSection } from '@/features/shared/detail-view/DetailShell';
import DetailTextSection from '@/features/shared/detail-view/DetailTextSection';
import DetailTraitsCard from '@/features/shared/detail-view/DetailTraitsCard';
import Image from '@/components/Image';

import MapAttributesCard from './MapAttributesCard';

export default function MapDetailClient({ map }: { map: MapType }) {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);
  const modalBackgroundRef = useRef<HTMLDivElement>(null);
  const isMobile = useMobile();

  useSpecifyTypeKeyboardNavigation(map.name, 'map');
  const { isDetailedView } = useAppContext();

  // 处理图片加载完成事件
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = e.currentTarget as HTMLImageElement;
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;

    if (naturalWidth > 0 && naturalHeight > 0) {
      const aspectRatio = naturalWidth / naturalHeight;
      setImageAspectRatio(aspectRatio);
      setIsImageLoaded(true);
    }
  };

  // 处理图片点击
  const handleImageClick = () => {
    setIsFullScreen(true);
  };

  // 处理键盘事件
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullScreen) {
        setIsFullScreen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullScreen]);

  if (!map) return null;

  const sections: DetailSection[] = [
    {
      key: 'description',
      render: () => (
        <DetailTextSection
          title='地图描述'
          value={map.description ?? null}
          detailedValue={map.detailedDescription ?? null}
          isDetailedView={isDetailedView}
        >
          <div className='-mt-4'>
            <DetailTraitsCard singleItem={{ name: map.name, type: 'map' }} />
          </div>
        </DetailTextSection>
      ),
    },
  ];

  if (!!map.mapImageUrl) {
    sections.push({
      title: '地图预览',
      cardOptions: { variant: 'none' },
      content: (
        <div className='card dark:border-slate-700 dark:bg-slate-800'>
          {/* 图片容器 */}
          <div
            ref={imageRef}
            className='relative w-full cursor-pointer bg-gray-100 transition-transform active:scale-95 dark:bg-gray-800'
            style={{
              aspectRatio: imageAspectRatio ? `${imageAspectRatio}` : '16/9',
              maxHeight: isMobile ? '70vh' : '80vh',
              padding: isMobile ? '10px' : '0',
              WebkitTapHighlightColor: 'rgba(0,0,0,0.1)',
              touchAction: 'manipulation',
            }}
            onClick={handleImageClick}
            onTouchEnd={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleImageClick();
            }}
            onDoubleClick={!isMobile ? () => setIsFullScreen(true) : undefined}
            title={isMobile ? '点击放大图片' : '点击或双击放大图片'}
            role='button'
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsFullScreen(true);
              }
            }}
          >
            <Image
              src={map.mapImageUrl}
              alt={'地图缩略图'}
              fill
              placeholder='empty'
              sizes={isMobile ? '100vw' : '100vw'}
              loading={'lazy'}
              className='object-contain'
              draggable='false'
              onLoad={handleImageLoad}
            />
            {!isImageLoaded && (
              <div className='absolute inset-0 flex items-center justify-center'>
                <div className='text-gray-400 dark:text-gray-600'>图片加载中...</div>
              </div>
            )}
            <div className='pointer-events-none absolute right-2 bottom-2 rounded bg-black/60 px-2 py-1 text-xs text-white opacity-80'>
              {isMobile ? '点击放大' : '点击放大'}
            </div>
          </div>
        </div>
      ),
    });
  }

  return (
    <>
      <DetailShell
        leftColumn={<MapAttributesCard map={map} />}
        sections={sections}
        rightColumnProps={{ style: { whiteSpace: 'pre-wrap' } }}
      />

      {/* 全屏模态框 - 仅保留关闭按钮和ESC键关闭 */}
      {isFullScreen && (
        <div
          ref={modalBackgroundRef}
          className='fixed inset-0 z-50 flex items-center justify-center'
          role='dialog'
          aria-modal='true'
          aria-label='全屏图片预览'
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            pointerEvents: 'auto',
            zIndex: 50,
          }}
        >
          {/* 关闭按钮 */}
          <button
            className='absolute top-4 right-4 z-60 flex items-center justify-center rounded-full bg-black/60 text-2xl text-white hover:bg-black/80'
            style={{
              width: isMobile ? '50px' : '48px',
              height: isMobile ? '50px' : '48px',
              minWidth: '48px',
              minHeight: '48px',
            }}
            onClick={() => setIsFullScreen(false)}
            aria-label='关闭全屏预览'
          >
            ✕
          </button>

          {/* 图片容器 */}
          <div
            className='relative'
            style={{
              width: '100%',
              height: '100%',
              maxWidth: isMobile ? '95vw' : '90vw',
              maxHeight: isMobile ? '95vh' : '90vh',
              padding: isMobile ? '10px' : '20px',
              aspectRatio: imageAspectRatio ? `${imageAspectRatio}` : '16/9',
            }}
          >
            <Image
              src={map.mapImageUrl || ''}
              alt={'地图全屏预览'}
              fill
              className='object-contain'
              sizes='100vw'
              priority
              style={{
                WebkitTouchCallout: 'none',
                userSelect: 'none',
              }}
            />
          </div>

          {/* 提示信息 - 修改为仅提示关闭按钮和ESC键 */}
          <div className='absolute bottom-4 left-1/2 z-60 -translate-x-1/2 transform rounded-full bg-black/50 px-4 py-2 text-center text-sm whitespace-nowrap text-white/80'>
            点击关闭按钮{isMobile ? '' : '或按ESC键'}退出
          </div>
        </div>
      )}
    </>
  );
}
