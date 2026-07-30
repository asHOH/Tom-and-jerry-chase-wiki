'use client';

import { useState } from 'react';

import type {
  InteractiveMapConfig,
  InteractiveMapPoint,
  MapPointCategory,
  SingleItemOrGroup,
} from '@/data/types';
import Button from '@/components/ui/Button';

import { CATEGORY_ICONS } from './constants';
import { ALWAYS_VISIBLE_CATEGORIES, MAP_CATEGORY_LABELS } from './mapUtils';
import type { EditorMode } from './types';

type EditorPanelProps = {
  config: InteractiveMapConfig;
  editorMode: EditorMode;
  pointCategory: MapPointCategory;
  roomName: string;
  draftPointCount: number;
  selectedPoint: InteractiveMapPoint | null;
  isGeometryBarrelRouteComplete: boolean;
  selectedRoomId: string | null;
  canUndo: boolean;
  canRedo: boolean;
  onEditorMode: (mode: EditorMode) => void;
  onPointCategory: (value: MapPointCategory) => void;
  onRoomName: (value: string) => void;
  onFinishRoom: () => void;
  onCancelDrawing: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onUpdatePoint: (changes: Partial<InteractiveMapPoint>) => void;
  onConnectPoint: (targetPointId: string) => void;
  onUpdateConnectionLabel: (label: string) => void;
  onGeometryBarrelCountdownDisplay: (value: number | null) => void;
  onPlaceGeometryBarrelFirecracker: () => void;
  onSelectGeometryBarrelRocket: () => void;
  onClearGeometryBarrelTarget: () => void;
  onSelectIdleFruitPlateWallCrack: () => void;
  onClearIdleFruitPlateTarget: () => void;
  onDeletePoint: () => void;
  onDeleteRoom: () => void;
  onMoveRoom: (x: number, y: number) => void;
};

