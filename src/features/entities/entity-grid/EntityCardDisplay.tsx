import { getEntityTypeColors } from '@/lib/design';
import { useMobile } from '@/hooks/useMediaQuery';
import { useDarkMode } from '@/context/DarkModeContext';
import { Entity } from '@/data/types';
import BaseCard from '@/components/ui/BaseCard';
import GameImage from '@/components/ui/GameImage';
import Tag from '@/components/ui/Tag';

export default function EntityCardDisplay({
  entity,
  showTags = true,
}: {
  entity: Entity;
  showTags?: boolean;
}) {
  const [isDarkMode] = useDarkMode();
  const isMobile = useMobile();

  // 生成标签列表（竖向排列在图片左上角，动态圆角）
  const renderTags = () => {
    const tags = Array.isArray(entity.entitytag) ? entity.entitytag : [entity.entitytag];

    return tags.map((tag, index) => {
      // 调用 getEntityTypeColors，传入 isMinor = true
      const tagColors = getEntityTypeColors(tag, isDarkMode, true);

      // 根据位置计算圆角
      let borderRadius = '';
      if (tags.length === 1) {
        borderRadius = '0.375rem';
      } else {
        if (index === 0) {
          borderRadius = '0.375rem 0.375rem 0 0';
        } else if (index === tags.length - 1) {
          borderRadius = '0 0 0.375rem 0.375rem';
        } else {
          borderRadius = '0';
        }
      }

      return (
        <Tag
          key={tag}
          size='xxs'
          colorStyles={{
            ...tagColors,
            borderRadius,
            padding: '0.1rem 0.15rem',
          }}
        >
          {tag}
        </Tag>
      );
    });
  };

  function putTypeTagOn(entity: Entity) {
    if (typeof entity.entitytype === 'string') {
      return (
        <Tag
          size='xs'
          margin='compact'
          // 底部的类型标签不传入 isMinor，或传入 false（默认）
          colorStyles={getEntityTypeColors(entity.entitytype, isDarkMode)}
        >
          {entity.entitytype}
        </Tag>
      );
    } else {
      return entity.entitytype.map((type) => (
        <Tag
          key={type}
          size='xs'
          margin='compact'
          colorStyles={getEntityTypeColors(type, isDarkMode)}
        >
          {type}
        </Tag>
      ));
    }
  }

  return (
    <BaseCard variant='item' aria-label={`查看${entity.name}衍生物详情`}>
      <div className='relative'>
        <GameImage
          src={entity.imageUrl}
          alt={`${entity.name}衍生物图标`}
          size='ITEM_CARD'
          className={`hover:scale-105 ${isMobile ? 'h-32 w-auto' : ''}`}
        />
        {/* 竖向标签列：根据 showTags 决定是否显示 */}
        {showTags && (
          <div
            className='absolute top-2 left-2 z-10 flex flex-col'
            role='group'
            aria-label='实体标签组'
          >
            {renderTags()}
          </div>
        )}
      </div>

      <div className={`${isMobile ? '' : 'px-3'} w-full pt-1 pb-3 text-center`}>
        <h3
          className={`${isMobile && entity.name.length >= 6 ? 'text-md' : 'mb-1 text-lg'} h-6 font-bold whitespace-pre text-gray-800 dark:text-white`}
        >
          {entity.name}
        </h3>

        <div
          className='entitys-center flex flex-wrap justify-center gap-1.5 text-sm text-gray-600 dark:text-gray-300'
          role='group'
          aria-label='衍生物属性'
        >
          {putTypeTagOn(entity)}
        </div>
      </div>
    </BaseCard>
  );
}
