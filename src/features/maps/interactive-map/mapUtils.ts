import type { CategoryHint } from '@/lib/types';
import type {
  GeometryBarrelRoute,
  InteractiveMapConfig,
  InteractiveMapPoint,
  InteractiveMapRoom,
  MapCoordinate,
  MapPointCategory,
  SingleItemOrGroup,
} from '@/data/types';

export type InteractiveMapImageFormat = 'avif' | 'webp';
type InteractiveMapGeometry = Pick<InteractiveMapConfig, 'width' | 'height' | 'maxZoom'>;

export const MAP_CATEGORY_LABELS: Record<MapPointCategory, string> = {
  teleport: '角色传送',
  cheese: '奶酪',
  rocket: '火箭',
  drink: '饮料',
  wallCrack: '墙缝',
  idleFruitPlate: '挂机果盘点位',
  mouseHole: '奶酪洞口',
  pipe: '管道',
  geometryBarrel: '几何桶',
  scoutingCanary: '侦查金丝雀',
};

export const ALWAYS_VISIBLE_CATEGORIES = new Set<MapPointCategory>(['mouseHole', 'pipe']);
export const DEFAULT_VISIBLE_CATEGORIES = new Set<MapPointCategory>([
  'cheese',
  'rocket',
  'drink',
  'wallCrack',
  'idleFruitPlate',
  'scoutingCanary',
]);
export const DEFAULT_RANDOM_CANDIDATE_CATEGORIES = new Set<MapPointCategory>([
  'cheese',
  'rocket',
  'drink',
  'wallCrack',
]);

export const isRandomCandidateByDefault = (category: MapPointCategory): boolean =>
  DEFAULT_RANDOM_CANDIDATE_CATEGORIES.has(category);

const DEFAULT_MAP_POINT_RELATED_ENTRIES: Partial<Record<MapPointCategory, SingleItemOrGroup>> = {
  cheese: { name: '奶酪', type: 'item' },
  rocket: { name: '火箭', type: 'item' },
  drink: { name: '饮料', type: 'itemGroup' },
  wallCrack: { name: '墙缝', type: 'fixture' },
  idleFruitPlate: { name: '果盘', type: 'item' },
  mouseHole: { name: '老鼠洞', type: 'fixture' },
  pipe: { name: '管道', type: 'fixture' },
  scoutingCanary: { name: '侦查金丝雀', type: 'fixture' },
};

export const getDefaultMapPointRelatedEntries = (
  point: Pick<InteractiveMapPoint, 'category' | 'subtype'>
): SingleItemOrGroup[] => {
  const defaultEntry = DEFAULT_MAP_POINT_RELATED_ENTRIES[point.category];
  if (point.category === 'geometryBarrel') {
    return [
      { name: '小鞭炮', type: 'item' },
      { name: '火药桶', type: 'entity' },
    ];
  }
  return defaultEntry ? [defaultEntry] : [];
};

const getMapPointRelatedEntryCategoryHint = (
  entry: SingleItemOrGroup
): CategoryHint | undefined => {
  const factionId = 'factionId' in entry ? entry.factionId : undefined;

  switch (entry.type) {
    case 'character':
      return factionId === 'cat' ? '猫角色' : factionId === 'mouse' ? '鼠角色' : undefined;
    case 'knowledgeCard':
      return factionId === 'cat' ? '猫知识卡' : factionId === 'mouse' ? '鼠知识卡' : '知识卡';
    case 'specialSkill':
      return factionId === 'cat' ? '猫特技' : factionId === 'mouse' ? '鼠特技' : '特技';
    case 'item':
      return '道具';
    case 'entity':
      return '衍生物';
    case 'buff':
      return '状态';
    case 'map':
      return '地图';
    case 'fixture':
      return '地图组件';
    case 'mode':
      return '游戏模式';
    case 'achievement':
      return '对局成就';
    case 'itemGroup':
      return '组合';
    case 'skill':
      return '技能';
  }

  return undefined;
};

