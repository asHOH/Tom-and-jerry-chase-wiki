import type {
  InteractiveMapConfig,
  InteractiveMapPoint,
  MapCoordinate,
  MapPointCategory,
} from '@/data/types';

export const MAP_CATEGORY_LABELS: Record<MapPointCategory, string> = {
  teleport: '角色传送',
  cheese: '奶酪',
  rocket: '火箭',
  mouseHole: '奶酪洞口',
  pipe: '管道',
  fixture: '特殊组件',
  geometryBarrel: '几何桶',
  specialMode: '特殊玩法',
};

export const ALWAYS_VISIBLE_CATEGORIES = new Set<MapPointCategory>(['mouseHole', 'pipe']);
export const DEFAULT_VISIBLE_CATEGORIES = new Set<MapPointCategory>(['cheese', 'rocket']);

export const getMapScale = (config: InteractiveMapConfig) => 2 ** config.maxZoom;

export const coordinateToLatLng = (
  coordinate: MapCoordinate,
  config: InteractiveMapConfig
): [number, number] => {
  const scale = getMapScale(config);
  return [-(coordinate.y * config.height) / scale, (coordinate.x * config.width) / scale];
};

export const latLngToCoordinate = (
  lat: number,
  lng: number,
  config: InteractiveMapConfig
): MapCoordinate => {
  const scale = getMapScale(config);
  return {
    x: Math.min(1, Math.max(0, (lng * scale) / config.width)),
    y: Math.min(1, Math.max(0, (-lat * scale) / config.height)),
  };
};

export const getMapBounds = (
  config: InteractiveMapConfig
): [[number, number], [number, number]] => [[0, 0], coordinateToLatLng({ x: 1, y: 1 }, config)];

export const isPointVisible = (
  point: InteractiveMapPoint,
  zoom: number,
  visibleCategories: ReadonlySet<MapPointCategory>,
  hiddenSubtypes: ReadonlySet<string>
) => {
  if ((point.minZoom ?? 1) > zoom) return false;
  if (ALWAYS_VISIBLE_CATEGORIES.has(point.category)) return true;
  if (!visibleCategories.has(point.category)) return false;
  return !point.subtype || !hiddenSubtypes.has(point.subtype);
};

export const cloneInteractiveMap = (config: InteractiveMapConfig): InteractiveMapConfig =>
  structuredClone(config);
