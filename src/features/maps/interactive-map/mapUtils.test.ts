import { proxy } from 'valtio';

import type { InteractiveMapConfig, InteractiveMapPoint, InteractiveMapRoom } from '@/data/types';

import {
  cloneInteractiveMap,
  coordinateToLatLng,
  DEFAULT_VISIBLE_CATEGORIES,
  getInteractiveMapAssetUrl,
  getMapPointScale,
  getRoomCenter,
  isMinimapPointVisible,
  isPointVisible,
  latLngToCoordinate,
  minimapPixelsToCoordinate,
} from './mapUtils';

const config: InteractiveMapConfig = {
  width: 1600,
  height: 800,
  tileSize: 512,
  minZoom: 0,
  maxZoom: 4,
  tileUrl: '/tiles/{z}/{y}/{x}.webp',
  rooms: [],
  points: [],
};

const point: InteractiveMapPoint = {
  category: 'cheese',
  position: { x: 0.25, y: 0.75 },
  minZoom: 2,
};

describe('interactive map utilities', () => {
  it('should round-trip normalized coordinates', () => {
    const [lat, lng] = coordinateToLatLng(point.position, config);
    expect(latLngToCoordinate(lat, lng, config)).toEqual(point.position);
  });

  it('should hide points below their minimum zoom', () => {
    expect(isPointVisible(point, 1, DEFAULT_VISIBLE_CATEGORIES, new Set())).toBe(false);
    expect(isPointVisible(point, 2, DEFAULT_VISIBLE_CATEGORIES, new Set())).toBe(true);
  });

  it('should scale point markers with the map', () => {
    expect(getMapPointScale(config.maxZoom, config)).toBe(1);
    expect(getMapPointScale(config.maxZoom - 1, config)).toBe(0.5);
    expect(getMapPointScale(config.maxZoom + 2, config)).toBe(4);
  });

  it('should always show built-in pipe hotspots', () => {
    expect(isPointVisible({ ...point, category: 'pipe' }, 2, new Set(), new Set())).toBe(true);
  });

  it('should omit invisible points from the minimap', () => {
    expect(
      isMinimapPointVisible({ ...point, isInvisible: true }, DEFAULT_VISIBLE_CATEGORIES, new Set())
    ).toBe(false);
  });

  it('should keep selected minimap points visible regardless of minZoom', () => {
    expect(isMinimapPointVisible(point, DEFAULT_VISIBLE_CATEGORIES, new Set())).toBe(true);
  });

  it('should apply category and subtype filters to minimap points', () => {
    const fixturePoint: InteractiveMapPoint = {
      ...point,
      category: 'fixture',
      subtype: '七色花',
    };

    expect(isMinimapPointVisible(fixturePoint, new Set(['fixture']), new Set())).toBe(true);
    expect(isMinimapPointVisible(fixturePoint, new Set(), new Set())).toBe(false);
    expect(isMinimapPointVisible(fixturePoint, new Set(['fixture']), new Set(['七色花']))).toBe(
      false
    );
  });

  it('should calculate a room center from all polygon vertices', () => {
    const room: InteractiveMapRoom = {
      name: '房间',
      polygons: [
        [
          { x: 0, y: 0 },
          { x: 0.4, y: 0 },
          { x: 0.4, y: 0.2 },
          { x: 0, y: 0.2 },
        ],
        [
          { x: 0.6, y: 0.6 },
          { x: 0.8, y: 0.6 },
          { x: 0.8, y: 0.8 },
        ],
      ],
    };

    const center = getRoomCenter(room);
    expect(center?.x).toBeCloseTo(3 / 7);
    expect(center?.y).toBeCloseTo(12 / 35);
    expect(getRoomCenter({ ...room, polygons: [] })).toBeNull();
  });

  it('should convert minimap pixels to clamped normalized coordinates', () => {
    const bounds = { left: 100, top: 50, width: 200, height: 100 };

    expect(minimapPixelsToCoordinate(200, 100, bounds)).toEqual({ x: 0.5, y: 0.5 });
    expect(minimapPixelsToCoordinate(0, 200, bounds)).toEqual({ x: 0, y: 1 });
  });

  it('should clone Valtio-backed map data into editable plain data', () => {
    const cloned = cloneInteractiveMap(proxy(config));

    expect(cloned).toEqual(config);
    expect(cloned).not.toBe(config);
  });

  it('should select the requested map image format', () => {
    expect(getInteractiveMapAssetUrl('/tiles/{z}/{y}/{x}.webp', 'avif')).toBe(
      '/tiles/{z}/{y}/{x}.avif'
    );
    expect(getInteractiveMapAssetUrl('/tiles/{z}/{y}/{x}.avif', 'webp')).toBe(
      '/tiles/{z}/{y}/{x}.webp'
    );
    expect(getInteractiveMapAssetUrl('/tiles/{z}/{y}/{x}.png', 'avif')).toBe(
      '/tiles/{z}/{y}/{x}.png'
    );
  });
});
