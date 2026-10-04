'use client';

import { useEffect, useRef, useState } from 'react';

import type { MapModeRelationCharacterLookup } from '@/lib/gameData/published/clientProjections';
import { useEditableDomain, useEditableEntity } from '@/hooks/useEditableGameData';
import { useLocalMap } from '@/hooks/useLocalEditEntity';
import { useMobile } from '@/hooks/useMediaQuery';
import { useSpecifyTypeKeyboardNavigation } from '@/hooks/useSpecifyTypeKeyboardNavigation';
import { useAppContext } from '@/context/AppContext';
import { useEditMode } from '@/context/EditModeContext';
import type { Map as MapType, SingleItem } from '@/data/types';
import MapModeCharacterRelations from '@/features/characters/components/MapModeCharacterRelations';
import { getSceneMapUrl } from '@/features/maps/sceneMapLinks';
import DetailOwnbuffsCard from '@/features/shared/detail-view/DetailOwnbuffsCard';
import DetailReverseCard from '@/features/shared/detail-view/DetailReverseCard';
import DetailShell, { DetailSection } from '@/features/shared/detail-view/DetailShell';
import DetailTextSection from '@/features/shared/detail-view/DetailTextSection';
import DetailTraitsCard from '@/features/shared/detail-view/DetailTraitsCard';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { editable } from '@/components/ui/editable';
import SingleItemButton from '@/components/ui/SingleItemButton';
import Image from '@/components/Image';

import MapAttributesCard from './MapAttributesCard';

export default function MapDetailClient({
  map,
  fixtureNames,
  modeNames,
  charactersData,
}: {
  map: MapType;
  fixtureNames: readonly string[];
  modeNames: readonly string[];
  charactersData: MapModeRelationCharacterLookup;
}) {
  const { isEditMode, isEditModeRequested, runtimeStatus } = useEditMode();
  const { mapName } = useLocalMap();
  const ed = editable('maps');

  const usesDraftData = isEditModeRequested && runtimeStatus === 'ready';
  const [editFixtures] = useEditableDomain('fixtures', {});
  const [effectiveMap] = useEditableEntity(
    { entityType: 'maps', entityId: mapName },
    map
  ) as unknown as readonly [MapType];

  const [isFullScreen, setIsFullScreen] = useState(false);
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);
  const modalBackgroundRef = useRef<HTMLDivElement>(null);
  const isMobile = useMobile();

  useSpecifyTypeKeyboardNavigation(effectiveMap.name, 'map');
  const { isDetailedView } = useAppContext();

  // 检索相关组件
  const ownFixtures = usesDraftData
    ? Object.entries(editFixtures)
        .filter(([_, fixture]) => fixture.supportedMaps?.includes(map.name))
        .map(([name]) => name)
    : fixtureNames;

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

  if (!effectiveMap) return null;

  const sections: DetailSection[] = [
    {
      key: 'description',
      content: (
        <DetailTextSection
          title='地图描述'
          value={effectiveMap.description}
          detailedValue={effectiveMap.detailedDescription}
          isDetailedView={isDetailedView}
          renderValue={
            isEditMode ? (
              <ed.span
                path={isDetailedView ? 'detailedDescription' : 'description'}
                initialValue={
                  isDetailedView
                    ? (effectiveMap.detailedDescription ?? effectiveMap.description ?? '')
                    : (effectiveMap.description ?? '')
                }
              />
            ) : undefined
          }
        >
          <div className='-mt-4 space-y-2'>
            <DetailTraitsCard singleItem={{ name: effectiveMap.name, type: 'map' }} />
            <DetailReverseCard singleItem={{ name: effectiveMap.name, type: 'map' }} />
            <DetailOwnbuffsCard singleItem={{ name: effectiveMap.name, type: 'map' }} />
          </div>
        </DetailTextSection>
      ),
    },
  ];
  if (ownFixtures.length > 0) {
    sections.push({
      key: 'fixtures',
      content: (
        <DetailTextSection
          title='相关组件'
          value={`共收录 $${ownFixtures.length}$text-indigo-700 dark:text-indigo-400# 个 $${effectiveMap.name}$text-fuchsia-600 dark:text-fuchsia-400# 存在的地图组件，点击下方按钮即可跳转。`}
          isDetailedView={isDetailedView}
        >
          <ul
            className='mx-2 mt-2 gap-2'
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            }}
          >
            {ownFixtures.map((fixtureName, key) => {
              return (
                <SingleItemButton
                  key={key}
                  singleItem={{ name: fixtureName, type: 'fixture' } as SingleItem}
                />
              );
            })}
          </ul>
        </DetailTextSection>
      ),
    });
  }
  const sceneMapUrl = getSceneMapUrl(mapName);
  if (sceneMapUrl) {
    sections.push({
      title: '场景地图',
      content: (
        <Card interactive className='overflow-hidden p-0'>
          <a
            href={sceneMapUrl}
            target='_blank'
            rel='noopener noreferrer'
            aria-label={`在猫鼠地图百科中查看${effectiveMap.name}（新窗口）`}
            className='flex min-h-36 flex-col items-center justify-center gap-3 p-6 text-center sm:min-h-44'
          >
            <span className='text-lg font-semibold text-blue-700 dark:text-blue-300'>
              打开猫鼠地图百科
            </span>
            <span className='text-sm text-gray-600 dark:text-gray-300'>
              浏览房间版本、地图组件与道具候选位置
            </span>
          </a>
        </Card>
      ),
    });
  } else if (effectiveMap.mapImageUrl) {
    sections.push({
      title: '地图预览',
      content: (
        <Card>
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
            title={'点击放大图片'}
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
              src={effectiveMap.mapImageUrl}
              alt={`${effectiveMap.name}地图预览`}
              fill
              placeholder='empty'
              sizes='100vw'
              loading='lazy'
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
              点击放大
            </div>
          </div>
        </Card>
      ),
    });
  }

  sections.push({
    key: 'character-relations',
    content: (
      <MapModeCharacterRelations
        targetName={effectiveMap.name}
        targetType='map'
        charactersData={charactersData}
      />
    ),
  });

  return (
    <>
      <DetailShell
        leftColumn={<MapAttributesCard map={effectiveMap} modeNames={modeNames} />}
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
          <Button
            variant='unstyled'
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
            ×
          </Button>

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
              src={effectiveMap.mapImageUrl || ''}
              alt={`${effectiveMap.name}地图预览`}
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

          {/* 提示信息 - 仅提示关闭按钮和ESC键 */}
          <div className='absolute bottom-4 left-1/2 z-60 -translate-x-1/2 transform rounded-full bg-black/50 px-4 py-2 text-center text-sm whitespace-nowrap text-white/80'>
            点击关闭按钮{isMobile ? '' : '或按ESC键'}退出
          </div>
        </div>
      )}
    </>
  );
}
