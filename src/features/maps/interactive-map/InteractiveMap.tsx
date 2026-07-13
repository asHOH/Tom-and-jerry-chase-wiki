'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import L, {
  type Coords,
  type DoneCallback,
  type LeafletMouseEvent,
  type TileLayerOptions,
} from 'leaflet';
import {
  ImageOverlay,
  MapContainer,
  Marker,
  Polygon,
  Polyline,
  Tooltip,
  useMap,
  useMapEvents,
} from 'react-leaflet';

import type {
  InteractiveMapConfig,
  InteractiveMapPoint,
  MapCoordinate,
  MapPointCategory,
  SingleItemTypeName,
} from '@/data/types';
import SingleItemButton from '@/components/ui/SingleItemButton';
import Image from '@/components/Image';

import {
  ALWAYS_VISIBLE_CATEGORIES,
  cloneInteractiveMap,
  coordinateToLatLng,
  DEFAULT_VISIBLE_CATEGORIES,
  getConnectedMapPoint,
  getDefaultMapPointRelatedEntries,
  getInteractiveMapAssetUrl,
  getMapBounds,
  getMapPointScale,
  getRoomCenter,
  isMinimapPointVisible,
  isPointVisible,
  isRandomCandidateByDefault,
  latLngToCoordinate,
  MAP_CATEGORY_LABELS,
  minimapPixelsToCoordinate,
  updateInteractiveMapPoint,
} from './mapUtils';

import 'leaflet/dist/leaflet.css';

type InteractiveMapProps = {
  config: InteractiveMapConfig;
  mapName: string;
  isEditMode: boolean;
  alwaysFullscreen?: boolean | undefined;
  fallbackImageUrl?: string | undefined;
  onConfigChange?: ((config: InteractiveMapConfig) => void) | undefined;
};

type EditorMode = 'browse' | 'selectRoom' | 'addPoint' | 'drawRoom';

const CATEGORY_ICONS: Partial<Record<MapPointCategory, string>> = {
  cheese: '/images/items/奶酪.png',
  rocket: '/images/items/火箭.png',
  fixture: '/images/fixtures/七色花.png',
  geometryBarrel: '/images/fixtures/桶.png',
};

const FILTER_STORAGE_KEY = 'interactive-map:visible-categories';

