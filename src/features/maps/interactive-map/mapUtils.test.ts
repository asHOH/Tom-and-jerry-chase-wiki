import { proxy } from 'valtio';

import type { InteractiveMapConfig, InteractiveMapPoint } from '@/data/types';

import {
  cloneInteractiveMap,
  coordinateToLatLng,
  DEFAULT_VISIBLE_CATEGORIES,
  getInteractiveMapAssetUrl,
  isPointVisible,
  latLngToCoordinate,
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
  id: 'cheese-1',
  name: '奶酪候选点',
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

  it('should always show built-in pipe hotspots', () => {
    expect(isPointVisible({ ...point, category: 'pipe' }, 2, new Set(), new Set())).toBe(true);
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
