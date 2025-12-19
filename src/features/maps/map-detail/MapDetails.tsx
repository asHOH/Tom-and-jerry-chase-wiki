'use client';

import { useSpecifyTypeKeyboardNavigation } from '@/hooks/useSpecifyTypeKeyboardNavigation';
import { useAppContext } from '@/context/AppContext';
import { Map } from '@/data/types';
import DetailShell, { DetailSection } from '@/features/shared/detail-view/DetailShell';
import DetailTextSection from '@/features/shared/detail-view/DetailTextSection';

import MapAttributesCard from './MapAttributesCard';

export default function MapDetailClient({ map }: { map: Map }) {
  // 键盘导航
  useSpecifyTypeKeyboardNavigation(map.name, 'map');

  const { isDetailedView } = useAppContext();
  if (!map) return null;

  // 构建房间信息的描述文本
  const getRoomInfoText = () => {
    const parts = [];
    if (map.roomCount !== undefined) {
      parts.push(`共有${map.roomCount}个有名称的房间`);
    }
    if (map.hiddenRoom !== undefined) {
      parts.push(map.hiddenRoom ? '包含彩蛋房' : '不包含彩蛋房');
    }
    if (map.randomizedRoom !== undefined) {
      parts.push(map.randomizedRoom ? '存在随机生成变种的房间' : '不存在随机生成变种的房间');
    }
    return parts.join('，');
  };

  // 构建管道和门信息的描述文本
  const getStructureInfoText = () => {
    const parts = [];
    if (map.pipeCount !== undefined) {
      parts.push(`包含${map.pipeCount}条常规管道（双向管道只计一条）`);
    }
    if (map.doorCount !== undefined) {
      parts.push(`包含${map.doorCount}扇传统木门（不计自动门等特殊门）`);
    }
    return parts.join('，');
  };

  const sections: DetailSection[] = (
    [
      {
        key: 'mapInfo',
        title: '地图概况',
        value:
          `${map.name}是一张${map.size || ''}型${map.type}。` +
          (map.studyLevelUnlock ? `在${map.studyLevelUnlock}解锁。` : '') +
          (map.supportedModes && map.supportedModes.length > 0
            ? `支持${map.supportedModes.join('、')}等游戏模式。`
            : ''),
        detailedValue: null,
      },
      {
        key: 'roomInfo',
        title: '房间结构',
        value: getRoomInfoText(),
        detailedValue: null,
      },
      {
        key: 'structureInfo',
        title: '特殊结构',
        value: getStructureInfoText(),
        detailedValue: null,
      },
      map.mapSkin && map.mapSkin.length > 0
        ? {
            key: 'mapSkin',
            title: '地图换肤',
            value: `该地图有以下换肤变种：${map.mapSkin.join('、')}`,
            detailedValue: null,
          }
        : null,
    ] as const
  )
    .filter(<T,>(section: T | null): section is T => section !== null)
    .map<DetailSection>(({ key, title, value, detailedValue }) => ({
      key,
      render: () => (
        <DetailTextSection
          title={title}
          value={value}
          detailedValue={detailedValue}
          isDetailedView={isDetailedView}
        />
      ),
    }));

  return (
    <DetailShell
      leftColumn={<MapAttributesCard map={map} />}
      sections={sections}
      rightColumnProps={{ style: { whiteSpace: 'pre-wrap' } }}
    />
  );
}
