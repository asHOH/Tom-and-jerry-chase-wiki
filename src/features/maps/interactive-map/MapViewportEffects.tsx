'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import L, { type LeafletEventHandlerFnMap, type LeafletMouseEvent } from 'leaflet';
import { useMap, useMapEvents } from 'react-leaflet';

import type { InteractiveMapConfig, InteractiveMapPoint } from '@/data/types';

import {
  DETAILS_PANEL_DESKTOP_BREAKPOINT,
  DETAILS_PANEL_DESKTOP_WIDTH,
  DETAILS_PANEL_MOBILE_HEIGHT_RATIO,
  LOCATE_POINT_PADDING,
} from './constants';
import { coordinateToLatLng, getMapPointScale } from './mapUtils';
import type { EditorMode } from './types';
import { getViewportAwareMaxBounds } from './viewportBounds';

export function MainMapEvents({
  config,
  editorMode,
  onMapClick,
  onZoomEnd,
  onReady,
}: {
  config: InteractiveMapConfig;
  editorMode: EditorMode;
  onMapClick: (event: LeafletMouseEvent) => void;
  onZoomEnd: (zoom: number) => void;
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
          String(getMapPointScale(nextZoom, { height, maxZoom, width }))
        );
    },
    [height, map, maxZoom, width]
  );
  const editorModeRef = useRef(editorMode);
  const onMapClickRef = useRef(onMapClick);
  const onZoomEndRef = useRef(onZoomEnd);
  const updatePointScaleRef = useRef(updatePointScale);
  editorModeRef.current = editorMode;
  onMapClickRef.current = onMapClick;
  onZoomEndRef.current = onZoomEnd;
  updatePointScaleRef.current = updatePointScale;

  const mapEventHandlers = useMemo<LeafletEventHandlerFnMap>(
    () => ({
      click: (event) => {
        if (editorModeRef.current !== 'browse') onMapClickRef.current(event);
      },
      zoom: () => {
        updatePointScaleRef.current(map.getZoom());
      },
      zoomanim: (event) => {
        updatePointScaleRef.current(event.zoom);
      },
      zoomend: () => {
        onZoomEndRef.current(map.getZoom());
      },
    }),
    [map]
  );

  useMapEvents(mapEventHandlers);

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
    onZoomEnd(map.getZoom());
    return () => {
      map.getContainer().style.removeProperty('--interactive-map-point-scale');
    };
  }, [height, map, maxZoom, onReady, onZoomEnd, updatePointScale, width]);
  return null;
}

export function LocatePoint({
  point,
  config,
  avoidDetailsPanel,
}: {
  point: InteractiveMapPoint | null;
  config: InteractiveMapConfig;
  avoidDetailsPanel: boolean;
}) {
  const map = useMap();
  useEffect(() => {
    if (!point) return;
    const container = map.getContainer();
    const paddingBottomRight: [number, number] =
      avoidDetailsPanel && container.clientWidth >= DETAILS_PANEL_DESKTOP_BREAKPOINT
        ? [DETAILS_PANEL_DESKTOP_WIDTH + LOCATE_POINT_PADDING, LOCATE_POINT_PADDING]
        : [
            LOCATE_POINT_PADDING,
            avoidDetailsPanel
              ? Math.ceil(container.clientHeight * DETAILS_PANEL_MOBILE_HEIGHT_RATIO) +
                LOCATE_POINT_PADDING
              : LOCATE_POINT_PADDING,
          ];

    map.panInside(coordinateToLatLng(point.position, config), {
      animate: true,
      duration: 0.35,
      paddingTopLeft: [LOCATE_POINT_PADDING, LOCATE_POINT_PADDING],
      paddingBottomRight,
    });
  }, [avoidDetailsPanel, config, map, point]);
  return null;
}

export function ViewportMaxBounds({ config }: { config: InteractiveMapConfig }) {
  const map = useMap();
  const updateMaxBounds = useCallback(() => {
    const container = map.getContainer();
    map.setMaxBounds(
      getViewportAwareMaxBounds(
        config,
        {
          width: container.clientWidth,
          height: container.clientHeight,
        },
        map.getZoom()
      )
    );
  }, [config, map]);
  const updateMaxBoundsRef = useRef(updateMaxBounds);
  updateMaxBoundsRef.current = updateMaxBounds;

  useMapEvents({
    resize: () => {
      updateMaxBoundsRef.current();
    },
    zoomend: () => {
      updateMaxBoundsRef.current();
    },
  });

  useEffect(() => {
    updateMaxBounds();
  }, [updateMaxBounds]);

  return null;
}