export const getMapPointRelatedEntryDescriptionUrl = (entry: SingleItemOrGroup): string => {
  const params = new URLSearchParams();
  const categoryHint = getMapPointRelatedEntryCategoryHint(entry);
  if (categoryHint) params.set('category', categoryHint);
  params.set('descMode', 'description');
  return `/api/goto/${encodeURIComponent(entry.name)}?${params.toString()}`;
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

export const getGeometryBarrelTarget = (
  config: InteractiveMapConfig,
  point: InteractiveMapPoint
): { point: InteractiveMapPoint; pointIndex: number } | null => {
  if (point.category !== 'geometryBarrel') return null;

  const targetPointId = point.geometryBarrelRoute?.targetRocketPointId;
  if (!targetPointId) return null;

  const pointIndex = config.points.findIndex(
    (candidate) => candidate.id === targetPointId && candidate.category === 'rocket'
  );
  const target = config.points[pointIndex];
  return target ? { point: target, pointIndex } : null;
};

export const getIdleFruitPlateTarget = (
  config: InteractiveMapConfig,
  point: InteractiveMapPoint
): { point: InteractiveMapPoint; pointIndex: number } | null => {
  if (point.category !== 'idleFruitPlate' || !point.targetWallCrackPointId) return null;

  const pointIndex = config.points.findIndex(
    (candidate) =>
      candidate.id === point.targetWallCrackPointId && candidate.category === 'wallCrack'
  );
  const target = config.points[pointIndex];
  return target ? { point: target, pointIndex } : null;
};

export const getGeometryBarrelInstructions = (point: InteractiveMapPoint): string | null => {
  if (point.category !== 'geometryBarrel') return null;

  const barrelCountdown = point.geometryBarrelRoute?.barrelCountdownDisplayAtFirecrackerExplosion;
  if (
    barrelCountdown === undefined ||
    !Number.isInteger(barrelCountdown) ||
    barrelCountdown < 0 ||
    barrelCountdown > 2
  ) {
    return null;
  }

  return [
    `1. 火药桶倒计时显示 ${barrelCountdown + 5} 时点燃小鞭炮；点燃后，小鞭炮从 4 开始倒计时。`,
    '2. 将已点燃的小鞭炮放到地图标注位置。',
    `3. 小鞭炮的 0 显示完毕并爆炸时，火药桶倒计时显示 ${barrelCountdown}；爆炸使火药桶产生位移，火药桶随后沿标注路线飞向火箭，最终爆炸摧毁火箭。`,
  ].join('\n');
};

export const isGeometryBarrelRouteComplete = (
  config: InteractiveMapConfig,
  point: InteractiveMapPoint
): boolean => {
  const route = point.geometryBarrelRoute;
  const barrelCountdown = route?.barrelCountdownDisplayAtFirecrackerExplosion;
  return Boolean(
    point.category === 'geometryBarrel' &&
    route?.firecrackerPosition &&
    barrelCountdown !== undefined &&
    Number.isInteger(barrelCountdown) &&
    barrelCountdown >= 0 &&
    barrelCountdown <= 2 &&
    getGeometryBarrelTarget(config, point)
  );
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
  const point = config.points[pointIndex];
  if (!point) return null;

  return {
    ...config,
    points: config.points.map((candidate, index) =>
      index === pointIndex ? { ...candidate, ...changes } : candidate
    ),
  };
};

export const updateGeometryBarrelRoute = (
  config: InteractiveMapConfig,
  pointIndex: number,
  changes: GeometryBarrelRoute
): InteractiveMapConfig | null => {
  const point = config.points[pointIndex];
  if (!point || point.category !== 'geometryBarrel') return null;

  return {
    ...config,
    points: config.points.map((candidate, index) =>
      index === pointIndex
        ? {
            ...candidate,
            geometryBarrelRoute: { ...candidate.geometryBarrelRoute, ...changes },
          }
        : candidate
    ),
  };
};

export const clearGeometryBarrelTarget = (
  config: InteractiveMapConfig,
  pointIndex: number
): InteractiveMapConfig | null => {
  const point = config.points[pointIndex];
  if (!point || point.category !== 'geometryBarrel') return null;

  if (!point.geometryBarrelRoute) return config;

  const geometryBarrelRoute = { ...point.geometryBarrelRoute };
  delete geometryBarrelRoute.targetRocketPointId;

  return {
    ...config,
    points: config.points.map((candidate, index) =>
      index === pointIndex ? { ...candidate, geometryBarrelRoute } : candidate
    ),
  };
};

export const deleteInteractiveMapPoint = (
  config: InteractiveMapConfig,
  pointIndex: number
): InteractiveMapConfig | null => {
  const point = config.points[pointIndex];
  if (!point) return null;

  const deletedPointId = point.id;
  const remainingPoints = config.points
    .filter((_, index) => index !== pointIndex)
    .map((candidate) => {
      if (!deletedPointId) return candidate;

      let nextCandidate = candidate;
      if (candidate.geometryBarrelRoute?.targetRocketPointId === deletedPointId) {
        const geometryBarrelRoute = { ...candidate.geometryBarrelRoute };
        delete geometryBarrelRoute.targetRocketPointId;
        nextCandidate = { ...nextCandidate, geometryBarrelRoute };
      }
      if (candidate.targetWallCrackPointId === deletedPointId) {
        nextCandidate = { ...nextCandidate };
        delete nextCandidate.targetWallCrackPointId;
      }
      return nextCandidate;
    });

  return { ...config, points: remainingPoints };
};
