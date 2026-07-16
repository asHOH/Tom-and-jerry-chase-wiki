'use client';

import { useId } from 'react';
import { Pane, SVGOverlay } from 'react-leaflet';

type MapGridBackgroundProps = {
  bounds: [[number, number], [number, number]];
  height: number;
  width: number;
};

export function MapGridBackground({ bounds, height, width }: MapGridBackgroundProps) {
  const gridId = useId().replaceAll(':', '');
  const minorGridId = `${gridId}-minor`;
  const majorGridId = `${gridId}-major`;

  return (
    <Pane name='mapGrid' className='interactive-map-grid-pane'>
      <SVGOverlay
        bounds={bounds}
        interactive={false}
        className='interactive-map-grid'
        attributes={{
          viewBox: `0 0 ${width} ${height}`,
          preserveAspectRatio: 'none',
          'aria-hidden': 'true',
          focusable: 'false',
        }}
      >
        <defs>
          <pattern id={minorGridId} width='128' height='128' patternUnits='userSpaceOnUse'>
            <path
              d='M 128 0 L 0 0 0 128'
              fill='none'
              stroke='#cbd5e1'
              strokeOpacity='0.32'
              strokeWidth='1'
              vectorEffect='non-scaling-stroke'
            />
          </pattern>
          <pattern id={majorGridId} width='512' height='512' patternUnits='userSpaceOnUse'>
            <rect width='512' height='512' fill={`url(#${minorGridId})`} />
            <path
              d='M 512 0 L 0 0 0 512'
              fill='none'
              stroke='#f1f5f9'
              strokeOpacity='0.6'
              strokeWidth='1.5'
              vectorEffect='non-scaling-stroke'
            />
          </pattern>
        </defs>
        <rect width={width} height={height} fill={`url(#${majorGridId})`} />
      </SVGOverlay>
    </Pane>
  );
}
