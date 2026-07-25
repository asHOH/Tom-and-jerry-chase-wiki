import type { InteractiveMapConfig } from '@/data/types';

import { getMapBounds } from './mapUtils';
import { getViewportAwareMaxBounds } from './viewportBounds';

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

describe('interactive map viewport bounds', () => {
  it('should expand max bounds enough to center edge points inside the viewport', () => {
    const bounds = getViewportAwareMaxBounds(config, { width: 1000, height: 600 }, 4);

    expect(bounds).toEqual([
      [19.75, -32.25],
      [-70.5, 132.25],
    ]);
  });

  it('should fall back to the raw map bounds when the viewport is not measurable yet', () => {
    expect(getViewportAwareMaxBounds(config, { width: 0, height: 600 }, 4)).toEqual(
      getMapBounds(config)
    );
    expect(getViewportAwareMaxBounds(config, { width: 1000, height: 0 }, 4)).toEqual(
      getMapBounds(config)
    );
  });

  it('should allow more drag slack at lower zoom levels', () => {
    const zoomedOut = getViewportAwareMaxBounds(config, { width: 1000, height: 600 }, 2);
    const zoomedIn = getViewportAwareMaxBounds(config, { width: 1000, height: 600 }, 4);

    expect(zoomedOut[0][0]).toBeGreaterThan(zoomedIn[0][0]);
    expect(zoomedOut[0][1]).toBeLessThan(zoomedIn[0][1]);
    expect(zoomedOut[1][0]).toBeLessThan(zoomedIn[1][0]);
    expect(zoomedOut[1][1]).toBeGreaterThan(zoomedIn[1][1]);
  });
});
