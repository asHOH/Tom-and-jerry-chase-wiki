'use client';

import { memo, useMemo } from 'react';
import L, { type LeafletEventHandlerFnMap, type LeafletMouseEvent } from 'leaflet';
import { Marker, Tooltip } from 'react-leaflet';

import type {
  InteractiveMapConfig,
  InteractiveMapPoint,
  MapCoordinate,
  MapPointCategory,
} from '@/data/types';

import {
  coordinateToLatLng,
  isPointVisible,
  latLngToCoordinate,
  MAP_CATEGORY_LABELS,
} from './mapUtils';
import { makeIcon, type ConnectionHighlight } from './markerIcons';
import type { EditorMode } from './types';

type MapPointMarkerProps = {
  config: InteractiveMapConfig;
  connectionHighlight: ConnectionHighlight;
  editorMode: EditorMode;
  isEditMode: boolean;
  onMovePoint: (pointIndex: number, position: MapCoordinate) => void;
  onOpenPoint: (pointIndex: number) => void;
  onSelectGeometryBarrelTarget?: ((pointIndex: number) => void) | undefined;
  onSelectIdleFruitPlateTarget?: ((pointIndex: number) => void) | undefined;
  point: InteractiveMapPoint;
  pointIndex: number;
  selected: boolean;
};

const MapPointMarker = memo(function MapPointMarker({
  config,
  connectionHighlight,
  editorMode,
  isEditMode,
  onMovePoint,
  onOpenPoint,
  onSelectGeometryBarrelTarget,
  onSelectIdleFruitPlateTarget,
  point,
  pointIndex,
  selected,
}: MapPointMarkerProps) {
  const position = useMemo(
    () => coordinateToLatLng(point.position, config),
    [config, point.position]
  );
  const icon = useMemo(
    () => makeIcon(point, selected, isEditMode, connectionHighlight),
    [connectionHighlight, isEditMode, point, selected]
  );
  const eventHandlers = useMemo<LeafletEventHandlerFnMap>(() => {
    const handleActivation = (event: LeafletMouseEvent) => {
      L.DomEvent.stopPropagation(event.originalEvent);
      if (editorMode === 'selectGeometryBarrelRocket') {
        onSelectGeometryBarrelTarget?.(pointIndex);
        return;
      }
      if (editorMode === 'selectIdleFruitPlateWallCrack') {
        onSelectIdleFruitPlateTarget?.(pointIndex);
        return;
      }
      onOpenPoint(pointIndex);
    };

    return {
      click: handleActivation,
      dblclick: handleActivation,
      dragstart: () => {
        if (editorMode === 'browse') onOpenPoint(pointIndex);
      },
      dragend: (event) => {
        const marker = event.target as L.Marker;
        const markerPosition = marker.getLatLng();
        onMovePoint(pointIndex, latLngToCoordinate(markerPosition.lat, markerPosition.lng, config));
      },
    };
  }, [
    config,
    editorMode,
    onMovePoint,
    onOpenPoint,
    onSelectGeometryBarrelTarget,
    onSelectIdleFruitPlateTarget,
    pointIndex,
  ]);

  return (
    <Marker
      position={position}
      icon={icon}
      draggable={isEditMode && editorMode === 'browse'}
      eventHandlers={eventHandlers}
    >
      <Tooltip>
        {MAP_CATEGORY_LABELS[point.category]}
        {point.subtype ? ` · ${point.subtype}` : ''}
      </Tooltip>
    </Marker>
  );
});

type MapPointLayerProps = {
  config: InteractiveMapConfig;
  connectedPointIndex: number | null;
  editorMode: EditorMode;
  hiddenSubtypes: ReadonlySet<string>;
  isEditMode: boolean;
  onMovePoint: (pointIndex: number, position: MapCoordinate) => void;
  onOpenPoint: (pointIndex: number) => void;
  onSelectGeometryBarrelTarget: (pointIndex: number) => void;
  onSelectIdleFruitPlateTarget: (pointIndex: number) => void;
  selectedPointIndex: number | null;
  visibleCategories: ReadonlySet<MapPointCategory>;
  zoom: number;
};

export const MapPointLayer = memo(function MapPointLayer({
  config,
  connectedPointIndex,
  editorMode,
  hiddenSubtypes,
  isEditMode,
  onMovePoint,
  onOpenPoint,
  onSelectGeometryBarrelTarget,
  onSelectIdleFruitPlateTarget,
  selectedPointIndex,
  visibleCategories,
  zoom,
}: MapPointLayerProps) {
  const visiblePoints = useMemo(
    () =>
      config.points
        .map((point, pointIndex) => ({ point, pointIndex }))
        .filter(
          ({ point }) =>
            (editorMode === 'selectGeometryBarrelRocket' && point.category === 'rocket') ||
            (editorMode === 'selectIdleFruitPlateWallCrack' && point.category === 'wallCrack') ||
            isPointVisible(point, zoom, visibleCategories, hiddenSubtypes)
        ),
    [config.points, editorMode, hiddenSubtypes, visibleCategories, zoom]
  );

  return visiblePoints.map(({ point, pointIndex }) => {
    const connectionHighlight: ConnectionHighlight =
      connectedPointIndex !== null
        ? pointIndex === selectedPointIndex || pointIndex === connectedPointIndex
          ? 'endpoint'
          : point.category === 'pipe'
            ? 'unrelated'
            : undefined
        : editorMode === 'selectGeometryBarrelRocket' && point.category === 'rocket'
          ? 'endpoint'
          : editorMode === 'selectIdleFruitPlateWallCrack' && point.category === 'wallCrack'
            ? 'endpoint'
            : undefined;

    return (
      <MapPointMarker
        key={point.id ?? `legacy-${point.category}-${pointIndex}`}
        config={config}
        connectionHighlight={connectionHighlight}
        editorMode={editorMode}
        isEditMode={isEditMode}
        onMovePoint={onMovePoint}
        onOpenPoint={onOpenPoint}
        onSelectGeometryBarrelTarget={
          editorMode === 'selectGeometryBarrelRocket' ? onSelectGeometryBarrelTarget : undefined
        }
        onSelectIdleFruitPlateTarget={
          editorMode === 'selectIdleFruitPlateWallCrack' ? onSelectIdleFruitPlateTarget : undefined
        }
        point={point}
        pointIndex={pointIndex}
        selected={selectedPointIndex === pointIndex}
      />
    );
  });
});
