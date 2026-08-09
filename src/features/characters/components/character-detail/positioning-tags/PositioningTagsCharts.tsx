import { useId } from 'react';

import { getPositioningTagColors } from '@/lib/design';
import { getPositioningTagTooltipContent } from '@/lib/tooltipUtils';
import type { FactionId } from '@/data/types';
import Tooltip from '@/components/ui/Tooltip';

import type { PositioningTagChartDatum, PositioningTagViewMode } from './positioningTagViewModel';

type PositioningTagsChartProps = {
  data: readonly PositioningTagChartDatum[];
  factionId: FactionId;
  isDetailed: boolean;
  isDarkMode: boolean;
  viewMode: Exclude<PositioningTagViewMode, 'text'>;
};

const MAX_LEVEL = 4;
const RADAR_MAX_DISPLAY_LEVEL = MAX_LEVEL + 1;
const CHART_LABELS: Record<Exclude<PositioningTagViewMode, 'text'>, string> = {
  bar: '柱状图',
  radar: '雷达图',
};

const polarPoint = (center: number, radius: number, angle: number) => ({
  x: center + radius * Math.cos(angle),
  y: center + radius * Math.sin(angle),
});

const getTagColor = (datum: PositioningTagChartDatum, factionId: FactionId, isDarkMode: boolean) =>
  getPositioningTagColors(datum.tagName, datum.level, false, factionId, isDarkMode).color;

const getRadarDisplayLevel = (level: number) => level + 1;

export function getRoseSectorAngles(index: number, dataLength: number, gap = 0.035) {
  const slice = (Math.PI * 2) / dataLength;
  const axisAngle = -Math.PI / 2 + index * slice;
  return {
    axisAngle,
    startAngle: axisAngle - slice / 2 + gap,
    endAngle: axisAngle + slice / 2 - gap,
  };
}

