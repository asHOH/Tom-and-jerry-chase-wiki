import type {
  InteractiveMapConfig,
  InteractiveMapPoint,
  InteractiveMapRoom,
  MapCoordinate,
  MapPointCategory,
  SingleItem,
} from '@/data/types';

export type InteractiveMapImageFormat = 'avif' | 'webp';
type InteractiveMapGeometry = Pick<InteractiveMapConfig, 'width' | 'height' | 'maxZoom'>;

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
export const DEFAULT_RANDOM_CANDIDATE_CATEGORIES = new Set<MapPointCategory>(['cheese', 'rocket']);

export const isRandomCandidateByDefault = (category: MapPointCategory): boolean =>
  DEFAULT_RANDOM_CANDIDATE_CATEGORIES.has(category);

const DEFAULT_MAP_POINT_RELATED_ENTRIES: Partial<Record<MapPointCategory, SingleItem>> = {
  cheese: { name: '奶酪', type: 'item' },
  rocket: { name: '火箭', type: 'item' },
  mouseHole: { name: '老鼠洞', type: 'fixture' },
  pipe: { name: '管道', type: 'fixture' },
};

export const getDefaultMapPointRelatedEntries = (
  point: Pick<InteractiveMapPoint, 'category' | 'subtype'>
): SingleItem[] => {
  if (point.category === 'fixture' && point.subtype) {
    return [{ name: point.subtype, type: 'fixture' }];
  }

  if (point.category === 'specialMode' && point.subtype) {
    return [{ name: point.subtype, type: 'mode' }];
  }

  const defaultEntry = DEFAULT_MAP_POINT_RELATED_ENTRIES[point.category];
  return defaultEntry ? [defaultEntry] : [];
};

export const getInteractiveMapAssetUrl = (
  url: string | undefined,
  format: InteractiveMapImageFormat
): string | undefined => {
  if (!url) return undefined;

  return format === 'avif'
    ? url.replace(/\.webp(?=$|[?#])/i, '.avif')
    : url.replace(/\.avif(?=$|[?#])/i, '.webp');
};

export const getMapScale = (config: InteractiveMapGeometry) => 2 ** config.maxZoom;

export const getMapPointScale = (zoom: number, config: InteractiveMapGeometry) =>
  2 ** (zoom - config.maxZoom);

export const coordinateToLatLng = (
  coordinate: MapCoordinate,
  config: InteractiveMapGeometry
): [number, number] => {
  const scale = getMapScale(config);
  return [-(coordinate.y * config.height) / scale, (coordinate.x * config.width) / scale];
};

export const latLngToCoordinate = (
  lat: number,
  lng: number,
  config: InteractiveMapGeometry
): MapCoordinate => {
  const scale = getMapScale(config);
  return {
    x: Math.min(1, Math.max(0, (lng * scale) / config.width)),
    y: Math.min(1, Math.max(0, (-lat * scale) / config.height)),
  };
};

export const getMapBounds = (
  config: InteractiveMapGeometry
): [[number, number], [number, number]] => [[0, 0], coordinateToLatLng({ x: 1, y: 1 }, config)];

export const isPointVisible = (
  point: InteractiveMapPoint,
  zoom: number,
  visibleCategories: ReadonlySet<MapPointCategory>,
  hiddenSubtypes: ReadonlySet<string>
) => {
  if ((point.minZoom ?? 0) > zoom) return false;
  if (ALWAYS_VISIBLE_CATEGORIES.has(point.category)) return true;
  if (!visibleCategories.has(point.category)) return false;
  return !point.subtype || !hiddenSubtypes.has(point.subtype);
};

export const isMinimapPointVisible = (
  point: InteractiveMapPoint,
  visibleCategories: ReadonlySet<MapPointCategory>,
  hiddenSubtypes: ReadonlySet<string>
) => {
  if (point.isInvisible) return false;
  if (ALWAYS_VISIBLE_CATEGORIES.has(point.category)) return true;
  if (!visibleCategories.has(point.category)) return false;
  return !point.subtype || !hiddenSubtypes.has(point.subtype);
};

export const getRoomCenter = (room: InteractiveMapRoom): MapCoordinate | null => {
  const coordinates = room.polygons.flat();
  if (coordinates.length === 0) return null;

  return {
    x: coordinates.reduce((sum, point) => sum + point.x, 0) / coordinates.length,
    y: coordinates.reduce((sum, point) => sum + point.y, 0) / coordinates.length,
  };
};

export const getConnectedMapPoint = (
  config: InteractiveMapConfig,
  point: InteractiveMapPoint
): { point: InteractiveMapPoint; pointIndex: number } | null => {
  if (!point.connection) return null;

  const pointIndex = config.points.findIndex(
    (candidate) => candidate.id === point.connection?.targetPointId
  );
  const connectedPoint = config.points[pointIndex];
  return connectedPoint ? { point: connectedPoint, pointIndex } : null;
};

export const minimapPixelsToCoordinate = (
  clientX: number,
  clientY: number,
  bounds: Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>
): MapCoordinate => ({
  x: Math.min(1, Math.max(0, (clientX - bounds.left) / bounds.width)),
  y: Math.min(1, Math.max(0, (clientY - bounds.top) / bounds.height)),
});

export const cloneInteractiveMap = (config: InteractiveMapConfig): InteractiveMapConfig =>
  JSON.parse(JSON.stringify(config)) as InteractiveMapConfig;

export const updateInteractiveMapPoint = (
  config: InteractiveMapConfig,
  pointIndex: number,
  changes: Partial<InteractiveMapPoint>
): InteractiveMapConfig | null => {
  const next = cloneInteractiveMap(config);
  const point = next.points[pointIndex];
  if (!point) return null;

  Object.assign(point, changes);
  return next;
};
