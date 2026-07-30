'use client';

import useSWR from 'swr';

import type { InteractiveMapPoint } from '@/data/types';
import TextWithHoverTooltips from '@/features/shared/components/TextWithHoverTooltips';
import SingleItemButton from '@/components/ui/SingleItemButton';

import {
  getGeometryBarrelInstructions,
  getMapPointRelatedEntryDescriptionUrl,
  MAP_CATEGORY_LABELS,
} from './mapUtils';

const fetchRelatedEntryDescription = async (url: string): Promise<string | undefined> => {
  const response = await fetch(url);
  if (!response.ok) return undefined;

  const result: unknown = await response.json();
  if (
    result &&
    typeof result === 'object' &&
    'description' in result &&
    typeof result.description === 'string' &&
    result.description.trim()
  ) {
    return result.description;
  }

  return undefined;
};

export default function PointDetails({
  point,
  connectedPoint,
  geometryBarrelTarget,
  idleFruitPlateTarget,
  isGeometryBarrelRouteComplete,
  isEditMode,
  onNavigateToConnectedPoint,
  onNavigateToGeometryBarrelTarget,
  onNavigateToIdleFruitPlateTarget,
  onClose,
}: {
  point: InteractiveMapPoint;
  connectedPoint: InteractiveMapPoint | null;
  geometryBarrelTarget: InteractiveMapPoint | null;
  idleFruitPlateTarget: InteractiveMapPoint | null;
  isGeometryBarrelRouteComplete: boolean;
  isEditMode: boolean;
  onNavigateToConnectedPoint: () => void;
  onNavigateToGeometryBarrelTarget: () => void;
  onNavigateToIdleFruitPlateTarget: () => void;
  onClose: () => void;
}) {
  const hasCustomDescription = Boolean(point.description?.trim());
  const geometryBarrelInstructions = isGeometryBarrelRouteComplete
    ? getGeometryBarrelInstructions(point)
    : null;
  const idleFruitPlateInstructions =
    point.category === 'idleFruitPlate'
      ? '老鼠在此点位购买果盘后，可使用果盘攻击地图标注的对应墙缝。'
      : null;
  const relatedEntry = point.relatedEntries?.[0];
  const relatedEntryDescriptionUrl =
    !hasCustomDescription &&
    !geometryBarrelInstructions &&
    !idleFruitPlateInstructions &&
    relatedEntry
      ? getMapPointRelatedEntryDescriptionUrl(relatedEntry)
      : null;
  const { data: relatedEntryDescription, isLoading: isRelatedEntryDescriptionLoading } = useSWR<
    string | undefined
  >(relatedEntryDescriptionUrl, fetchRelatedEntryDescription);

  const description = geometryBarrelInstructions
    ? `${geometryBarrelInstructions}${hasCustomDescription ? `\n\n补充说明：\n${point.description}` : ''}`
    : idleFruitPlateInstructions
      ? `${idleFruitPlateInstructions}${hasCustomDescription ? `\n\n补充说明：\n${point.description}` : ''}`
      : hasCustomDescription
        ? point.description
        : (relatedEntryDescription ??
          (isRelatedEntryDescriptionLoading ? '' : isEditMode ? '请在标注面板中补充介绍。' : ''));

  return (
    <aside className='bg-surface-raised text-foreground absolute right-0 bottom-0 left-0 z-700 max-h-[52%] overflow-auto rounded-t-2xl p-5 shadow-2xl md:top-0 md:left-auto md:h-full md:max-h-none md:w-80 md:rounded-none md:pt-14'>
      <button
        type='button'
        onClick={onClose}
        aria-label='关闭点位介绍'
        className='absolute top-3 right-3 rounded-full bg-slate-200/90 px-2 text-2xl leading-none text-slate-700 shadow-sm md:right-auto md:left-3 dark:bg-slate-800/90 dark:text-white'
      >
        ×
      </button>
      <p className='text-xs font-medium text-cyan-600 dark:text-cyan-300'>
        {point.subtype ?? MAP_CATEGORY_LABELS[point.category]}
      </p>
      <h3 className='mt-1 pr-8 text-xl font-bold'>{MAP_CATEGORY_LABELS[point.category]}</h3>
      {point.isRandomCandidate && (
        <span className='mt-2 inline-block rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-900'>
          随机候选点，同局不一定出现
        </span>
      )}
      {connectedPoint && point.connection && (
        <div className='mt-4 rounded-xl border border-cyan-200 bg-cyan-50 p-3 dark:border-cyan-800 dark:bg-cyan-950/50'>
          <div className='flex items-center gap-2'>
            <span className='flex size-7 shrink-0 items-center justify-center rounded-full bg-violet-700 text-xs font-bold text-white'>
              {point.connection.label ?? '↔'}
            </span>
            <div className='min-w-0'>
              <p className='text-xs text-slate-500 dark:text-slate-400'>
                {point.connection.direction === 'outbound' ? '单向通行' : '双向通行'}
              </p>
              <p className='truncate text-sm font-semibold'>
                通往：{connectedPoint.subtype ?? '对应管道'}
              </p>
            </div>
          </div>
          <button
            type='button'
            onClick={onNavigateToConnectedPoint}
            className='mt-3 w-full rounded-lg bg-cyan-700 px-3 py-2 text-sm font-medium text-white hover:bg-cyan-600'
          >
            查看对应管道
          </button>
        </div>
      )}
      {geometryBarrelTarget && (
        <div className='mt-4 rounded-xl border border-orange-200 bg-orange-50 p-3 dark:border-orange-800 dark:bg-orange-950/50'>
          <p className='text-xs text-slate-500 dark:text-slate-400'>火药桶飞行路线</p>
          <p className='mt-1 truncate text-sm font-semibold'>终点：目标火箭</p>
          <button
            type='button'
            onClick={onNavigateToGeometryBarrelTarget}
            className='mt-3 w-full rounded-lg bg-orange-700 px-3 py-2 text-sm font-medium text-white hover:bg-orange-600'
          >
            查看目标火箭
          </button>
        </div>
      )}
      {idleFruitPlateTarget && (
        <div className='mt-4 rounded-xl border border-lime-200 bg-lime-50 p-3 dark:border-lime-800 dark:bg-lime-950/50'>
          <p className='text-xs text-slate-500 dark:text-slate-400'>果盘攻击路线</p>
          <p className='mt-1 truncate text-sm font-semibold'>
            目标：{idleFruitPlateTarget.subtype ?? '对应墙缝'}
          </p>
          <button
            type='button'
            onClick={onNavigateToIdleFruitPlateTarget}
            className='mt-3 w-full rounded-lg bg-lime-700 px-3 py-2 text-sm font-medium text-white hover:bg-lime-600'
          >
            查看对应墙缝
          </button>
        </div>
      )}
      <p className='mt-4 text-sm leading-6 whitespace-pre-wrap text-slate-700 dark:text-slate-200'>
        <TextWithHoverTooltips text={description ?? ''} />
      </p>
      {point.relatedEntries && point.relatedEntries.length > 0 && (
        <div className='mt-4 grid gap-2'>
          {point.relatedEntries.map((entry) => (
            <SingleItemButton key={`${entry.type}-${entry.name}`} singleItem={entry} />
          ))}
        </div>
      )}
    </aside>
  );
}
