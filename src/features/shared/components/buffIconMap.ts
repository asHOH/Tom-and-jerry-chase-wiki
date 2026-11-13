import allBuffIcons from '@/features/buffs/data/allBuffIcons.json';

const ICON_BASE_PATH = '/images/buffs/';
const ICON_EXT = '.png';

const icons: Record<string, string> = allBuffIcons as Record<string, string>;

export function getBuffIcons(): Record<string, string> {
  return icons;
}

/**
 * 将图标名解析为 <img src> 可用的地址：
 * - 已是完整路径 / URL / data URI → 原样返回；
 * - 已带扩展名（如 a.png / a.webp）→ 仅补基础目录；
 * - 裸名（如 a）→ 补基础目录 + 默认扩展名。
 */
export function getBuffIconSrc(iconName: string | undefined): string {
  if (iconName === undefined) return '/images/buffs/undefined.png';
  if (/^(?:https?:|data:|\/|\.)/.test(iconName)) return iconName;
  if (/\.[a-zA-Z0-9]+$/.test(iconName)) return `${ICON_BASE_PATH}${iconName}`;
  return `${ICON_BASE_PATH}${iconName}${ICON_EXT}`;
}
