'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  Rectangle,
  Tooltip,
  useMap,
  useMapEvents,
} from 'react-leaflet';

import type {
  InteractiveMapConfig,
  InteractiveMapPoint,
  InteractiveMapRoom,
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
  getInteractiveMapAssetUrl,
  getMapBounds,
  isPointVisible,
  latLngToCoordinate,
  MAP_CATEGORY_LABELS,
} from './mapUtils';

import 'leaflet/dist/leaflet.css';

type InteractiveMapProps = {
  config: InteractiveMapConfig;
  mapName: string;
  isEditMode: boolean;
  fallbackImageUrl?: string | undefined;
  onConfigChange?: ((config: InteractiveMapConfig) => void) | undefined;
};

type EditorMode = 'browse' | 'addPoint' | 'drawRoom';

const CATEGORY_ICONS: Partial<Record<MapPointCategory, string>> = {
  cheese: '/images/items/奶酪.png',
  rocket: '/images/items/火箭.png',
  fixture: '/images/fixtures/七色花.png',
  geometryBarrel: '/images/fixtures/桶.png',
};

const FILTER_STORAGE_KEY = 'interactive-map:visible-categories';

const teleportSvg = `
  <svg viewBox="0 0 48 48" aria-hidden="true">
    <defs><linearGradient id="portal" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#67e8f9"/><stop offset="1" stop-color="#8b5cf6"/></linearGradient></defs>
    <circle cx="24" cy="24" r="19" fill="#111827" fill-opacity=".88" stroke="url(#portal)" stroke-width="4"/>
    <path d="M15 25c4-8 14-10 20-4M33 16l2 5-5 1M33 25c-4 8-14 10-20 4M15 34l-2-5 5-1" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;

const makeIcon = (point: InteractiveMapPoint, selected: boolean) => {
  const isHotspot = ALWAYS_VISIBLE_CATEGORIES.has(point.category);
  const source = CATEGORY_ICONS[point.category];
  const html = isHotspot
    ? `<span class="block h-8 w-8 rounded-full border-2 ${selected ? 'border-cyan-300 bg-cyan-300/25' : 'border-transparent'}"></span>`
    : point.category === 'teleport'
      ? teleportSvg
      : source
        ? `<img src="${encodeURI(source)}" alt="" class="h-full w-full object-contain drop-shadow-md" />`
        : '';
  return L.divIcon({
    className: `interactive-map-marker ${point.isRandomCandidate ? 'interactive-map-marker--random' : ''}`,
    html,
    iconSize: isHotspot ? [32, 32] : [42, 42],
    iconAnchor: isHotspot ? [16, 16] : [21, 36],
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

    let avifFailed = false;
    image.onload = () => done(undefined, picture);
    image.onerror = () => {
      if (!avifFailed && isAvifUrl(image.currentSrc || image.src)) {
        avifFailed = true;
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
  onViewChange,
  onReady,
}: {
  config: InteractiveMapConfig;
  editorMode: EditorMode;
  onMapClick: (event: LeafletMouseEvent) => void;
  onZoom: (zoom: number) => void;
  onViewChange: (bounds: L.LatLngBounds) => void;
  onReady: (map: L.Map) => void;
}) {
  const map = useMap();
  const { height, maxZoom, width } = config;
  useMapEvents({
    click: (event) => {
      if (editorMode !== 'browse') onMapClick(event);
    },
    move: () => onViewChange(map.getBounds()),
    zoom: () => {
      onZoom(map.getZoom());
      onViewChange(map.getBounds());
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
    onZoom(map.getZoom());
    onViewChange(map.getBounds());
  }, [height, map, maxZoom, onReady, onViewChange, onZoom, width]);
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

function MinimapViewport({
  config,
  isExpanded,
}: {
  config: InteractiveMapConfig;
  isExpanded: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    const fitMap = () => {
      map.invalidateSize({ animate: false });
      map.fitBounds(getMapBounds(config), { animate: false, padding: [4, 4] });
    };
    fitMap();
    const timeoutId = window.setTimeout(fitMap, 180);
    return () => window.clearTimeout(timeoutId);
  }, [config, isExpanded, map]);

  return null;
}

const boundsCenter = (room: InteractiveMapRoom, config: InteractiveMapConfig) => {
  const coordinates = room.polygons.flat();
  const x = coordinates.reduce((sum, point) => sum + point.x, 0) / coordinates.length;
  const y = coordinates.reduce((sum, point) => sum + point.y, 0) / coordinates.length;
  return coordinateToLatLng({ x, y }, config);
};

export default function InteractiveMap({
  config: incomingConfig,
  mapName,
  isEditMode,
  fallbackImageUrl,
  onConfigChange,
}: InteractiveMapProps) {
  const [config, setConfig] = useState(() => cloneInteractiveMap(incomingConfig));
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMinimapExpanded, setIsMinimapExpanded] = useState(false);
  const [zoom, setZoom] = useState(incomingConfig.minZoom);
  const [viewBounds, setViewBounds] = useState<L.LatLngBounds | null>(null);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [tileFailed, setTileFailed] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const [visibleCategories, setVisibleCategories] = useState<Set<MapPointCategory>>(
    () => new Set(DEFAULT_VISIBLE_CATEGORIES)
  );
  const [hiddenSubtypes, setHiddenSubtypes] = useState<Set<string>>(new Set());
  const [editorMode, setEditorMode] = useState<EditorMode>('browse');
  const [pointName, setPointName] = useState('');
  const [pointCategory, setPointCategory] = useState<MapPointCategory>('cheese');
  const [roomName, setRoomName] = useState('');
  const [draftPolygon, setDraftPolygon] = useState<[number, number][]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const undoStack = useRef<InteractiveMapConfig[]>([]);
  const redoStack = useRef<InteractiveMapConfig[]>([]);
  const mainMapRef = useRef<L.Map | null>(null);
  const selectedPoint = config.points.find((point) => point.id === selectedPointId) ?? null;
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
  const minimapTileOptions = useMemo<TileLayerOptions>(
    () => ({
      tileSize: config.tileSize,
      minZoom: config.minZoom - 4,
      minNativeZoom: config.minZoom,
      maxNativeZoom: config.maxZoom,
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
    const pointId = new URLSearchParams(window.location.search).get('point');
    if (pointId && config.points.some((point) => point.id === pointId)) setSelectedPointId(pointId);
  }, [config.points]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullscreen) {
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
  }, [isFullscreen]);

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
    if (!selectedPointId) return;
    const next = cloneInteractiveMap(config);
    const point = next.points.find((candidate) => candidate.id === selectedPointId);
    if (!point) return;
    Object.assign(point, changes);
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

  const openPoint = (point: InteractiveMapPoint) => {
    setSelectedPointId(point.id);
    const url = new URL(window.location.href);
    url.searchParams.set('point', point.id);
    window.history.replaceState(
      window.history.state,
      '',
      `${url.pathname}${url.search}${url.hash}`
    );
  };

  const closePoint = () => {
    setSelectedPointId(null);
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
      if (!pointName.trim()) return;
      const next = cloneInteractiveMap(config);
      const id = `${pointCategory}-${Date.now().toString(36)}`;
      next.points.push({
        id,
        name: pointName.trim(),
        category: pointCategory,
        position: latLngToCoordinate(event.latlng.lat, event.latlng.lng, config),
      });
      updateConfig(next);
      setSelectedPointId(id);
      setPointName('');
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
        id: `${roomName.trim()}-${Date.now().toString(36)}`,
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
    <div className='relative h-full min-h-[420px] overflow-hidden rounded-lg bg-slate-950'>
      <MapContainer
        crs={L.CRS.Simple}
        bounds={mapBounds}
        maxBounds={mapBounds}
        maxBoundsViscosity={1}
        minZoom={config.minZoom}
        maxZoom={config.maxZoom + 2}
        zoomControl
        doubleClickZoom
        className='h-full min-h-[420px] w-full bg-slate-950'
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
          onViewChange={setViewBounds}
          onReady={handleMapReady}
        />
        <LocatePoint point={selectedPoint} config={config} />
        {config.rooms.flatMap((room) =>
          room.polygons.map((polygon, index) => (
            <Polygon
              key={`${room.id}-${index}`}
              positions={polygon.map((point) => coordinateToLatLng(point, config))}
              pathOptions={{
                color: selectedRoomId === room.id ? '#22d3ee' : '#f8fafc',
                fillOpacity: selectedRoomId === room.id ? 0.12 : 0.015,
                opacity: isEditMode ? 0.65 : 0,
                weight: selectedRoomId === room.id ? 3 : 1,
              }}
              eventHandlers={{
                click: (event) => {
                  if (!isEditMode) return;
                  L.DomEvent.stopPropagation(event.originalEvent);
                  setSelectedRoomId(room.id);
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
        {config.points
          .filter((point) => isPointVisible(point, zoom, visibleCategories, hiddenSubtypes))
          .map((point) => (
            <Marker
              key={point.id}
              position={coordinateToLatLng(point.position, config)}
              icon={makeIcon(point, selectedPointId === point.id)}
              draggable={isEditMode}
              eventHandlers={{
                click: (event) => {
                  L.DomEvent.stopPropagation(event.originalEvent);
                  if ('ontouchstart' in window || isEditMode) openPoint(point);
                },
                dblclick: (event) => {
                  L.DomEvent.stopPropagation(event.originalEvent);
                  openPoint(point);
                },
                dragend: (event) => {
                  const marker = event.target as L.Marker;
                  updateSelectedPoint({
                    position: latLngToCoordinate(
                      marker.getLatLng().lat,
                      marker.getLatLng().lng,
                      config
                    ),
                  });
                },
              }}
            >
              <Tooltip>{point.name}</Tooltip>
            </Marker>
          ))}
        {isEditMode &&
          selectedRoomId &&
          config.rooms
            .find((room) => room.id === selectedRoomId)
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
                      const room = next.rooms.find((candidate) => candidate.id === selectedRoomId);
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

      <div
        className={`absolute top-3 left-12 z-500 overflow-hidden rounded-lg border-2 border-white/80 bg-slate-900 shadow-xl transition-[width,height] ${isMinimapExpanded ? 'h-48 w-72' : 'h-28 w-40'}`}
        onDoubleClick={() => setIsMinimapExpanded((value) => !value)}
        title='双击展开或收起小地图'
      >
        <MapContainer
          crs={L.CRS.Simple}
          bounds={mapBounds}
          minZoom={config.minZoom - 4}
          maxZoom={config.minZoom}
          zoomSnap={0}
          zoomControl={false}
          attributionControl={false}
          dragging={false}
          doubleClickZoom={false}
          scrollWheelZoom={false}
          className='h-full w-full bg-slate-950'
        >
          <PictureTileLayer
            url={webpTileUrl}
            options={minimapTileOptions}
            onTileError={handleMapTileError}
          />
          {previewUrl && (
            <ImageOverlay url={previewUrl} bounds={mapBounds} pane='tilePane' zIndex={0} />
          )}
          <MinimapViewport config={config} isExpanded={isMinimapExpanded} />
          {config.rooms.flatMap((room) =>
            room.polygons.map((polygon, index) => (
              <Polygon
                key={`${room.id}-mini-${index}`}
                positions={polygon.map((point) => coordinateToLatLng(point, config))}
                pathOptions={{ color: '#f8fafc', fillOpacity: 0.05, weight: 1 }}
                eventHandlers={{
                  click: (event) => {
                    L.DomEvent.stopPropagation(event.originalEvent);
                    mainMapRef.current?.flyTo(boundsCenter(room, config), 3, { duration: 0.5 });
                  },
                }}
              >
                {room.showLabel !== false && <Tooltip permanent>{room.name}</Tooltip>}
              </Polygon>
            ))
          )}
          {viewBounds && (
            <Rectangle bounds={viewBounds} pathOptions={{ color: '#22d3ee', weight: 2 }} />
          )}
        </MapContainer>
      </div>

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
          pointName={pointName}
          pointCategory={pointCategory}
          roomName={roomName}
          draftPointCount={draftPolygon.length}
          selectedPoint={selectedPoint}
          selectedRoomId={selectedRoomId}
          canUndo={undoStack.current.length > 0}
          canRedo={redoStack.current.length > 0}
          onEditorMode={setEditorMode}
          onPointName={setPointName}
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
          onDeletePoint={() => {
            if (!selectedPointId) return;
            const next = cloneInteractiveMap(config);
            next.points = next.points.filter((point) => point.id !== selectedPointId);
            updateConfig(next);
            closePoint();
          }}
          onDeleteRoom={() => {
            if (!selectedRoomId) return;
            const next = cloneInteractiveMap(config);
            next.rooms = next.rooms.filter((room) => room.id !== selectedRoomId);
            updateConfig(next);
            setSelectedRoomId(null);
          }}
          onMoveRoom={(x, y) => {
            if (!selectedRoomId) return;
            const next = cloneInteractiveMap(config);
            const room = next.rooms.find((candidate) => candidate.id === selectedRoomId);
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
        <PointDetails point={selectedPoint} isEditMode={isEditMode} onClose={closePoint} />
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

  return isFullscreen ? (
    <div
      data-main-map
      className='fixed inset-0 z-1000 bg-black p-0 sm:p-3'
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
          const hasSupportedPoint = config.points.some((point) => point.category === category);
          return (
            <label key={category} className='flex items-center gap-2'>
              <input
                type='checkbox'
                checked={isAlwaysVisible || visibleCategories.has(category)}
                disabled={isAlwaysVisible || (!hasSupportedPoint && category !== 'teleport')}
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
  pointName: string;
  pointCategory: MapPointCategory;
  roomName: string;
  draftPointCount: number;
  selectedPoint: InteractiveMapPoint | null;
  selectedRoomId: string | null;
  canUndo: boolean;
  canRedo: boolean;
  onEditorMode: (mode: EditorMode) => void;
  onPointName: (value: string) => void;
  onPointCategory: (value: MapPointCategory) => void;
  onRoomName: (value: string) => void;
  onFinishRoom: () => void;
  onCancelDrawing: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onUpdatePoint: (changes: Partial<InteractiveMapPoint>) => void;
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
            onClick={() => props.onEditorMode('drawRoom')}
          >
            绘制区域
          </button>
        </div>
      )}
      {props.editorMode === 'addPoint' && (
        <div className='space-y-2'>
          <input
            value={props.pointName}
            onChange={(event) => props.onPointName(event.target.value)}
            placeholder='点位名称'
            className='w-full rounded bg-white/10 px-2 py-2'
          />
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
          <p className='text-xs text-white/65'>填写名称后，在地图上点击放置。</p>
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
            value={props.selectedPoint.name}
            onChange={(event) => props.onUpdatePoint({ name: event.target.value })}
            className='w-full rounded bg-white/10 px-2 py-2'
          />
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
              value={props.selectedPoint.minZoom ?? 1}
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
  isEditMode,
  onClose,
}: {
  point: InteractiveMapPoint;
  isEditMode: boolean;
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
        {MAP_CATEGORY_LABELS[point.category]}
        {point.subtype ? ` · ${point.subtype}` : ''}
      </p>
      <h3 className='mt-1 pr-8 text-xl font-bold'>{point.name}</h3>
      {point.isRandomCandidate && (
        <span className='mt-2 inline-block rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-900'>
          随机候选点，同局不一定出现
        </span>
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