const teleportSvg = `
  <svg class="block h-full w-full" viewBox="0 0 48 48" aria-hidden="true">
    <defs><linearGradient id="portal" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#67e8f9"/><stop offset="1" stop-color="#8b5cf6"/></linearGradient></defs>
    <circle cx="24" cy="24" r="19" fill="#111827" fill-opacity=".88" stroke="url(#portal)" stroke-width="4"/>
    <path d="M15 25c4-8 14-10 20-4M33 16l2 5-5 1M33 25c-4 8-14 10-20 4M15 34l-2-5 5-1" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;

type ConnectionHighlight = 'endpoint' | 'unrelated' | undefined;

const escapeHtml = (value: string) =>
  value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

const makeIcon = (
  point: InteractiveMapPoint,
  selected: boolean,
  isEditMode: boolean,
  connectionHighlight?: ConnectionHighlight
) => {
  const isHotspot = ALWAYS_VISIBLE_CATEGORIES.has(point.category);
  const source = CATEGORY_ICONS[point.category];
  const isInvisible = point.isInvisible ?? false;
  const connectionBadge =
    point.category === 'pipe' && point.connection
      ? `<span class="interactive-map-pipe-badge" aria-hidden="true">${escapeHtml(point.connection.label ?? '↔')}</span>`
      : null;
  const content = connectionBadge
    ? connectionBadge
    : isInvisible
      ? `<span class="block h-full w-full rounded-full border-2 ${selected ? 'border-cyan-300 bg-cyan-300/25' : isEditMode ? 'border-dashed border-cyan-300/70 bg-cyan-300/10' : 'border-transparent'}"></span>`
      : isHotspot
        ? `<span class="block h-full w-full rounded-full border-2 ${selected ? 'border-cyan-300 bg-cyan-300/25' : 'border-transparent'}"></span>`
        : point.category === 'teleport'
          ? teleportSvg
          : source
            ? `<img src="${encodeURI(source)}" alt="" class="h-full w-full object-contain drop-shadow-md" />`
            : '';
  const [width, height] = isHotspot || isInvisible ? [32, 32] : [42, 42];
  const [anchorX, anchorY] = isHotspot || isInvisible ? [16, 16] : [21, 36];
  const html = `<span class="interactive-map-marker-content ${point.isRandomCandidate ? 'interactive-map-marker--random' : ''} ${selected ? 'interactive-map-marker--selected' : ''} ${connectionHighlight === 'endpoint' ? 'interactive-map-marker--connection-endpoint' : ''} ${connectionHighlight === 'unrelated' ? 'interactive-map-marker--connection-unrelated' : ''}" style="width:${width}px;height:${height}px;--interactive-map-marker-anchor-x:${anchorX}px;--interactive-map-marker-anchor-y:${anchorY}px">${content}</span>`;

  return L.divIcon({
    className: 'interactive-map-marker',
    html,
    iconSize: [width, height],
    iconAnchor: [anchorX, anchorY],
  });
};

const vertexIcon = L.divIcon({
  className: 'interactive-map-vertex',
  html: '<span></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const isAvifUrl = (url: string) => {
  const urlWithoutQuery = url.split(/[?#]/u)[0] ?? url;
  return urlWithoutQuery.toLowerCase().endsWith('.avif');
};

class NativePictureTileLayer extends L.TileLayer {
  protected override createTile(coords: Coords, done: DoneCallback): HTMLElement {
    const picture = document.createElement('picture');
    const source = document.createElement('source');
    const image = document.createElement('img');
    const webpUrl = this.getTileUrl(coords);
    const avifUrl = getInteractiveMapAssetUrl(webpUrl, 'avif');

    picture.className = 'leaflet-picture-tile';
    image.className = 'leaflet-picture-tile-image';
    image.alt = '';
    image.decoding = 'async';

    if (avifUrl && avifUrl !== webpUrl) {
      source.type = 'image/avif';
      source.srcset = avifUrl;
      picture.append(source);
    }

    image.onload = () => done(undefined, picture);
    image.onerror = () => {
      if (isAvifUrl(image.currentSrc || image.src)) {
        source.removeAttribute('srcset');
        image.src = webpUrl;
        return;
      }

      done(new Error('地图瓦片加载失败'), picture);
    };
    image.src = webpUrl;
    picture.append(image);

    return picture;
  }
}

type PictureTileLayerProps = {
  url: string;
  options: TileLayerOptions;
  onTileError: () => void;
};

function PictureTileLayer({ url, options, onTileError }: PictureTileLayerProps) {
  const map = useMap();

  useEffect(() => {
    const layer = new NativePictureTileLayer(url, options);
    layer.on('tileerror', onTileError);
    layer.addTo(map);

    return () => {
      layer.off('tileerror', onTileError);
      map.removeLayer(layer);
    };
  }, [map, onTileError, options, url]);

  return null;
}

function MainMapEvents({
  config,
  editorMode,
  onMapClick,
  onZoom,
  onReady,
}: {
  config: InteractiveMapConfig;
  editorMode: EditorMode;
  onMapClick: (event: LeafletMouseEvent) => void;
  onZoom: (zoom: number) => void;
  onReady: (map: L.Map) => void;
}) {
  const map = useMap();
  const { height, maxZoom, width } = config;
  const updatePointScale = useCallback(
    (nextZoom: number) => {
      map
        .getContainer()
        .style.setProperty(
          '--interactive-map-point-scale',
          String(getMapPointScale(nextZoom, config))
        );
    },
    [config, map]
  );

  useMapEvents({
    click: (event) => {
      if (editorMode !== 'browse') onMapClick(event);
    },
    zoom: () => {
      updatePointScale(map.getZoom());
      onZoom(map.getZoom());
    },
    zoomanim: (event) => {
      updatePointScale(event.zoom);
    },
  });

  useEffect(() => {
    onReady(map);
    const scale = 2 ** maxZoom;
    map.fitBounds(
      [
        [0, 0],
        [-height / scale, width / scale],
      ],
      { animate: false, padding: [8, 8] }
    );
    updatePointScale(map.getZoom());
    onZoom(map.getZoom());
    return () => {
      map.getContainer().style.removeProperty('--interactive-map-point-scale');
    };
  }, [height, map, maxZoom, onReady, onZoom, updatePointScale, width]);
  return null;
}

function LocatePoint({
  point,
  config,
}: {
  point: InteractiveMapPoint | null;
  config: InteractiveMapConfig;
}) {
  const map = useMap();
  useEffect(() => {
    if (!point) return;
    map.flyTo(coordinateToLatLng(point.position, config), Math.max(map.getZoom(), 3), {
      duration: 0.5,
    });
  }, [config, map, point]);
  return null;
}

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
      {config.points
        .filter(
          (point) =>
            (point.id && highlightedPointIds.has(point.id)) ||
            isMinimapPointVisible(point, visibleCategories, hiddenSubtypes)
        )
        .map((point, pointIndex) => {
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
              <span className='block size-4 rounded-full border-2 border-violet-200 bg-violet-600/90 shadow sm:size-5' />
            ) : (
              <span className='block size-3 rounded-full border border-cyan-50 bg-cyan-400 shadow sm:size-4' />
            );

          const pointChildren = (
            <>
              {point.isRandomCandidate && (
                <span className='absolute inset-1/2 block size-7 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-yellow-300 sm:size-8' />
              )}
              {pointContent}
            </>
          );
          const pointClassName = `absolute -translate-x-1/2 -translate-y-1/2 ${interactive ? 'cursor-pointer appearance-none border-0 bg-transparent p-0' : 'pointer-events-none'}`;

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

function Minimap({
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

export default function InteractiveMap({
  config: incomingConfig,
  mapName,
  isEditMode,
  alwaysFullscreen = false,
  fallbackImageUrl,
  onConfigChange,
}: InteractiveMapProps) {
  const [config, setConfig] = useState(() => cloneInteractiveMap(incomingConfig));
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMinimapExpanded, setIsMinimapExpanded] = useState(false);
  const [zoom, setZoom] = useState(incomingConfig.minZoom);
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
  const [tileFailed, setTileFailed] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const [visibleCategories, setVisibleCategories] = useState<Set<MapPointCategory>>(
    () => new Set(DEFAULT_VISIBLE_CATEGORIES)
  );
  const [hiddenSubtypes, setHiddenSubtypes] = useState<Set<string>>(new Set());
  const [editorMode, setEditorMode] = useState<EditorMode>('browse');
  const [pointCategory, setPointCategory] = useState<MapPointCategory>('cheese');
  const [roomName, setRoomName] = useState('');
  const [draftPolygon, setDraftPolygon] = useState<[number, number][]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const isFullscreenActive = alwaysFullscreen || isFullscreen;
  const undoStack = useRef<InteractiveMapConfig[]>([]);
  const redoStack = useRef<InteractiveMapConfig[]>([]);
  const mainMapRef = useRef<L.Map | null>(null);
  const selectedPoint =
    selectedPointIndex === null ? null : (config.points[selectedPointIndex] ?? null);
  const connectedPoint = selectedPoint ? getConnectedMapPoint(config, selectedPoint) : null;
  const highlightedPointIds = useMemo(() => {
    const ids = new Set<string>();
    if (selectedPoint?.id && connectedPoint) ids.add(selectedPoint.id);
    if (connectedPoint?.point.id) ids.add(connectedPoint.point.id);
    return ids;
  }, [connectedPoint, selectedPoint]);
  const mapBounds = useMemo(
    () =>
      getMapBounds({
        height: config.height,
        maxZoom: config.maxZoom,
        width: config.width,
      }),
    [config.height, config.maxZoom, config.width]
  );
  const webpTileUrl = getInteractiveMapAssetUrl(config.tileUrl, 'webp') ?? config.tileUrl;
  const previewUrl = getInteractiveMapAssetUrl(config.previewUrl, 'webp');
  const mainTileOptions = useMemo<TileLayerOptions>(
    () => ({
      tileSize: config.tileSize,
      minZoom: config.minZoom,
      maxNativeZoom: config.maxZoom,
      maxZoom: config.maxZoom + 2,
      bounds: mapBounds,
      noWrap: true,
    }),
    [config.maxZoom, config.minZoom, config.tileSize, mapBounds]
  );
  const handleMapReady = useCallback((mainMap: L.Map) => {
    mainMapRef.current = mainMap;
  }, []);

  const handleMapTileError = useCallback(() => {
    setTileFailed(true);
  }, []);

  useEffect(() => {
    setConfig(cloneInteractiveMap(incomingConfig));
  }, [incomingConfig]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(FILTER_STORAGE_KEY);
      if (stored) setVisibleCategories(new Set(JSON.parse(stored) as MapPointCategory[]));
    } catch (error) {
      console.warn('无法读取地图点位筛选设置：', error);
    }
  }, []);

  useEffect(() => {
    const pointIndex = Number.parseInt(
      new URLSearchParams(window.location.search).get('point') ?? '',
      10
    );
    if (Number.isInteger(pointIndex) && pointIndex >= 0 && pointIndex < config.points.length) {
      setSelectedPointIndex(pointIndex);
    }
  }, [config.points]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullscreen && !alwaysFullscreen) {
        if (window.history.state?.interactiveMapFullscreen) window.history.back();
        else setIsFullscreen(false);
      }
    };
    const handlePopState = () => setIsFullscreen(false);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [alwaysFullscreen, isFullscreen]);

  const updateConfig = useCallback(
    (next: InteractiveMapConfig, recordHistory = true) => {
      if (recordHistory) {
        undoStack.current.push(cloneInteractiveMap(config));
        redoStack.current = [];
      }
      setConfig(next);
      onConfigChange?.(cloneInteractiveMap(next));
    },
    [config, onConfigChange]
  );

  const updateSelectedPoint = (changes: Partial<InteractiveMapPoint>) => {
    if (selectedPointIndex === null) return;
    updatePoint(selectedPointIndex, changes);
  };

  const updatePoint = (pointIndex: number, changes: Partial<InteractiveMapPoint>) => {
    const next = updateInteractiveMapPoint(config, pointIndex, changes);
    if (!next) return;
    updateConfig(next);
  };

  const toggleCategory = (category: MapPointCategory) => {
    const next = new Set(visibleCategories);
    if (next.has(category)) next.delete(category);
    else next.add(category);
    setVisibleCategories(next);
    try {
      window.localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify([...next]));
    } catch (error) {
      console.warn('无法保存地图点位筛选设置：', error);
    }
  };

  const openPoint = (pointIndex: number) => {
    setSelectedRoomId(null);
    setSelectedPointIndex(pointIndex);
    const url = new URL(window.location.href);
    url.searchParams.set('point', String(pointIndex));
    window.history.replaceState(
      window.history.state,
      '',
      `${url.pathname}${url.search}${url.hash}`
    );
  };

  const closePoint = () => {
    setSelectedPointIndex(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('point');
    window.history.replaceState(
      window.history.state,
      '',
      `${url.pathname}${url.search}${url.hash}`
    );
  };

  const handleMapClick = (event: LeafletMouseEvent) => {
    if (editorMode === 'addPoint') {
      const next = cloneInteractiveMap(config);
      const point: InteractiveMapPoint = {
        id: `map-point-${crypto.randomUUID()}`,
        category: pointCategory,
        position: latLngToCoordinate(event.latlng.lat, event.latlng.lng, config),
        isRandomCandidate: isRandomCandidateByDefault(pointCategory),
        relatedEntries: getDefaultMapPointRelatedEntries({ category: pointCategory }),
      };
      next.points.push(point);
      updateConfig(next);
      openPoint(next.points.length - 1);
      setEditorMode('browse');
      return;
    }
    if (editorMode === 'drawRoom') {
      setDraftPolygon((current) => [...current, [event.latlng.lat, event.latlng.lng]]);
    }
  };

  const finishRoom = () => {
    if (draftPolygon.length < 3 || !roomName.trim()) return;
    const next = cloneInteractiveMap(config);
    const polygon = draftPolygon.map(([lat, lng]) => latLngToCoordinate(lat, lng, config));
    const existingRoom = next.rooms.find((room) => room.name === roomName.trim());
    if (existingRoom) existingRoom.polygons.push(polygon);
    else {
      next.rooms.push({
        name: roomName.trim(),
        polygons: [polygon],
      });
    }
    updateConfig(next);
    setDraftPolygon([]);
    setRoomName('');
    setEditorMode('browse');
  };

  const undo = () => {
    const previous = undoStack.current.pop();
    if (!previous) return;
    redoStack.current.push(cloneInteractiveMap(config));
    updateConfig(previous, false);
  };

  const redo = () => {
    const next = redoStack.current.pop();
    if (!next) return;
    undoStack.current.push(cloneInteractiveMap(config));
    updateConfig(next, false);
  };

  const subtypes = useMemo(
    () => [...new Set(config.points.map((point) => point.subtype).filter(Boolean) as string[])],
    [config.points]
  );

  const navigateFromMinimap = useCallback(
    (coordinate: MapCoordinate) => {
      const map = mainMapRef.current;
      if (!map) return;

      const targetZoom = Math.min(config.maxZoom + 2, Math.max(map.getZoom(), config.minZoom + 2));
      map.flyTo(coordinateToLatLng(coordinate, config), targetZoom, { duration: 0.5 });
    },
    [config]
  );

  const navigateToConnectedPoint = () => {
    if (!connectedPoint) return;
    openPoint(connectedPoint.pointIndex);
  };

  const connectSelectedPoint = (targetPointId: string) => {
    if (selectedPointIndex === null || !selectedPoint?.id) return;
    const next = cloneInteractiveMap(config);
    const point = next.points[selectedPointIndex];
    const pointId = point?.id;
    if (!point || !pointId) return;

    const previousTargetId = point.connection?.targetPointId;
    const previousTarget = next.points.find((candidate) => candidate.id === previousTargetId);
    if (previousTarget && previousTarget.connection?.targetPointId === pointId) {
      delete previousTarget.connection;
    }

    if (!targetPointId) {
      delete point.connection;
      updateConfig(next);
      return;
    }

    const target = next.points.find((candidate) => candidate.id === targetPointId);
    if (!target) return;
    const label =
      point.connection?.label ??
      target.connection?.label ??
      String.fromCharCode(65 + (selectedPointIndex % 26));
    point.connection = { targetPointId, direction: 'both', label };
    target.connection = { targetPointId: pointId, direction: 'both', label };
    updateConfig(next);
  };

  const updateSelectedConnectionLabel = (label: string) => {
    if (selectedPointIndex === null || !selectedPoint?.connection) return;
    const next = cloneInteractiveMap(config);
    const point = next.points[selectedPointIndex];
    if (!point?.connection || !point.id) return;
    point.connection.label = label;
    const targetPointId = point.connection.targetPointId;
    const target = next.points.find((candidate) => candidate.id === targetPointId);
    const targetConnection = target?.connection;
    if (targetConnection?.targetPointId === point.id) {
      targetConnection.label = label;
    }
    updateConfig(next);
  };

  if (useFallback && fallbackImageUrl) {
    return (
      <div className='relative flex h-[62vh] min-h-[420px] items-center justify-center overflow-hidden rounded-lg bg-slate-950'>
        <Image
          src={fallbackImageUrl}
          alt={`${mapName}静态地图预览`}
          fill
          sizes='100vw'
          className='object-contain'
        />
        <button
          type='button'
          className='absolute right-3 bottom-3 rounded bg-slate-900/90 px-3 py-2 text-sm text-white'
          onClick={() => {
            setTileFailed(false);
            setUseFallback(false);
          }}
        >
          重试交互地图
        </button>
      </div>
    );
  }

  const map = (
    <div
      className={`relative h-full overflow-hidden bg-slate-950 ${alwaysFullscreen ? '' : 'min-h-[420px] rounded-lg'}`}
    >
      <MapContainer
        crs={L.CRS.Simple}
        bounds={mapBounds}
        maxBounds={mapBounds}
        maxBoundsViscosity={1}
        minZoom={config.minZoom}
        maxZoom={config.maxZoom + 2}
        zoomControl
        doubleClickZoom
        className={`h-full w-full bg-slate-950 ${alwaysFullscreen ? '' : 'min-h-[420px]'}`}
      >
        <PictureTileLayer
          url={webpTileUrl}
          options={mainTileOptions}
          onTileError={handleMapTileError}
        />
        {previewUrl && (
          <ImageOverlay url={previewUrl} bounds={mapBounds} pane='tilePane' zIndex={0} />
        )}
        <MainMapEvents
          config={config}
          editorMode={editorMode}
          onMapClick={handleMapClick}
          onZoom={setZoom}
          onReady={handleMapReady}
        />
        <LocatePoint point={selectedPoint} config={config} />
        {config.rooms.flatMap((room) =>
          room.polygons.map((polygon, index) => (
            <Polygon
              key={`${room.name}-${index}`}
              positions={polygon.map((point) => coordinateToLatLng(point, config))}
              pathOptions={{
                color: selectedRoomId === room.name ? '#22d3ee' : '#f8fafc',
                fillOpacity:
                  selectedRoomId === room.name ? 0.12 : editorMode === 'selectRoom' ? 0.06 : 0.015,
                interactive: isEditMode && editorMode === 'selectRoom',
                opacity: isEditMode ? 0.65 : 0,
                weight: selectedRoomId === room.name ? 3 : 1,
              }}
              eventHandlers={{
                click: (event) => {
                  if (!isEditMode || editorMode !== 'selectRoom') return;
                  L.DomEvent.stopPropagation(event.originalEvent);
                  closePoint();
                  setSelectedRoomId(room.name);
                  setEditorMode('browse');
                },
              }}
            >
              {isEditMode && room.showLabel !== false && <Tooltip sticky>{room.name}</Tooltip>}
            </Polygon>
          ))
        )}
        {draftPolygon.length > 1 && (
          <Polygon positions={draftPolygon} pathOptions={{ color: '#22d3ee', dashArray: '6 6' }} />
        )}
        {selectedPoint && connectedPoint && (
          <Polyline
            positions={[
              coordinateToLatLng(selectedPoint.position, config),
              coordinateToLatLng(connectedPoint.point.position, config),
            ]}
            pathOptions={{
              color: '#67e8f9',
              dashArray: selectedPoint.connection?.direction === 'outbound' ? undefined : '10 10',
              opacity: 0.9,
              weight: 4,
            }}
          >
            <Tooltip sticky>
              管道 {selectedPoint.connection?.label ?? ''} ·{' '}
              {selectedPoint.connection?.direction === 'outbound' ? '单向' : '双向'}
            </Tooltip>
          </Polyline>
        )}
        {config.points
          .map((point, pointIndex) => ({ point, pointIndex }))
          .filter(({ point }) => isPointVisible(point, zoom, visibleCategories, hiddenSubtypes))
          .map(({ point, pointIndex }) => (
            <Marker
              key={pointIndex}
              position={coordinateToLatLng(point.position, config)}
              icon={makeIcon(
                point,
                selectedPointIndex === pointIndex,
                isEditMode,
                connectedPoint
                  ? pointIndex === selectedPointIndex || pointIndex === connectedPoint.pointIndex
                    ? 'endpoint'
                    : point.category === 'pipe'
                      ? 'unrelated'
                      : undefined
                  : undefined
              )}
              draggable={isEditMode}
              eventHandlers={{
                click: (event) => {
                  L.DomEvent.stopPropagation(event.originalEvent);
                  openPoint(pointIndex);
                },
                dblclick: (event) => {
                  L.DomEvent.stopPropagation(event.originalEvent);
                  openPoint(pointIndex);
                },
                dragstart: () => {
                  openPoint(pointIndex);
                },
                dragend: (event) => {
                  const marker = event.target as L.Marker;
                  updatePoint(pointIndex, {
                    position: latLngToCoordinate(
                      marker.getLatLng().lat,
                      marker.getLatLng().lng,
                      config
                    ),
                  });
                },
              }}
            >
              <Tooltip>
                {MAP_CATEGORY_LABELS[point.category]}
                {point.subtype ? ` · ${point.subtype}` : ''}
              </Tooltip>
            </Marker>
          ))}
        {isEditMode &&
          selectedRoomId &&
          config.rooms
            .find((room) => room.name === selectedRoomId)
            ?.polygons.flatMap((polygon, polygonIndex) =>
              polygon.map((point, pointIndex) => (
                <Marker
                  key={`${selectedRoomId}-${polygonIndex}-${pointIndex}`}
                  position={coordinateToLatLng(point, config)}
                  icon={vertexIcon}
                  draggable
                  eventHandlers={{
                    dragend: (event) => {
                      const marker = event.target as L.Marker;
                      const next = cloneInteractiveMap(config);
                      const room = next.rooms.find(
                        (candidate) => candidate.name === selectedRoomId
                      );
                      const vertex = room?.polygons[polygonIndex]?.[pointIndex];
                      if (!vertex) return;
                      Object.assign(
                        vertex,
                        latLngToCoordinate(marker.getLatLng().lat, marker.getLatLng().lng, config)
                      );
                      updateConfig(next);
                    },
                  }}
                />
              ))
            )}
      </MapContainer>

      <Minimap
        config={config}
        previewUrl={previewUrl}
        visibleCategories={visibleCategories}
        hiddenSubtypes={hiddenSubtypes}
        highlightedPointIds={highlightedPointIds}
        isExpanded={isMinimapExpanded}
        onExpand={() => setIsMinimapExpanded(true)}
        onCollapse={() => setIsMinimapExpanded(false)}
        onNavigate={navigateFromMinimap}
      />

      {!alwaysFullscreen && (
        <div className='absolute top-3 right-3 z-500 flex gap-2'>
          <button
            type='button'
            className='rounded-md bg-slate-900/90 px-3 py-2 text-sm text-white shadow hover:bg-slate-800'
            onClick={() => {
              if (isFullscreen) {
                if (window.history.state?.interactiveMapFullscreen) window.history.back();
                else setIsFullscreen(false);
              } else {
                window.history.pushState(
                  { ...window.history.state, interactiveMapFullscreen: true },
                  ''
                );
                setIsFullscreen(true);
              }
            }}
          >
            {isFullscreen ? '退出全屏' : '全屏地图'}
          </button>
        </div>
      )}

      <FilterPanel
        config={config}
        visibleCategories={visibleCategories}
        hiddenSubtypes={hiddenSubtypes}
        subtypes={subtypes}
        onToggleCategory={toggleCategory}
        onToggleSubtype={(subtype) => {
          const next = new Set(hiddenSubtypes);
          if (next.has(subtype)) next.delete(subtype);
          else next.add(subtype);
          setHiddenSubtypes(next);
        }}
      />

      {isEditMode && (
        <EditorPanel
          config={config}
          editorMode={editorMode}
          pointCategory={pointCategory}
          roomName={roomName}
          draftPointCount={draftPolygon.length}
          selectedPoint={selectedPoint}
          selectedRoomId={selectedRoomId}
          canUndo={undoStack.current.length > 0}
          canRedo={redoStack.current.length > 0}
          onEditorMode={setEditorMode}
          onPointCategory={setPointCategory}
          onRoomName={setRoomName}
          onFinishRoom={finishRoom}
          onCancelDrawing={() => {
            setDraftPolygon([]);
            setEditorMode('browse');
          }}
          onUndo={undo}
          onRedo={redo}
          onUpdatePoint={updateSelectedPoint}
          onConnectPoint={connectSelectedPoint}
          onUpdateConnectionLabel={updateSelectedConnectionLabel}
          onDeletePoint={() => {
            if (selectedPointIndex === null) return;
            const next = cloneInteractiveMap(config);
            next.points = next.points.filter((_, pointIndex) => pointIndex !== selectedPointIndex);
            updateConfig(next);
            closePoint();
          }}
          onDeleteRoom={() => {
            if (!selectedRoomId) return;
            const next = cloneInteractiveMap(config);
            next.rooms = next.rooms.filter((room) => room.name !== selectedRoomId);
            updateConfig(next);
            setSelectedRoomId(null);
          }}
          onMoveRoom={(x, y) => {
            if (!selectedRoomId) return;
            const next = cloneInteractiveMap(config);
            const room = next.rooms.find((candidate) => candidate.name === selectedRoomId);
            if (!room) return;
            room.polygons.forEach((polygon) =>
              polygon.forEach((point) => {
                point.x = Math.min(1, Math.max(0, point.x + x));
                point.y = Math.min(1, Math.max(0, point.y + y));
              })
            );
            updateConfig(next);
          }}
        />
      )}

      {selectedPoint && (
        <PointDetails
          point={selectedPoint}
          connectedPoint={connectedPoint?.point ?? null}
          isEditMode={isEditMode}
          onNavigateToConnectedPoint={navigateToConnectedPoint}
          onClose={closePoint}
        />
      )}
      {tileFailed && (
        <div className='absolute inset-x-4 bottom-4 z-600 rounded-lg bg-red-950/95 p-3 text-center text-sm text-white shadow-xl'>
          部分地图瓦片加载失败，请检查网络后重试。
          <button type='button' className='ml-3 underline' onClick={() => window.location.reload()}>
            重新加载
          </button>
          {fallbackImageUrl && (
            <button type='button' className='ml-3 underline' onClick={() => setUseFallback(true)}>
              使用静态预览
            </button>
          )}
        </div>
      )}
    </div>
  );

  return isFullscreenActive ? (
    <div
      data-main-map
      className={`fixed inset-0 z-1000 bg-black ${alwaysFullscreen ? 'h-dvh w-screen overflow-hidden p-0' : 'p-0 sm:p-3'}`}
      role='dialog'
      aria-modal='true'
      aria-label={`${mapName}交互地图`}
    >
      {map}
    </div>
  ) : (
    <div data-main-map className='h-[62vh] min-h-[420px] w-full'>
      {map}
    </div>
  );
}

type FilterPanelProps = {
  config: InteractiveMapConfig;
  visibleCategories: Set<MapPointCategory>;
  hiddenSubtypes: Set<string>;
  subtypes: string[];
  onToggleCategory: (category: MapPointCategory) => void;
  onToggleSubtype: (subtype: string) => void;
};

function FilterPanel({
  config,
  visibleCategories,
  hiddenSubtypes,
  subtypes,
  onToggleCategory,
  onToggleSubtype,
}: FilterPanelProps) {
  return (
    <details className='absolute right-3 bottom-3 z-500 max-h-[55%] w-48 overflow-auto rounded-lg bg-slate-900/95 text-sm text-white shadow-xl'>
      <summary className='cursor-pointer px-3 py-2 font-medium'>点位筛选</summary>
      <div className='space-y-2 border-t border-white/10 p-3'>
        {(Object.keys(MAP_CATEGORY_LABELS) as MapPointCategory[]).map((category) => {
          const isAlwaysVisible = ALWAYS_VISIBLE_CATEGORIES.has(category);
          const isDefaultVisible = DEFAULT_VISIBLE_CATEGORIES.has(category);
          const hasSupportedPoint = config.points.some((point) => point.category === category);
          return (
            <label key={category} className='flex items-center gap-2'>
              <input
                type='checkbox'
                checked={isAlwaysVisible || visibleCategories.has(category)}
                disabled={
                  isAlwaysVisible ||
                  (!hasSupportedPoint && !isDefaultVisible && category !== 'teleport')
                }
                onChange={() => onToggleCategory(category)}
              />
              <span>{MAP_CATEGORY_LABELS[category]}</span>
              {isAlwaysVisible && <span className='text-xs text-white/55'>常驻</span>}
            </label>
          );
        })}
        {subtypes.length > 0 && (
          <div className='border-t border-white/10 pt-2'>
            <p className='mb-1 text-xs text-white/60'>子类型</p>
            {subtypes.map((subtype) => (
              <label key={subtype} className='flex items-center gap-2 py-0.5'>
                <input
                  type='checkbox'
                  checked={!hiddenSubtypes.has(subtype)}
                  onChange={() => onToggleSubtype(subtype)}
                />
                {subtype}
              </label>
            ))}
          </div>
        )}
      </div>
    </details>
  );
}

type EditorPanelProps = {
  config: InteractiveMapConfig;
  editorMode: EditorMode;
  pointCategory: MapPointCategory;
  roomName: string;
  draftPointCount: number;
  selectedPoint: InteractiveMapPoint | null;
  selectedRoomId: string | null;
  canUndo: boolean;
  canRedo: boolean;
  onEditorMode: (mode: EditorMode) => void;
  onPointCategory: (value: MapPointCategory) => void;
  onRoomName: (value: string) => void;
  onFinishRoom: () => void;
  onCancelDrawing: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onUpdatePoint: (changes: Partial<InteractiveMapPoint>) => void;
  onConnectPoint: (targetPointId: string) => void;
  onUpdateConnectionLabel: (label: string) => void;
  onDeletePoint: () => void;
  onDeleteRoom: () => void;
  onMoveRoom: (x: number, y: number) => void;
};

function EditorPanel(props: EditorPanelProps) {
  const [relatedName, setRelatedName] = useState('');
  const [relatedType, setRelatedType] = useState<SingleItemTypeName>('fixture');
  const supportedCategories = (Object.keys(MAP_CATEGORY_LABELS) as MapPointCategory[]).filter(
    (category) =>
      category === 'teleport' || ALWAYS_VISIBLE_CATEGORIES.has(category) || CATEGORY_ICONS[category]
  );
  return (
    <div className='absolute bottom-3 left-3 z-600 max-h-[62%] w-72 overflow-auto rounded-lg bg-slate-950/95 p-3 text-sm text-white shadow-2xl'>
      <div className='mb-3 flex items-center justify-between'>
        <strong>地图标注</strong>
        <div className='flex gap-1'>
          <button
            type='button'
            disabled={!props.canUndo}
            onClick={props.onUndo}
            className='rounded bg-white/10 px-2 py-1 disabled:opacity-30'
          >
            撤销
          </button>
          <button
            type='button'
            disabled={!props.canRedo}
            onClick={props.onRedo}
            className='rounded bg-white/10 px-2 py-1 disabled:opacity-30'
          >
            重做
          </button>
        </div>
      </div>
      {props.editorMode === 'browse' && (
        <div className='grid grid-cols-2 gap-2'>
          <button
            type='button'
            className='rounded bg-cyan-700 px-2 py-2'
            onClick={() => props.onEditorMode('addPoint')}
          >
            添加点位
          </button>
          <button
            type='button'
            className='rounded bg-cyan-700 px-2 py-2'
            onClick={() => props.onEditorMode('selectRoom')}
          >
            选择区域
          </button>
          <button
            type='button'
            className='rounded bg-cyan-700 px-2 py-2'
            onClick={() => props.onEditorMode('drawRoom')}
          >
            绘制区域
          </button>
        </div>
      )}
      {props.editorMode === 'selectRoom' && (
        <div className='space-y-2'>
          <p className='text-xs text-white/65'>点击地图上的区域以选择并编辑。</p>
          <button type='button' onClick={props.onCancelDrawing} className='underline'>
            取消
          </button>
        </div>
      )}
      {props.editorMode === 'addPoint' && (
        <div className='space-y-2'>
          <select
            value={props.pointCategory}
            onChange={(event) => props.onPointCategory(event.target.value as MapPointCategory)}
            className='w-full rounded bg-slate-800 px-2 py-2'
          >
            {supportedCategories.map((category) => (
              <option key={category} value={category}>
                {MAP_CATEGORY_LABELS[category]}
              </option>
            ))}
          </select>
          <p className='text-xs text-white/65'>选择类型后，在地图上点击放置。</p>
          <button type='button' onClick={props.onCancelDrawing} className='underline'>
            取消
          </button>
        </div>
      )}
      {props.editorMode === 'drawRoom' && (
        <div className='space-y-2'>
          <input
            value={props.roomName}
            onChange={(event) => props.onRoomName(event.target.value)}
            placeholder='区域名称'
            className='w-full rounded bg-white/10 px-2 py-2'
          />
          <p className='text-xs text-white/65'>
            依次点击边界顶点，至少需要 3 点。当前 {props.draftPointCount} 点。
          </p>
          <div className='flex gap-2'>
            <button
              type='button'
              onClick={props.onFinishRoom}
              className='rounded bg-cyan-700 px-2 py-1'
            >
              完成
            </button>
            <button type='button' onClick={props.onCancelDrawing} className='underline'>
              取消
            </button>
          </div>
        </div>
      )}
      {props.selectedPoint && props.editorMode === 'browse' && (
        <div className='mt-3 space-y-2 border-t border-white/10 pt-3'>
          <strong>编辑点位</strong>
          <input
            value={props.selectedPoint.subtype ?? ''}
            onChange={(event) => props.onUpdatePoint({ subtype: event.target.value })}
            placeholder='子类型（可选）'
            className='w-full rounded bg-white/10 px-2 py-2'
          />
          <textarea
            value={props.selectedPoint.description ?? ''}
            onChange={(event) => props.onUpdatePoint({ description: event.target.value })}
            placeholder='介绍'
            className='w-full rounded bg-white/10 px-2 py-2'
          />
          {props.selectedPoint.category === 'pipe' && props.selectedPoint.id && (
            <div className='rounded border border-white/10 p-2'>
              <p className='mb-2 text-xs text-white/65'>对应管道</p>
              <select
                value={props.selectedPoint.connection?.targetPointId ?? ''}
                onChange={(event) => props.onConnectPoint(event.target.value)}
                className='w-full rounded bg-slate-800 px-2 py-2'
              >
                <option value=''>未连接</option>
                {props.config.points
                  .filter(
                    (candidate) =>
                      candidate.category === 'pipe' &&
                      candidate.id &&
                      candidate.id !== props.selectedPoint?.id
                  )
                  .map((candidate) => (
                    <option key={candidate.id} value={candidate.id}>
                      {candidate.subtype ?? candidate.id}
                    </option>
                  ))}
              </select>
              {props.selectedPoint.connection && (
                <label className='mt-2 block'>
                  <span className='text-xs text-white/65'>配对标记</span>
                  <input
                    value={props.selectedPoint.connection.label ?? ''}
                    maxLength={3}
                    onChange={(event) => props.onUpdateConnectionLabel(event.target.value)}
                    className='mt-1 w-full rounded bg-white/10 px-2 py-2'
                  />
                </label>
              )}
            </div>
          )}
          <label className='flex gap-2'>
            <input
              type='checkbox'
              checked={props.selectedPoint.isInvisible ?? false}
              onChange={(event) => props.onUpdatePoint({ isInvisible: event.target.checked })}
            />
            隐藏点位图标
          </label>
          <label className='flex gap-2'>
            <input
              type='checkbox'
              checked={props.selectedPoint.isRandomCandidate ?? false}
              onChange={(event) => props.onUpdatePoint({ isRandomCandidate: event.target.checked })}
            />
            随机候选点
          </label>
          <label className='block'>
            最低显示级别
            <input
              type='number'
              min={0}
              max={props.config.maxZoom + 2}
              value={props.selectedPoint.minZoom ?? 0}
              onChange={(event) => props.onUpdatePoint({ minZoom: Number(event.target.value) })}
              className='ml-2 w-16 rounded bg-white/10 px-2 py-1'
            />
          </label>
          <div className='rounded border border-white/10 p-2'>
            <p className='mb-2 text-xs text-white/65'>关联百科条目</p>
            {props.selectedPoint.relatedEntries?.map((entry, index) => (
              <div
                key={`${entry.type}-${entry.name}-${index}`}
                className='mb-1 flex justify-between gap-2'
              >
                <span>{entry.name}</span>
                <button
                  type='button'
                  className='text-red-300'
                  onClick={() =>
                    props.onUpdatePoint({
                      relatedEntries:
                        props.selectedPoint?.relatedEntries?.filter(
                          (_, itemIndex) => itemIndex !== index
                        ) ?? [],
                    })
                  }
                >
                  删除
                </button>
              </div>
            ))}
            <div className='grid grid-cols-[1fr_auto] gap-1'>
              <input
                value={relatedName}
                onChange={(event) => setRelatedName(event.target.value)}
                placeholder='条目名称'
                className='rounded bg-white/10 px-2 py-1'
              />
              <select
                value={relatedType}
                onChange={(event) => setRelatedType(event.target.value as SingleItemTypeName)}
                className='rounded bg-slate-800 px-1'
              >
                <option value='fixture'>组件</option>
                <option value='item'>道具</option>
                <option value='character'>角色</option>
                <option value='map'>地图</option>
                <option value='mode'>模式</option>
                <option value='entity'>衍生物</option>
              </select>
            </div>
            <button
              type='button'
              className='mt-2 underline'
              onClick={() => {
                if (!relatedName.trim()) return;
                props.onUpdatePoint({
                  relatedEntries: [
                    ...(props.selectedPoint?.relatedEntries ?? []),
                    { name: relatedName.trim(), type: relatedType },
                  ],
                });
                setRelatedName('');
              }}
            >
              添加关联
            </button>
          </div>
          <button type='button' onClick={props.onDeletePoint} className='text-red-300 underline'>
            删除点位
          </button>
        </div>
      )}
      {props.selectedRoomId && props.editorMode === 'browse' && (
        <div className='mt-3 border-t border-white/10 pt-3'>
          <p className='mb-2 text-xs text-white/65'>拖动地图上的青色顶点可调整区域。</p>
          <div className='mb-2 grid w-28 grid-cols-3 gap-1 text-center'>
            <span />
            <button
              type='button'
              className='rounded bg-white/10'
              onClick={() => props.onMoveRoom(0, -0.002)}
            >
              ↑
            </button>
            <span />
            <button
              type='button'
              className='rounded bg-white/10'
              onClick={() => props.onMoveRoom(-0.002, 0)}
            >
              ←
            </button>
            <span />
            <button
              type='button'
              className='rounded bg-white/10'
              onClick={() => props.onMoveRoom(0.002, 0)}
            >
              →
            </button>
            <span />
            <button
              type='button'
              className='rounded bg-white/10'
              onClick={() => props.onMoveRoom(0, 0.002)}
            >
              ↓
            </button>
            <span />
          </div>
          <button type='button' onClick={props.onDeleteRoom} className='text-red-300 underline'>
            删除所选区域
          </button>
        </div>
      )}
    </div>
  );
}

function PointDetails({
  point,
  connectedPoint,
  isEditMode,
  onNavigateToConnectedPoint,
  onClose,
}: {
  point: InteractiveMapPoint;
  connectedPoint: InteractiveMapPoint | null;
  isEditMode: boolean;
  onNavigateToConnectedPoint: () => void;
  onClose: () => void;
}) {
  return (
    <aside className='absolute right-0 bottom-0 left-0 z-700 max-h-[52%] overflow-auto rounded-t-2xl bg-white p-5 text-slate-900 shadow-2xl md:top-0 md:left-auto md:h-full md:max-h-none md:w-80 md:rounded-none dark:bg-slate-900 dark:text-white'>
      <button
        type='button'
        onClick={onClose}
        aria-label='关闭点位介绍'
        className='absolute top-3 right-3 text-2xl'
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
      <p className='mt-4 text-sm leading-6 whitespace-pre-wrap text-slate-700 dark:text-slate-200'>
        {point.description || (isEditMode ? '请在标注面板中补充介绍。' : '暂无介绍。')}
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