export default function EditorPanel(props: EditorPanelProps) {
  const [relatedName, setRelatedName] = useState('');
  const [relatedType, setRelatedType] = useState<SingleItemOrGroup['type']>('fixture');
  const supportedCategories = (Object.keys(MAP_CATEGORY_LABELS) as MapPointCategory[]).filter(
    (category) =>
      category === 'teleport' || ALWAYS_VISIBLE_CATEGORIES.has(category) || CATEGORY_ICONS[category]
  );
  return (
    <div className='absolute bottom-3 left-3 z-600 max-h-[62%] w-72 overflow-auto rounded-lg bg-slate-950/95 p-3 text-sm text-white shadow-2xl'>
      <div className='mb-3 flex items-center justify-between'>
        <strong>地图标注</strong>
        <div className='flex gap-1'>
          <Button
            variant='unstyled'
            type='button'
            disabled={!props.canUndo}
            onClick={props.onUndo}
            className='rounded bg-white/10 px-2 py-1 disabled:opacity-30'
          >
            撤销
          </Button>
          <Button
            variant='unstyled'
            type='button'
            disabled={!props.canRedo}
            onClick={props.onRedo}
            className='rounded bg-white/10 px-2 py-1 disabled:opacity-30'
          >
            重做
          </Button>
        </div>
      </div>
      {props.editorMode === 'browse' && (
        <div className='grid grid-cols-2 gap-2'>
          <Button
            variant='unstyled'
            type='button'
            className='rounded bg-cyan-700 px-2 py-2'
            onClick={() => props.onEditorMode('addPoint')}
          >
            添加点位
          </Button>
          <Button
            variant='unstyled'
            type='button'
            className='rounded bg-cyan-700 px-2 py-2'
            onClick={() => props.onEditorMode('selectRoom')}
          >
            选择区域
          </Button>
          <Button
            variant='unstyled'
            type='button'
            className='rounded bg-cyan-700 px-2 py-2'
            onClick={() => props.onEditorMode('drawRoom')}
          >
            绘制区域
          </Button>
        </div>
      )}
      {props.editorMode === 'selectRoom' && (
        <div className='space-y-2'>
          <p className='text-xs text-white/65'>点击地图上的区域以选择并编辑。</p>
          <Button
            variant='unstyled'
            type='button'
            onClick={props.onCancelDrawing}
            className='underline'
          >
            取消
          </Button>
        </div>
      )}
      {props.editorMode === 'addPoint' && (
        <div className='space-y-2'>
          <select
            value={props.pointCategory}
            onChange={(event) => props.onPointCategory(event.target.value as MapPointCategory)}
            className='w-full rounded bg-slate-800 px-2 py-2'
          >
            {supportedCategories.map((category) => (
              <option key={category} value={category}>
                {MAP_CATEGORY_LABELS[category]}
              </option>
            ))}
          </select>
          <p className='text-xs text-white/65'>选择类型后，在地图上点击放置。</p>
          <Button
            variant='unstyled'
            type='button'
            onClick={props.onCancelDrawing}
            className='underline'
          >
            取消
          </Button>
        </div>
      )}
      {props.editorMode === 'placeGeometryBarrelFirecracker' && (
        <div className='space-y-2'>
          <p className='text-xs text-white/65'>点击地图放置小鞭炮，放置后可拖动微调。</p>
          <Button
            variant='unstyled'
            type='button'
            onClick={props.onCancelDrawing}
            className='underline'
          >
            取消
          </Button>
        </div>
      )}
      {props.editorMode === 'selectGeometryBarrelRocket' && (
        <div className='space-y-2'>
          <p className='text-xs text-white/65'>点击地图上高亮的火箭，设为飞行路线终点。</p>
          <Button
            variant='unstyled'
            type='button'
            onClick={props.onCancelDrawing}
            className='underline'
          >
            取消
          </Button>
        </div>
      )}
      {props.editorMode === 'selectIdleFruitPlateWallCrack' && (
        <div className='space-y-2'>
          <p className='text-xs text-white/65'>点击地图上高亮的墙缝，设为果盘可远程攻击的目标。</p>
          <Button
            variant='unstyled'
            type='button'
            onClick={props.onCancelDrawing}
            className='underline'
          >
            取消
          </Button>
        </div>
      )}
      {props.editorMode === 'drawRoom' && (
        <div className='space-y-2'>
          <input
            value={props.roomName}
            onChange={(event) => props.onRoomName(event.target.value)}
            placeholder='区域名称'
            className='w-full rounded bg-white/10 px-2 py-2'
          />
          <p className='text-xs text-white/65'>
            依次点击边界顶点，至少需要 3 点。当前 {props.draftPointCount} 点。
          </p>
          <div className='flex gap-2'>
            <Button
              variant='unstyled'
              type='button'
              onClick={props.onFinishRoom}
              className='rounded bg-cyan-700 px-2 py-1'
            >
              完成
            </Button>
            <Button
              variant='unstyled'
              type='button'
              onClick={props.onCancelDrawing}
              className='underline'
            >
              取消
            </Button>
          </div>
        </div>
      )}
      {props.selectedPoint && props.editorMode === 'browse' && (
        <div className='mt-3 space-y-2 border-t border-white/10 pt-3'>
          <strong>编辑点位</strong>
          <input
            value={props.selectedPoint.subtype ?? ''}
            onChange={(event) => props.onUpdatePoint({ subtype: event.target.value })}
            placeholder='子类型（可选）'
            className='w-full rounded bg-white/10 px-2 py-2'
          />
          <textarea
            value={props.selectedPoint.description ?? ''}
            onChange={(event) => props.onUpdatePoint({ description: event.target.value })}
            placeholder='介绍'
            className='w-full rounded bg-white/10 px-2 py-2'
          />
          {props.selectedPoint.category === 'geometryBarrel' && (
            <div className='space-y-3 rounded border border-orange-300/30 bg-orange-950/20 p-2'>
              <div className='flex items-center justify-between gap-2'>
                <p className='text-xs font-medium text-orange-200'>几何桶路线</p>
                <span
                  className={`text-xs ${props.isGeometryBarrelRouteComplete ? 'text-emerald-300' : 'text-amber-300'}`}
                >
                  {props.isGeometryBarrelRouteComplete ? '配置完整' : '待补充'}
                </span>
              </div>
              <label className='block'>
                <span className='text-xs text-white/65'>鞭炮爆炸时火药桶显示数字</span>
                <input
                  type='number'
                  min={0}
                  max={2}
                  step={1}
                  value={
                    props.selectedPoint.geometryBarrelRoute
                      ?.barrelCountdownDisplayAtFirecrackerExplosion ?? ''
                  }
                  onChange={(event) => {
                    if (!event.target.value) {
                      props.onGeometryBarrelCountdownDisplay(null);
                      return;
                    }
                    const value = Number(event.target.value);
                    if (Number.isInteger(value) && value >= 0 && value <= 2) {
                      props.onGeometryBarrelCountdownDisplay(value);
                    }
                  }}
                  className='mt-1 w-full rounded bg-white/10 px-2 py-2'
                />
              </label>
              <Button
                variant='unstyled'
                type='button'
                className='w-full rounded bg-orange-700 px-2 py-2 hover:bg-orange-600'
                onClick={props.onPlaceGeometryBarrelFirecracker}
              >
                {props.selectedPoint.geometryBarrelRoute?.firecrackerPosition
                  ? '重新放置小鞭炮'
                  : '放置小鞭炮'}
              </Button>
              <Button
                variant='unstyled'
                type='button'
                className='w-full rounded bg-orange-700 px-2 py-2 hover:bg-orange-600'
                onClick={props.onSelectGeometryBarrelRocket}
              >
                {props.selectedPoint.geometryBarrelRoute?.targetRocketPointId
                  ? '重新选择目标火箭'
                  : '选择目标火箭'}
              </Button>
              {props.selectedPoint.geometryBarrelRoute?.targetRocketPointId && (
                <Button
                  variant='unstyled'
                  type='button'
                  className='text-xs text-red-300 underline'
                  onClick={props.onClearGeometryBarrelTarget}
                >
                  清除目标火箭
                </Button>
              )}
            </div>
          )}
          {props.selectedPoint.category === 'idleFruitPlate' && (
            <div className='space-y-2 rounded border border-lime-300/30 bg-lime-950/20 p-2'>
              <p className='text-xs font-medium text-lime-200'>对应墙缝</p>
              <Button
                variant='unstyled'
                type='button'
                className='w-full rounded bg-lime-700 px-2 py-2 hover:bg-lime-600'
                onClick={props.onSelectIdleFruitPlateWallCrack}
              >
                {props.selectedPoint.targetWallCrackPointId ? '重新选择墙缝' : '选择墙缝'}
              </Button>
              {props.selectedPoint.targetWallCrackPointId && (
                <Button
                  variant='unstyled'
                  type='button'
                  className='text-xs text-red-300 underline'
                  onClick={props.onClearIdleFruitPlateTarget}
                >
                  清除对应墙缝
                </Button>
              )}
            </div>
          )}
          {props.selectedPoint.category === 'pipe' && props.selectedPoint.id && (
            <div className='rounded border border-white/10 p-2'>
              <p className='mb-2 text-xs text-white/65'>对应管道</p>
              <select
                value={props.selectedPoint.connection?.targetPointId ?? ''}
                onChange={(event) => props.onConnectPoint(event.target.value)}
                className='w-full rounded bg-slate-800 px-2 py-2'
              >
                <option value=''>未连接</option>
                {props.config.points
                  .filter(
                    (candidate) =>
                      candidate.category === 'pipe' &&
                      candidate.id &&
                      candidate.id !== props.selectedPoint?.id
                  )
                  .map((candidate) => (
                    <option key={candidate.id} value={candidate.id}>
                      {candidate.subtype ?? candidate.id}
                    </option>
                  ))}
              </select>
              {props.selectedPoint.connection && (
                <label className='mt-2 block'>
                  <span className='text-xs text-white/65'>配对标记</span>
                  <input
                    value={props.selectedPoint.connection.label ?? ''}
                    maxLength={3}
                    onChange={(event) => props.onUpdateConnectionLabel(event.target.value)}
                    className='mt-1 w-full rounded bg-white/10 px-2 py-2'
                  />
                </label>
              )}
            </div>
          )}
          <details className='rounded border border-white/10'>
            <summary className='cursor-pointer px-2 py-1.5 text-xs text-white/70'>高级设置</summary>
            <div className='space-y-2 border-t border-white/10 p-2'>
              <label className='flex gap-2'>
                <input
                  type='checkbox'
                  checked={props.selectedPoint.isInvisible ?? false}
                  onChange={(event) => props.onUpdatePoint({ isInvisible: event.target.checked })}
                />
                隐藏点位图标
              </label>
              <label className='flex gap-2'>
                <input
                  type='checkbox'
                  checked={props.selectedPoint.isRandomCandidate ?? false}
                  onChange={(event) =>
                    props.onUpdatePoint({ isRandomCandidate: event.target.checked })
                  }
                />
                随机候选点
              </label>
              <label className='block'>
                最低显示级别
                <input
                  type='number'
                  min={0}
                  max={props.config.maxZoom + 2}
                  value={props.selectedPoint.minZoom ?? 0}
                  onChange={(event) => props.onUpdatePoint({ minZoom: Number(event.target.value) })}
                  className='ml-2 w-16 rounded bg-white/10 px-2 py-1'
                />
              </label>
              <div className='rounded border border-white/10 p-2'>
                <p className='mb-2 text-xs text-white/65'>关联百科条目</p>
                {props.selectedPoint.relatedEntries?.map((entry, index) => (
                  <div
                    key={`${entry.type}-${entry.name}-${index}`}
                    className='mb-1 flex justify-between gap-2'
                  >
                    <span>{entry.name}</span>
                    <Button
                      variant='unstyled'
                      type='button'
                      className='text-red-300'
                      onClick={() =>
                        props.onUpdatePoint({
                          relatedEntries:
                            props.selectedPoint?.relatedEntries?.filter(
                              (_, itemIndex) => itemIndex !== index
                            ) ?? [],
                        })
                      }
                    >
                      删除
                    </Button>
                  </div>
                ))}
                <div className='grid grid-cols-[minmax(0,1fr)_4.5rem] gap-1'>
                  <input
                    value={relatedName}
                    onChange={(event) => setRelatedName(event.target.value)}
                    placeholder='条目名称'
                    className='min-w-0 rounded bg-white/10 px-2 py-1'
                  />
                  <select
                    value={relatedType}
                    onChange={(event) =>
                      setRelatedType(event.target.value as SingleItemOrGroup['type'])
                    }
                    className='w-full min-w-0 rounded bg-slate-800 px-1'
                  >
                    <option value='fixture'>组件</option>
                    <option value='item'>道具</option>
                    <option value='itemGroup'>道具组合</option>
                    <option value='character'>角色</option>
                    <option value='map'>地图</option>
                    <option value='mode'>模式</option>
                    <option value='entity'>衍生物</option>
                  </select>
                </div>
                <Button
                  variant='unstyled'
                  type='button'
                  className='mt-2 underline'
                  onClick={() => {
                    if (!relatedName.trim()) return;
                    props.onUpdatePoint({
                      relatedEntries: [
                        ...(props.selectedPoint?.relatedEntries ?? []),
                        { name: relatedName.trim(), type: relatedType },
                      ],
                    });
                    setRelatedName('');
                  }}
                >
                  添加关联
                </Button>
              </div>
            </div>
          </details>
          <Button
            variant='unstyled'
            type='button'
            onClick={props.onDeletePoint}
            className='text-red-300 underline'
          >
            删除点位
          </Button>
        </div>
      )}
      {props.selectedRoomId && props.editorMode === 'browse' && (
        <div className='mt-3 border-t border-white/10 pt-3'>
          <p className='mb-2 text-xs text-white/65'>拖动地图上的青色顶点可调整区域。</p>
          <div className='mb-2 grid w-28 grid-cols-3 gap-1 text-center'>
            <span />
            <Button
              variant='unstyled'
              type='button'
              className='rounded bg-white/10'
              onClick={() => props.onMoveRoom(0, -0.002)}
            >
              ↑
            </Button>
            <span />
            <Button
              variant='unstyled'
              type='button'
              className='rounded bg-white/10'
              onClick={() => props.onMoveRoom(-0.002, 0)}
            >
              ←
            </Button>
            <span />
            <Button
              variant='unstyled'
              type='button'
              className='rounded bg-white/10'
              onClick={() => props.onMoveRoom(0.002, 0)}
            >
              →
            </Button>
            <span />
            <Button
              variant='unstyled'
              type='button'
              className='rounded bg-white/10'
              onClick={() => props.onMoveRoom(0, 0.002)}
            >
              ↓
            </Button>
            <span />
          </div>
          <Button
            variant='unstyled'
            type='button'
            onClick={props.onDeleteRoom}
            className='text-red-300 underline'
          >
            删除所选区域
          </Button>
        </div>
      )}
    </div>
  );
}