function PositioningTagDataTable({
  data,
  viewMode,
}: {
  data: readonly PositioningTagChartDatum[];
  viewMode: Exclude<PositioningTagViewMode, 'text'>;
}) {
  const tableData =
    viewMode === 'bar'
      ? data.filter((datum) => datum.level > 0).sort((left, right) => right.level - left.level)
      : data;

  return (
    <table className='sr-only' aria-label={`定位${CHART_LABELS[viewMode]}数据`}>
      <thead>
        <tr>
          <th scope='col'>定位标签</th>
          <th scope='col'>等级</th>
        </tr>
      </thead>
      <tbody>
        {tableData.map((datum) => (
          <tr key={datum.tagName}>
            <th scope='row'>{datum.tagName}</th>
            <td>
              {viewMode === 'radar'
                ? `${getRadarDisplayLevel(datum.level)}/${RADAR_MAX_DISPLAY_LEVEL}`
                : `${datum.level}/${MAX_LEVEL}`}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function BarChart({
  data,
  factionId,
  isDetailed,
  isDarkMode,
  titleId,
}: Omit<PositioningTagsChartProps, 'viewMode'> & { titleId: string }) {
  const visibleData = data
    .filter((datum) => datum.level > 0)
    .sort((left, right) => right.level - left.level);
  const chartWidth = 230;
  const chartLeft = 78;
  const rowHeight = 27;
  const top = 18;
  const chartHeight = top + rowHeight * visibleData.length + 8;

  return (
    <svg
      className='h-auto w-full min-w-75 text-gray-600 dark:text-gray-300'
      viewBox={`0 0 360 ${chartHeight}`}
      role='img'
      aria-labelledby={titleId}
      data-testid='positioning-bar-chart'
    >
      <title id={titleId}>定位柱状图</title>
      {[0, 1, 2, 3, 4].map((level) => {
        const x = chartLeft + (chartWidth * level) / MAX_LEVEL;
        return (
          <g key={level}>
            <line
              x1={x}
              x2={x}
              y1={top - 8}
              y2={chartHeight - 8}
              stroke='currentColor'
              strokeDasharray='2 3'
              opacity={0.25}
            />
            <text x={x} y={12} textAnchor='middle' fontSize='10' fill='currentColor'>
              {level}
            </text>
          </g>
        );
      })}
      {visibleData.map((datum, index) => {
        const y = top + index * rowHeight;
        const width = (chartWidth * datum.level) / MAX_LEVEL;
        const color = getTagColor(datum, factionId, isDarkMode);
        return (
          <g key={datum.tagName}>
            <Tooltip
              content={getPositioningTagTooltipContent(datum.tagName, factionId, isDetailed)}
              asChild
            >
              <text
                x={chartLeft - 8}
                y={y + 11}
                textAnchor='end'
                fontSize='12'
                fill='currentColor'
                className='cursor-help'
              >
                {datum.tagName}
              </text>
            </Tooltip>
            <rect
              x={chartLeft}
              y={y}
              width={chartWidth}
              height={14}
              rx={7}
              fill='currentColor'
              opacity={0.1}
            />
            {width > 0 && (
              <rect
                x={chartLeft}
                y={y}
                width={width}
                height={14}
                rx={7}
                fill={color}
                opacity={datum.level === 2 ? 0.75 : 1}
              >
                <title>{`${datum.tagName}：等级${datum.level}/4`}</title>
              </rect>
            )}
            <text x={chartLeft + chartWidth + 9} y={y + 11} fontSize='11' fill='currentColor'>
              {datum.level}/4
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function RadarChart({
  data,
  factionId,
  isDetailed,
  isDarkMode,
  titleId,
}: Omit<PositioningTagsChartProps, 'viewMode'> & { titleId: string }) {
  const center = 140;
  const radius = 94;
  const viewBox = '0 0 300 280';
  const slice = (Math.PI * 2) / data.length;
  const getAxisAngle = (index: number) => -Math.PI / 2 + index * slice;
  const getPoint = (index: number, displayLevel: number) =>
    polarPoint(center, (radius * displayLevel) / RADAR_MAX_DISPLAY_LEVEL, getAxisAngle(index));
  const dataPoints = data
    .map((datum, index) => {
      const point = getPoint(index, getRadarDisplayLevel(datum.level));
      return `${point.x.toFixed(2)},${point.y.toFixed(2)}`;
    })
    .join(' ');

  return (
    <svg
      className='mx-auto h-auto w-full max-w-85 text-gray-600 dark:text-gray-300'
      viewBox={viewBox}
      role='img'
      aria-labelledby={titleId}
      data-testid='positioning-radar-chart'
    >
      <title id={titleId}>定位雷达图</title>
      {[1, 2, 3, 4, 5].map((level) => (
        <polygon
          key={level}
          points={data
            .map((_, index) => {
              const point = getPoint(index, level);
              return `${point.x.toFixed(2)},${point.y.toFixed(2)}`;
            })
            .join(' ')}
          fill='none'
          stroke='currentColor'
          strokeDasharray='2 3'
          opacity={0.25}
        />
      ))}
      <polygon
        points={dataPoints}
        fill='currentColor'
        stroke='currentColor'
        strokeLinejoin='round'
        opacity={0.18}
      />
      {data.map((datum, index) => {
        const angle = getAxisAngle(index);
        const axisEnd = polarPoint(center, radius, angle);
        const labelPoint = polarPoint(center, radius + 24, angle);
        const valuePoint = getPoint(index, getRadarDisplayLevel(datum.level));
        const color = getTagColor(datum, factionId, isDarkMode);
        return (
          <g key={datum.tagName}>
            <line
              x1={center}
              y1={center}
              x2={axisEnd.x}
              y2={axisEnd.y}
              stroke='currentColor'
              opacity={0.25}
            />
            <circle
              cx={valuePoint.x}
              cy={valuePoint.y}
              r='3.5'
              fill={datum.level > 0 ? color : 'currentColor'}
              opacity={datum.level === 2 ? 0.75 : 1}
            >
              <title>{`${datum.tagName}：等级${getRadarDisplayLevel(datum.level)}/5`}</title>
            </circle>
            <Tooltip
              content={getPositioningTagTooltipContent(datum.tagName, factionId, isDetailed)}
              asChild
            >
              <text
                x={labelPoint.x}
                y={labelPoint.y}
                textAnchor={
                  labelPoint.x < center - 4 ? 'end' : labelPoint.x > center + 4 ? 'start' : 'middle'
                }
                dominantBaseline='middle'
                fontSize='12'
                fill='currentColor'
                className='cursor-help'
              >
                {datum.tagName}
              </text>
            </Tooltip>
          </g>
        );
      })}
      <text x={center} y={center + 4} textAnchor='middle' fontSize='11' fill='currentColor'>
        1–5
      </text>
    </svg>
  );
}

export default function PositioningTagsChart({
  data,
  factionId,
  isDetailed,
  isDarkMode,
  viewMode,
}: PositioningTagsChartProps) {
  const titleId = useId();

  return (
    <div className='rounded-lg border border-gray-200 bg-gray-50/60 p-2 dark:border-gray-700 dark:bg-slate-800/40'>
      {viewMode === 'bar' ? (
        <BarChart
          data={data}
          factionId={factionId}
          isDetailed={isDetailed}
          isDarkMode={isDarkMode}
          titleId={titleId}
        />
      ) : (
        <RadarChart
          data={data}
          factionId={factionId}
          isDetailed={isDetailed}
          isDarkMode={isDarkMode}
          titleId={titleId}
        />
      )}
      <PositioningTagDataTable data={data} viewMode={viewMode} />
    </div>
  );
}
