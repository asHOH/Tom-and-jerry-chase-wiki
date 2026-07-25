import type { InteractiveMapConfig } from '@/data/types';

import {
  DETAILS_PANEL_DESKTOP_WIDTH,
  DETAILS_PANEL_MOBILE_HEIGHT_RATIO,
  LOCATE_POINT_PADDING,
} from './constants';
import { getMapBounds } from './mapUtils';

type InteractiveMapGeometry = Pick<InteractiveMapConfig, 'width' | 'height' | 'maxZoom'>;

type ViewportSize = {
  width: number;
  height: number;
};

type PixelPadding = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

const getViewportPadding = ({ width, height }: ViewportSize): PixelPadding => {
  const halfWidth = Math.ceil(width / 2);
  const halfHeight = Math.ceil(height / 2);

  return {
    top: halfHeight + LOCATE_POINT_PADDING,
    right: Math.ceil(Math.max(width / 2, DETAILS_PANEL_DESKTOP_WIDTH)) + LOCATE_POINT_PADDING,
    bottom:
      Math.ceil(Math.max(height / 2, height * DETAILS_PANEL_MOBILE_HEIGHT_RATIO)) +
      LOCATE_POINT_PADDING,
    left: halfWidth + LOCATE_POINT_PADDING,
  };
};

export const getViewportAwareMaxBounds = (
  config: InteractiveMapGeometry,
  viewport: ViewportSize,
  zoom: number
): [[number, number], [number, number]] => {
  if (viewport.width <= 0 || viewport.height <= 0) return getMapBounds(config);

  const [[top, left], [bottom, right]] = getMapBounds(config);
  const padding = getViewportPadding(viewport);
  const zoomScale = 2 ** zoom;

  return [
    [top + padding.top / zoomScale, left - padding.left / zoomScale],
    [bottom - padding.bottom / zoomScale, right + padding.right / zoomScale],
  ];
};
