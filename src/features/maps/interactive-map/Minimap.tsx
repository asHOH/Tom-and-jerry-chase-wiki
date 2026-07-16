'use client';

import { useEffect, useRef, type CSSProperties, type MouseEvent as ReactMouseEvent } from 'react';

import type { InteractiveMapConfig, MapCoordinate, MapPointCategory } from '@/data/types';
import Image from '@/components/Image';

import { CATEGORY_ICONS } from './constants';
import {
  getRoomCenter,
  isMinimapPointVisible,
  MAP_CATEGORY_LABELS,
  minimapPixelsToCoordinate,
} from './mapUtils';

type MinimapDiagramProps = {
  config: InteractiveMapConfig;
  previewUrl?: string | undefined;
  visibleCategories: ReadonlySet<MapPointCategory>;
  hiddenSubtypes: ReadonlySet<string>;
  highlightedPointIds: ReadonlySet<string>;
  interactive: boolean;
  onNavigate?: ((coordinate: MapCoordinate) => void) | undefined;
};

function MinimapDiagram({
  config,
  previewUrl,
  visibleCategories,
  hiddenSubtypes,
  highlightedPointIds,
  interactive,
  onNavigate,
}: MinimapDiagramProps) {
  const handleClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!interactive || !onNavigate) return;
    event.stopPropagation();
    onNavigate(
      minimapPixelsToCoordinate(
        event.clientX,
        event.clientY,
        event.currentTarget.getBoundingClientRect()
      )
    );
  };

  const handlePointClick = (event: ReactMouseEvent<HTMLButtonElement>, position: MapCoordinate) => {
    if (!interactive || !onNavigate) return;
    event.stopPropagation();
    onNavigate(position);
  };

  const pointsToDisplay = config.points.filter(
    (point) =>
      (point.id && highlightedPointIds.has(point.id)) ||
      isMinimapPointVisible(point, visibleCategories, hiddenSubtypes)
  );
  const pathsToDisplay = pointsToDisplay.flatMap((point) => point.minimapPaths ?? []);

  return (
    <div
      className={`relative h-full w-full overflow-hidden bg-slate-950/50 ${interactive ? 'cursor-crosshair' : ''}`}
      role='group'
      aria-label='地图房间示意图'
      onClick={handleClick}
    >
      {previewUrl && (
        <div className='pointer-events-none absolute inset-0'>
          <Image
            src={previewUrl}
            alt=''
            fill
            sizes='(max-width: 640px) 176px, 256px'
            className='object-fill opacity-55 blur-[0.5px] saturate-50'
            aria-hidden='true'
          />
        </div>
      )}
      <div className='pointer-events-none absolute inset-0 bg-slate-950/45' aria-hidden='true' />
      <svg
        className='pointer-events-none absolute inset-0 h-full w-full'
        viewBox='0 0 1000 1000'
        preserveAspectRatio='none'
        aria-hidden='true'
      >
        {config.rooms.flatMap((room) =>
          room.polygons.map((polygon, index) => (
            <polygon
              key={`${room.name}-${index}`}
              points={polygon.map((point) => `${point.x * 1000},${point.y * 1000}`).join(' ')}
              fill='rgb(15 23 42 / 48%)'
              stroke='rgb(203 213 225 / 55%)'
              strokeWidth='2'
              vectorEffect='non-scaling-stroke'
              strokeLinejoin='round'
            />
          ))
        )}
        {pathsToDisplay.map((path, pathIndex) => (
          <g key={`minimap-path-${pathIndex}`} aria-hidden='true'>
            <polyline
              points={path.map((point) => `${point.x * 1000},${point.y * 1000}`).join(' ')}
              fill='none'
              stroke='rgb(250 204 21 / 38%)'
              strokeWidth='10'
              strokeLinecap='round'
              strokeLinejoin='round'
              vectorEffect='non-scaling-stroke'
            />
            <polyline
              points={path.map((point) => `${point.x * 1000},${point.y * 1000}`).join(' ')}
              fill='none'
              stroke='rgb(253 224 71 / 95%)'
              strokeWidth='4'
              strokeDasharray='12 8'
              strokeLinecap='round'
              strokeLinejoin='round'
              vectorEffect='non-scaling-stroke'
            />
          </g>
        ))}
      </svg>
      {config.rooms.map((room) => (
        <div key={room.name} className='pointer-events-none absolute inset-0'>
          {room.showLabel !== false &&
            (() => {
              const center = getRoomCenter(room);
              if (!center) return null;

              const labelStyle: CSSProperties = {
                left: `${center.x * 100}%`,
                top: `${center.y * 100}%`,
                writingMode: 'horizontal-tb',
              };

              return (
                <span
                  className='absolute -translate-x-1/2 -translate-y-1/2 text-center text-[11px] leading-none font-semibold whitespace-nowrap text-slate-200/60 drop-shadow-[0_1px_2px_rgb(0_0_0/0.9)] sm:text-sm'
                  style={labelStyle}
                >
                  {room.name}
                </span>
              );
            })()}
        </div>
      ))}
      {pointsToDisplay.map((point, pointIndex) => {
        const source = CATEGORY_ICONS[point.category];
        const pointStyle: CSSProperties = {
          left: `${point.position.x * 100}%`,
          top: `${point.position.y * 100}%`,
        };
        const pointContent =
          point.category === 'pipe' && point.connection ? (
            <span
              className={`flex size-5 items-center justify-center rounded-full border text-[10px] font-bold text-white shadow sm:size-6 sm:text-xs ${
                point.id && highlightedPointIds.has(point.id)
                  ? 'border-cyan-200 bg-cyan-500 ring-2 ring-cyan-300/70'
                  : 'border-violet-200 bg-violet-700/90'
              }`}
            >
              {point.connection.label ?? '↔'}
            </span>
          ) : source ? (
            <Image
              src={encodeURI(source)}
              alt=''
              width={24}
              height={24}
              className='size-5 object-contain drop-shadow-md sm:size-6'
              aria-hidden='true'
            />
          ) : point.category === 'teleport' ? (
            <span className='block size-4 rounded-full border-2 border-fuchsia-200 bg-violet-600/80 shadow sm:size-5' />
          ) : (
            <span className='block size-3 rounded-full border border-cyan-50 bg-cyan-400 shadow sm:size-4' />
          );

        const pointChildren = pointContent;
        const pointClassName = `absolute -translate-x-1/2 -translate-y-1/2 ${point.isRandomCandidate ? 'opacity-50' : ''} ${interactive ? 'cursor-pointer appearance-none border-0 bg-transparent p-0' : 'pointer-events-none'}`;

        return interactive ? (
          <button
            type='button'
            key={pointIndex}
            className={pointClassName}
            style={pointStyle}
            aria-label={MAP_CATEGORY_LABELS[point.category]}
            onClick={(event) => handlePointClick(event, point.position)}
          >
            {pointChildren}
          </button>
        ) : (
          <span key={pointIndex} className={pointClassName} style={pointStyle} aria-hidden='true'>
            {pointChildren}
          </span>
        );
      })}
    </div>
  );
}

