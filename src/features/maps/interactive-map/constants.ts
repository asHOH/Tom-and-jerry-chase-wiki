import type { MapPointCategory } from '@/data/types';

import { ALWAYS_VISIBLE_CATEGORIES } from './mapUtils';

export const CATEGORY_ICONS: Partial<Record<MapPointCategory, string>> = {
  cheese: '/images/items/奶酪.png',
  rocket: '/images/items/火箭.png',
  drink: '/images/items/神秘饮料.png',
  wallCrack: '/images/fixtures/墙缝.png',
  idleFruitPlate: '/images/items/果盘.png',
  geometryBarrel: '/images/entities/火药桶.png',
  scoutingCanary: '/images/fixtures/侦查金丝雀.png',
};

export const FILTER_STORAGE_KEY = 'interactive-map:visible-categories:v3';
export const HOTSPOT_CATEGORIES = new Set<MapPointCategory>([
  'teleport',
  ...ALWAYS_VISIBLE_CATEGORIES,
]);
export const DETAILS_PANEL_DESKTOP_BREAKPOINT = 768;
export const DETAILS_PANEL_DESKTOP_WIDTH = 320;
export const DETAILS_PANEL_MOBILE_HEIGHT_RATIO = 0.52;
export const LOCATE_POINT_PADDING = 16;
