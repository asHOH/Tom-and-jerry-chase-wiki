import { proxy } from 'valtio';

import type { InteractiveMapConfig, InteractiveMapPoint, InteractiveMapRoom } from '@/data/types';

import {
  clearGeometryBarrelTarget,
  cloneInteractiveMap,
  coordinateToLatLng,
  DEFAULT_VISIBLE_CATEGORIES,
  deleteInteractiveMapPoint,
  getConnectedMapPoint,
  getDefaultMapPointRelatedEntries,
  getGeometryBarrelInstructions,
  getGeometryBarrelTarget,
  getInteractiveMapAssetUrl,
  getMapPointRelatedEntryDescriptionUrl,
  getMapPointScale,
  getRoomCenter,
  isGeometryBarrelRouteComplete,
  isMinimapPointVisible,
  isPointVisible,
  isRandomCandidateByDefault,
  latLngToCoordinate,
  MAP_CATEGORY_LABELS,
  minimapPixelsToCoordinate,
  updateGeometryBarrelRoute,
  updateInteractiveMapPoint,
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
  it('should mark cheese, rocket, and drink points as random candidates by default', () => {
    expect(isRandomCandidateByDefault('cheese')).toBe(true);
    expect(isRandomCandidateByDefault('rocket')).toBe(true);
    expect(isRandomCandidateByDefault('drink')).toBe(true);
    expect(isRandomCandidateByDefault('pipe')).toBe(false);
    expect(isRandomCandidateByDefault('mouseHole')).toBe(false);
    expect(isRandomCandidateByDefault('teleport')).toBe(false);
  });

  it('should return the default wiki entry for common map point categories', () => {
    expect(getDefaultMapPointRelatedEntries({ category: 'cheese' })).toEqual([
      { name: '奶酪', type: 'item' },
    ]);
    expect(getDefaultMapPointRelatedEntries({ category: 'rocket' })).toEqual([
      { name: '火箭', type: 'item' },
    ]);
    expect(getDefaultMapPointRelatedEntries({ category: 'drink' })).toEqual([
      { name: '饮料', type: 'itemGroup' },
    ]);
    expect(getDefaultMapPointRelatedEntries({ category: 'mouseHole' })).toEqual([
      { name: '老鼠洞', type: 'fixture' },
    ]);
    expect(getDefaultMapPointRelatedEntries({ category: 'pipe' })).toEqual([
      { name: '管道', type: 'fixture' },
    ]);
  });

  it('should label drink points in Chinese', () => {
    expect(MAP_CATEGORY_LABELS.drink).toBe('饮料');
  });

  it('should use the subtype for fixture and special-mode point entries', () => {
    expect(getDefaultMapPointRelatedEntries({ category: 'fixture', subtype: '七色花' })).toEqual([
      { name: '七色花', type: 'fixture' },
    ]);
    expect(
      getDefaultMapPointRelatedEntries({ category: 'specialMode', subtype: '经典奶酪赛' })
    ).toEqual([{ name: '经典奶酪赛', type: 'mode' }]);
  });

  it('should build a description lookup URL for a related wiki entry', () => {
    expect(getMapPointRelatedEntryDescriptionUrl({ name: '奶酪', type: 'item' })).toBe(
      '/api/goto/%E5%A5%B6%E9%85%AA?category=%E9%81%93%E5%85%B7&descMode=description'
    );
  });

  it('should leave point categories without a wiki entry unlinked', () => {
    expect(getDefaultMapPointRelatedEntries({ category: 'teleport' })).toEqual([]);
  });

  it('should link geometry barrel points to the firecracker and barrel entries', () => {
    expect(getDefaultMapPointRelatedEntries({ category: 'geometryBarrel' })).toEqual([
      { name: '小鞭炮', type: 'item' },
      { name: '火药桶', type: 'entity' },
    ]);
  });

  it('should round-trip normalized coordinates', () => {
    const [lat, lng] = coordinateToLatLng(point.position, config);
    expect(latLngToCoordinate(lat, lng, config)).toEqual(point.position);
  });

  it('should hide points below their minimum zoom', () => {
    expect(isPointVisible(point, 1, DEFAULT_VISIBLE_CATEGORIES, new Set())).toBe(false);
    expect(isPointVisible(point, 2, DEFAULT_VISIBLE_CATEGORIES, new Set())).toBe(true);
  });

  it('should show points without an explicit minimum zoom at level 0', () => {
    const pointWithDefaultMinZoom: InteractiveMapPoint = {
      category: 'cheese',
      position: point.position,
    };

    expect(isPointVisible(pointWithDefaultMinZoom, 0, DEFAULT_VISIBLE_CATEGORIES, new Set())).toBe(
      true
    );
  });

  it('should scale point markers with the map', () => {
    expect(getMapPointScale(config.maxZoom, config)).toBe(1);
    expect(getMapPointScale(config.maxZoom - 1, config)).toBe(0.5);
    expect(getMapPointScale(config.maxZoom + 2, config)).toBe(4);
  });

  it('should always show built-in pipe and mouse-hole hotspots', () => {
    expect(isPointVisible({ ...point, category: 'pipe' }, 2, new Set(), new Set())).toBe(true);
    expect(isPointVisible({ ...point, category: 'mouseHole' }, 2, new Set(), new Set())).toBe(true);
  });

  it('should apply the category filter to teleport hotspots', () => {
    const teleportPoint: InteractiveMapPoint = { ...point, category: 'teleport' };

    expect(isPointVisible(teleportPoint, 2, new Set(), new Set())).toBe(false);
    expect(isPointVisible(teleportPoint, 2, new Set(['teleport']), new Set())).toBe(true);
    expect(isMinimapPointVisible(teleportPoint, new Set(), new Set())).toBe(false);
    expect(isMinimapPointVisible(teleportPoint, new Set(['teleport']), new Set())).toBe(true);
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

  it('should resolve a connected point by its stable id', () => {
    const entrance: InteractiveMapPoint = {
      id: 'pipe-a-entrance',
      category: 'pipe',
      position: { x: 0.1, y: 0.2 },
      connection: {
        targetPointId: 'pipe-a-exit',
        direction: 'both',
        label: 'A',
      },
    };
    const exit: InteractiveMapPoint = {
      id: 'pipe-a-exit',
      category: 'pipe',
      position: { x: 0.8, y: 0.7 },
    };
    const mapWithConnection = { ...config, points: [entrance, exit] };

    expect(getConnectedMapPoint(mapWithConnection, entrance)).toEqual({
      point: exit,
      pointIndex: 1,
    });
    expect(getConnectedMapPoint(mapWithConnection, exit)).toBeNull();
    expect(
      getConnectedMapPoint(mapWithConnection, {
        ...entrance,
        connection: { targetPointId: 'missing', direction: 'both', label: 'A' },
      })
    ).toBeNull();
  });

  it('should resolve only a rocket as a geometry barrel target', () => {
    const barrel: InteractiveMapPoint = {
      id: 'barrel',
      category: 'geometryBarrel',
      position: { x: 0.1, y: 0.2 },
      geometryBarrelRoute: { targetRocketPointId: 'rocket' },
    };
    const rocket: InteractiveMapPoint = {
      id: 'rocket',
      category: 'rocket',
      position: { x: 0.8, y: 0.7 },
    };
    const mapWithRoute = { ...config, points: [barrel, rocket] };

    expect(getGeometryBarrelTarget(mapWithRoute, barrel)).toEqual({ point: rocket, pointIndex: 1 });
    expect(getGeometryBarrelTarget({ ...config, points: [barrel] }, barrel)).toBeNull();
    expect(
      getGeometryBarrelTarget(
        { ...config, points: [barrel, { ...rocket, category: 'cheese' }] },
        barrel
      )
    ).toBeNull();
  });

  it('should generate geometry barrel instructions from the firecracker explosion timing', () => {
    const barrel: InteractiveMapPoint = {
      category: 'geometryBarrel',
      position: { x: 0.1, y: 0.2 },
      geometryBarrelRoute: { barrelRemainingSecondsAtFirecrackerExplosion: 2.5 },
    };

    expect(getGeometryBarrelInstructions(barrel)).toBe(
      '1. 火药桶倒计时剩余 7.5 秒时点燃小鞭炮。\n' +
        '2. 将已点燃的小鞭炮放到地图标注位置。\n' +
        '3. 小鞭炮爆炸时火药桶倒计时剩余 2.5 秒，并使火药桶产生位移；火药桶随后沿标注路线飞向火箭，最终爆炸摧毁火箭。'
    );
    expect(
      getGeometryBarrelInstructions({
        ...barrel,
        geometryBarrelRoute: { barrelRemainingSecondsAtFirecrackerExplosion: -1 },
      })
    ).toBeNull();
  });

  it('should support progressive geometry barrel route editing', () => {
    const barrel: InteractiveMapPoint = {
      id: 'barrel',
      category: 'geometryBarrel',
      position: { x: 0.1, y: 0.2 },
    };
    const rocket: InteractiveMapPoint = {
      id: 'rocket',
      category: 'rocket',
      position: { x: 0.8, y: 0.7 },
    };
    const initial = { ...config, points: [barrel, rocket] };
    const placed = updateGeometryBarrelRoute(initial, 0, {
      firecrackerPosition: { x: 0.08, y: 0.2 },
    });
    const dragged = updateGeometryBarrelRoute(placed!, 0, {
      firecrackerPosition: { x: 0.12, y: 0.2 },
      targetRocketPointId: 'rocket',
      barrelRemainingSecondsAtFirecrackerExplosion: 2.5,
    });

    expect(dragged?.points[0]?.geometryBarrelRoute?.firecrackerPosition).toEqual({
      x: 0.12,
      y: 0.2,
    });
    expect(isGeometryBarrelRouteComplete(dragged!, dragged!.points[0]!)).toBe(true);
    expect(isGeometryBarrelRouteComplete(placed!, placed!.points[0]!)).toBe(false);

    const cleared = clearGeometryBarrelTarget(dragged!, 0);
    expect(cleared?.points[0]?.geometryBarrelRoute?.targetRocketPointId).toBeUndefined();
    expect(updateGeometryBarrelRoute(initial, 1, {})).toBeNull();
    expect(clearGeometryBarrelTarget(initial, 1)).toBeNull();
  });

  it('should clear geometry barrel routes that target a deleted rocket', () => {
    const rocket: InteractiveMapPoint = {
      id: 'rocket',
      category: 'rocket',
      position: { x: 0.8, y: 0.7 },
    };
    const barrels: InteractiveMapPoint[] = [0.1, 0.2].map((x, index) => ({
      id: `barrel-${index}`,
      category: 'geometryBarrel',
      position: { x, y: 0.2 },
      geometryBarrelRoute: { targetRocketPointId: 'rocket' },
    }));

    const updated = deleteInteractiveMapPoint({ ...config, points: [rocket, ...barrels] }, 0);

    expect(updated?.points).toHaveLength(2);
    expect(updated?.points[0]?.geometryBarrelRoute?.targetRocketPointId).toBeUndefined();
    expect(updated?.points[1]?.geometryBarrelRoute?.targetRocketPointId).toBeUndefined();
    expect(deleteInteractiveMapPoint(config, 1)).toBeNull();
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

  it('should update the dragged point by its own index without mutating the map', () => {
    const mapWithPoints: InteractiveMapConfig = {
      ...config,
      points: [point, { ...point, position: { x: 0.8, y: 0.2 } }],
    };

    const updated = updateInteractiveMapPoint(mapWithPoints, 1, {
      position: { x: 0.6, y: 0.4 },
    });

    expect(updated?.points[0]?.position).toEqual(point.position);
    expect(updated?.points[1]?.position).toEqual({ x: 0.6, y: 0.4 });
    expect(mapWithPoints.points[1]?.position).toEqual({ x: 0.8, y: 0.2 });
    expect(updateInteractiveMapPoint(mapWithPoints, 2, {})).toBeNull();
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
