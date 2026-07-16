'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import L, { type LeafletMouseEvent, type TileLayerOptions } from 'leaflet';
import { ImageOverlay, MapContainer, Marker, Polygon, Polyline, Tooltip } from 'react-leaflet';

import type {
  InteractiveMapConfig,
  InteractiveMapPoint,
  MapCoordinate,
  MapPointCategory,
} from '@/data/types';
import Image from '@/components/Image';

import { FILTER_STORAGE_KEY } from './constants';
import EditorPanel from './EditorPanel';
import FilterPanel from './FilterPanel';
import {
  LocatePoint,
  MainMapEvents,
  MapGridBackground,
  MapPointLayer,
  PictureTileLayer,
} from './MapLayers';
import {
  clearGeometryBarrelTarget,
  cloneInteractiveMap,
  coordinateToLatLng,
  DEFAULT_VISIBLE_CATEGORIES,
  deleteInteractiveMapPoint,
  getConnectedMapPoint,
  getDefaultMapPointRelatedEntries,
  getGeometryBarrelTarget,
  getIdleFruitPlateTarget,
  getInteractiveMapAssetUrl,
  getMapBounds,
  isGeometryBarrelRouteComplete,
  isRandomCandidateByDefault,
  latLngToCoordinate,
  updateGeometryBarrelRoute,
  updateInteractiveMapPoint,
} from './mapUtils';
import { firecrackerIcon, vertexIcon } from './markerIcons';
import Minimap, { MinimapVisibilityButton } from './Minimap';
import PointDetails from './PointDetails';
import type { EditorMode, InteractiveMapProps } from './types';

