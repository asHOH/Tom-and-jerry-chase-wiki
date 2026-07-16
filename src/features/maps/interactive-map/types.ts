import type { InteractiveMapConfig } from '@/data/types';

export type InteractiveMapProps = {
  config: InteractiveMapConfig;
  mapName: string;
  isEditMode: boolean;
  alwaysFullscreen?: boolean | undefined;
  fallbackImageUrl?: string | undefined;
  onConfigChange?: ((config: InteractiveMapConfig) => void) | undefined;
};

export type EditorMode =
  | 'browse'
  | 'selectRoom'
  | 'addPoint'
  | 'drawRoom'
  | 'placeGeometryBarrelFirecracker'
  | 'selectGeometryBarrelRocket'
  | 'selectIdleFruitPlateWallCrack';