type MinimapProps = Omit<MinimapDiagramProps, 'interactive'> & {
  isExpanded: boolean;
  onExpand: () => void;
  onCollapse: () => void;
  onNavigate: (coordinate: MapCoordinate) => void;
};

export default function Minimap({
  config,
  previewUrl,
  visibleCategories,
  hiddenSubtypes,
  highlightedPointIds,
  isExpanded,
  onExpand,
  onCollapse,
  onNavigate,
}: MinimapProps) {
  const minimapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isExpanded) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node) || !minimapRef.current?.contains(target)) onCollapse();
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => document.removeEventListener('pointerdown', handlePointerDown, true);
  }, [isExpanded, onCollapse]);

  return (
    <div
      ref={minimapRef}
      className={`absolute top-3 left-12 z-500 overflow-hidden rounded-md border border-slate-400/30 bg-slate-950/70 shadow-[0_4px_18px_rgb(0_0_0/0.55)] transition-[width,height] ${isExpanded ? 'h-[13.5rem] w-[22.5rem] sm:h-72 sm:w-[30rem]' : 'h-36 w-60 sm:h-48 sm:w-80'}`}
    >
      {isExpanded ? (
        <div className='relative h-full w-full'>
          <MinimapDiagram
            config={config}
            previewUrl={previewUrl}
            visibleCategories={visibleCategories}
            hiddenSubtypes={hiddenSubtypes}
            highlightedPointIds={highlightedPointIds}
            interactive
            onNavigate={onNavigate}
          />
        </div>
      ) : (
        <button
          type='button'
          className='relative h-full w-full text-left'
          aria-label='展开小地图'
          onClick={(event) => {
            event.stopPropagation();
            onExpand();
          }}
        >
          <MinimapDiagram
            config={config}
            previewUrl={previewUrl}
            visibleCategories={visibleCategories}
            hiddenSubtypes={hiddenSubtypes}
            highlightedPointIds={highlightedPointIds}
            interactive={false}
          />
        </button>
      )}
    </div>
  );
}

type MinimapVisibilityButtonProps = {
  isVisible: boolean;
  onToggle: () => void;
};

export function MinimapVisibilityButton({ isVisible, onToggle }: MinimapVisibilityButtonProps) {
  const label = isVisible ? '隐藏小地图' : '显示小地图';

  return (
    <button
      type='button'
      className='absolute top-[76px] left-[10px] z-500 flex size-[30px] items-center justify-center rounded-sm border-2 border-black/20 bg-white text-slate-800 shadow-sm hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500'
      aria-label={label}
      aria-pressed={isVisible}
      title={label}
      onClick={onToggle}
    >
      <svg viewBox='0 0 24 24' className='size-[18px]' aria-hidden='true'>
        <path
          d='m3.5 5.5 5-2 7 2 5-2v15l-5 2-7-2-5 2v-15Z'
          fill='none'
          stroke='currentColor'
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth='1.8'
        />
        <path d='M8.5 3.5v15m7-13v15' fill='none' stroke='currentColor' strokeWidth='1.8' />
        {!isVisible && (
          <path
            d='m3 3 18 18'
            fill='none'
            stroke='currentColor'
            strokeLinecap='round'
            strokeWidth='2.4'
          />
        )}
      </svg>
    </button>
  );
}