import 'leaflet/dist/leaflet.css';

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
  const [isMinimapVisible, setIsMinimapVisible] = useState(true);
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
  const geometryBarrelTarget = selectedPoint
    ? getGeometryBarrelTarget(config, selectedPoint)
    : null;
  const idleFruitPlateTarget = selectedPoint
    ? getIdleFruitPlateTarget(config, selectedPoint)
    : null;
  const isSelectedGeometryBarrelRouteComplete = selectedPoint
    ? isGeometryBarrelRouteComplete(config, selectedPoint)
    : false;
  const highlightedPointIds = useMemo(() => {
    const ids = new Set<string>();
    if (selectedPoint?.id && connectedPoint) ids.add(selectedPoint.id);
    if (connectedPoint?.point.id) ids.add(connectedPoint.point.id);
    if (selectedPoint?.id && geometryBarrelTarget) ids.add(selectedPoint.id);
    if (geometryBarrelTarget?.point.id) ids.add(geometryBarrelTarget.point.id);
    if (selectedPoint?.id && idleFruitPlateTarget) ids.add(selectedPoint.id);
    if (idleFruitPlateTarget?.point.id) ids.add(idleFruitPlateTarget.point.id);
    return ids;
  }, [connectedPoint, geometryBarrelTarget, idleFruitPlateTarget, selectedPoint]);
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
      updateWhenIdle: L.Browser.mobile,
      updateWhenZooming: !L.Browser.mobile,
      updateInterval: L.Browser.mobile ? 250 : 200,
      keepBuffer: L.Browser.mobile ? 1 : 2,
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

  const updatePoint = useCallback(
    (pointIndex: number, changes: Partial<InteractiveMapPoint>) => {
      const next = updateInteractiveMapPoint(config, pointIndex, changes);
      if (!next) return;
      updateConfig(next);
    },
    [config, updateConfig]
  );

  const movePoint = useCallback(
    (pointIndex: number, position: MapCoordinate) => {
      updatePoint(pointIndex, { position });
    },
    [updatePoint]
  );

  const updateSelectedPoint = useCallback(
    (changes: Partial<InteractiveMapPoint>) => {
      if (selectedPointIndex === null) return;
      updatePoint(selectedPointIndex, changes);
    },
    [selectedPointIndex, updatePoint]
  );

  const updateSelectedGeometryBarrelRoute = useCallback(
    (changes: NonNullable<InteractiveMapPoint['geometryBarrelRoute']>) => {
      if (selectedPointIndex === null || selectedPoint?.category !== 'geometryBarrel') return;
      const next = updateGeometryBarrelRoute(config, selectedPointIndex, changes);
      if (next) updateConfig(next);
    },
    [config, selectedPoint, selectedPointIndex, updateConfig]
  );

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

  const openPoint = useCallback((pointIndex: number) => {
    setSelectedRoomId(null);
    setSelectedPointIndex(pointIndex);
    const url = new URL(window.location.href);
    url.searchParams.set('point', String(pointIndex));
    window.history.replaceState(
      window.history.state,
      '',
      `${url.pathname}${url.search}${url.hash}`
    );
  }, []);

  const closePoint = useCallback(() => {
    setSelectedPointIndex(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('point');
    window.history.replaceState(
      window.history.state,
      '',
      `${url.pathname}${url.search}${url.hash}`
    );
  }, []);

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
    if (editorMode === 'placeGeometryBarrelFirecracker') {
      updateSelectedGeometryBarrelRoute({
        firecrackerPosition: latLngToCoordinate(event.latlng.lat, event.latlng.lng, config),
      });
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

  const navigateToGeometryBarrelTarget = () => {
    if (!geometryBarrelTarget) return;
    openPoint(geometryBarrelTarget.pointIndex);
  };

  const navigateToIdleFruitPlateTarget = () => {
    if (!idleFruitPlateTarget) return;
    openPoint(idleFruitPlateTarget.pointIndex);
  };

  const selectGeometryBarrelTarget = useCallback(
    (targetPointIndex: number) => {
      const targetPoint = config.points[targetPointIndex];
      if (!targetPoint || targetPoint.category !== 'rocket' || !targetPoint.id) return;
      updateSelectedGeometryBarrelRoute({ targetRocketPointId: targetPoint.id });
      setEditorMode('browse');
    },
    [config.points, updateSelectedGeometryBarrelRoute]
  );

  const selectIdleFruitPlateTarget = useCallback(
    (targetPointIndex: number) => {
      const targetPoint = config.points[targetPointIndex];
      if (
        selectedPointIndex === null ||
        !targetPoint ||
        targetPoint.category !== 'wallCrack' ||
        !targetPoint.id
      ) {
        return;
      }
      updatePoint(selectedPointIndex, { targetWallCrackPointId: targetPoint.id });
      setEditorMode('browse');
    },
    [config.points, selectedPointIndex, updatePoint]
  );

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
        <MapGridBackground
          key={`${config.width}x${config.height}`}
          bounds={mapBounds}
          height={config.height}
          width={config.width}
        />
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
          onZoomEnd={setZoom}
          onReady={handleMapReady}
        />
        <LocatePoint
          point={selectedPoint}
          config={config}
          avoidDetailsPanel={Boolean(selectedPoint && !isEditMode)}
        />
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
        {selectedPoint?.category === 'geometryBarrel' &&
          geometryBarrelTarget &&
          (isEditMode || isSelectedGeometryBarrelRouteComplete) && (
            <Polyline
              positions={[
                coordinateToLatLng(selectedPoint.position, config),
                coordinateToLatLng(geometryBarrelTarget.point.position, config),
              ]}
              pathOptions={{ color: '#fb923c', opacity: 0.9, weight: 4 }}
            >
              <Tooltip sticky>火药桶受击后的飞行路线</Tooltip>
            </Polyline>
          )}
        {selectedPoint?.category === 'geometryBarrel' &&
          selectedPoint.geometryBarrelRoute?.firecrackerPosition &&
          (isEditMode || isSelectedGeometryBarrelRouteComplete) && (
            <Marker
              position={coordinateToLatLng(
                selectedPoint.geometryBarrelRoute.firecrackerPosition,
                config
              )}
              icon={firecrackerIcon}
              draggable={isEditMode}
              eventHandlers={{
                click: (event) => {
                  L.DomEvent.stopPropagation(event.originalEvent);
                },
                dragend: (event) => {
                  const marker = event.target as L.Marker;
                  updateSelectedGeometryBarrelRoute({
                    firecrackerPosition: latLngToCoordinate(
                      marker.getLatLng().lat,
                      marker.getLatLng().lng,
                      config
                    ),
                  });
                },
              }}
            >
              <Tooltip>小鞭炮放置位置</Tooltip>
            </Marker>
          )}
        {selectedPoint?.category === 'idleFruitPlate' && idleFruitPlateTarget && (
          <Polyline
            positions={[
              coordinateToLatLng(selectedPoint.position, config),
              coordinateToLatLng(idleFruitPlateTarget.point.position, config),
            ]}
            pathOptions={{ color: '#a3e635', dashArray: '10 10', opacity: 0.9, weight: 4 }}
          >
            <Tooltip sticky>果盘可攻击的对应墙缝</Tooltip>
          </Polyline>
        )}
        <MapPointLayer
          config={config}
          connectedPointIndex={connectedPoint?.pointIndex ?? null}
          editorMode={editorMode}
          hiddenSubtypes={hiddenSubtypes}
          isEditMode={isEditMode}
          onMovePoint={movePoint}
          onOpenPoint={openPoint}
          onSelectGeometryBarrelTarget={selectGeometryBarrelTarget}
          onSelectIdleFruitPlateTarget={selectIdleFruitPlateTarget}
          selectedPointIndex={selectedPointIndex}
          visibleCategories={visibleCategories}
          zoom={zoom}
        />
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

      <MinimapVisibilityButton
        isVisible={isMinimapVisible}
        onToggle={() => {
          if (isMinimapVisible) setIsMinimapExpanded(false);
          setIsMinimapVisible((visible) => !visible);
        }}
      />

      {isMinimapVisible && (
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
      )}

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
          isGeometryBarrelRouteComplete={isSelectedGeometryBarrelRouteComplete}
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
          onGeometryBarrelCountdownDisplay={(value) => {
            if (selectedPointIndex === null) return;
            const next = cloneInteractiveMap(config);
            const point = next.points[selectedPointIndex];
            if (!point || point.category !== 'geometryBarrel') return;
            point.geometryBarrelRoute ??= {};
            if (value === null) {
              delete point.geometryBarrelRoute.barrelCountdownDisplayAtFirecrackerExplosion;
            } else {
              point.geometryBarrelRoute.barrelCountdownDisplayAtFirecrackerExplosion = value;
            }
            updateConfig(next);
          }}
          onPlaceGeometryBarrelFirecracker={() => setEditorMode('placeGeometryBarrelFirecracker')}
          onSelectGeometryBarrelRocket={() => setEditorMode('selectGeometryBarrelRocket')}
          onSelectIdleFruitPlateWallCrack={() => setEditorMode('selectIdleFruitPlateWallCrack')}
          onClearIdleFruitPlateTarget={() => {
            if (selectedPointIndex === null) return;
            const next = cloneInteractiveMap(config);
            const point = next.points[selectedPointIndex];
            if (!point || point.category !== 'idleFruitPlate') return;
            delete point.targetWallCrackPointId;
            updateConfig(next);
          }}
          onClearGeometryBarrelTarget={() => {
            if (selectedPointIndex === null) return;
            const next = clearGeometryBarrelTarget(config, selectedPointIndex);
            if (next) updateConfig(next);
          }}
          onDeletePoint={() => {
            if (selectedPointIndex === null) return;
            const next = deleteInteractiveMapPoint(config, selectedPointIndex);
            if (!next) return;
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

      {selectedPoint && !isEditMode && (
        <PointDetails
          point={selectedPoint}
          connectedPoint={connectedPoint?.point ?? null}
          geometryBarrelTarget={
            isSelectedGeometryBarrelRouteComplete ? (geometryBarrelTarget?.point ?? null) : null
          }
          idleFruitPlateTarget={idleFruitPlateTarget?.point ?? null}
          isGeometryBarrelRouteComplete={isSelectedGeometryBarrelRouteComplete}
          isEditMode={isEditMode}
          onNavigateToConnectedPoint={navigateToConnectedPoint}
          onNavigateToGeometryBarrelTarget={navigateToGeometryBarrelTarget}
          onNavigateToIdleFruitPlateTarget={navigateToIdleFruitPlateTarget}
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
