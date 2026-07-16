import L from 'leaflet';

import type { InteractiveMapPoint } from '@/data/types';

import { CATEGORY_ICONS, HOTSPOT_CATEGORIES } from './constants';

export type ConnectionHighlight = 'endpoint' | 'unrelated' | undefined;

const escapeHtml = (value: string) =>
  value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

const getMarkerPictureHtml = (source: string, zoom = 1) => {
  const lastDotIndex = source.lastIndexOf('.');
  const sourceWithoutExtension = lastDotIndex === -1 ? source : source.slice(0, lastDotIndex);
  const encodedSource = encodeURI(source);
  const encodedAvifSource = encodeURI(`${sourceWithoutExtension}.avif`);
  const encodedWebpSource = encodeURI(`${sourceWithoutExtension}.webp`);

  return `<picture class="block h-full w-full"><source srcset="${encodedAvifSource}" type="image/avif" /><source srcset="${encodedWebpSource}" type="image/webp" /><img src="${encodedSource}" alt="" class="h-full w-full object-contain drop-shadow-md" style="zoom: ${zoom};" /></picture>`;
};

const markerIconCache = new Map<string, L.DivIcon>();

export const makeIcon = (
  point: InteractiveMapPoint,
  selected: boolean,
  isEditMode: boolean,
  connectionHighlight?: ConnectionHighlight
) => {
  const cacheKey = JSON.stringify([
    point.category,
    point.connection?.label,
    Boolean(point.connection),
    point.isInvisible ?? false,
    point.isRandomCandidate ?? false,
    selected,
    isEditMode,
    connectionHighlight,
  ]);
  const cachedIcon = markerIconCache.get(cacheKey);
  if (cachedIcon) return cachedIcon;

  const isHotspot = HOTSPOT_CATEGORIES.has(point.category);
  const source = CATEGORY_ICONS[point.category];
  const isInvisible = point.isInvisible ?? false;
  const connectionBadge =
    point.category === 'pipe' && point.connection
      ? `<span class="interactive-map-pipe-badge" aria-hidden="true">${escapeHtml(point.connection.label ?? '↔')}</span>`
      : null;
  const zoom =
    point.category === 'cheese'
      ? 0.68
      : point.category === 'rocket'
        ? 0.5
        : point.category === 'drink'
          ? 1.1
          : point.category === 'wallCrack'
            ? 0.65
            : point.category === 'idleFruitPlate'
              ? 1.2
              : point.category === 'geometryBarrel'
                ? 0.5
                : 1;
  const content = connectionBadge
    ? connectionBadge
    : isInvisible
      ? `<span class="block h-full w-full rounded-full border-2 ${selected ? 'border-cyan-300 bg-cyan-300/25' : isEditMode ? 'border-dashed border-cyan-300/70 bg-cyan-300/10' : 'border-transparent'}"></span>`
      : point.category === 'teleport'
        ? '<span class="interactive-map-teleport-hotspot" aria-hidden="true"></span>'
        : isHotspot
          ? `<span class="block h-full w-full rounded-full border-2 ${selected ? 'border-cyan-300 bg-cyan-300/25' : 'border-transparent'}"></span>`
          : source
            ? getMarkerPictureHtml(source, zoom)
            : '';
  const [width, height] = isHotspot || isInvisible ? [32, 32] : [42, 42];
  const [anchorX, anchorY] = isHotspot || isInvisible ? [16, 16] : [21, 36];
  const html = `<span class="interactive-map-marker-content ${point.isRandomCandidate ? 'interactive-map-marker--random' : ''} ${selected ? 'interactive-map-marker--selected' : ''} ${connectionHighlight === 'endpoint' ? 'interactive-map-marker--connection-endpoint' : ''} ${connectionHighlight === 'unrelated' ? 'interactive-map-marker--connection-unrelated' : ''}" style="width:${width}px;height:${height}px;--interactive-map-marker-anchor-x:${anchorX}px;--interactive-map-marker-anchor-y:${anchorY}px">${content}</span>`;

  const icon = L.divIcon({
    className: 'interactive-map-marker',
    html,
    iconSize: [width, height],
    iconAnchor: [anchorX, anchorY],
  });
  markerIconCache.set(cacheKey, icon);
  return icon;
};

export const vertexIcon = L.divIcon({
  className: 'interactive-map-vertex',
  html: '<span></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

export const firecrackerIcon = L.divIcon({
  className: 'interactive-map-marker',
  html: `<span class="interactive-map-marker-content" style="width:34px;height:34px;--interactive-map-marker-anchor-x:17px;--interactive-map-marker-anchor-y:17px">${getMarkerPictureHtml('/images/items/小鞭炮.png')}</span>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});
