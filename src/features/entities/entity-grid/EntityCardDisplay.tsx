import { getEntityTypeColors } from '@/lib/design';
import { useDarkMode } from '@/context/DarkModeContext';
import { Entity } from '@/data/types';
import CatalogCard from '@/components/ui/CatalogCard';
import Tag from '@/components/ui/Tag';

export default function EntityCardDisplay({
  entity,
  showTags = true,
}: {
  entity: Entity;
  showTags?: boolean;
}) {
  const [isDarkMode] = useDarkMode();

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
    <CatalogCard
      title={entity.name}
      imageSrc={entity.imageUrl}
      imageAlt=''
      href={`/entities/${encodeURIComponent(entity.name)}`}
      ariaLabel={`查看${entity.name}衍生物详情`}
      overlay={
        showTags ? (
          <div
            className='absolute top-2 left-2 z-10 flex flex-col'
            role='group'
            aria-label='实体标签组'
          >
            {renderTags()}
          </div>
        ) : undefined
      }
      tagsAriaLabel='衍生物属性'
      tagsClassName='entitys-center flex flex-wrap justify-center gap-1.5 text-sm text-gray-600 dark:text-gray-300'
      tags={putTypeTagOn(entity)}
    />
  );
}
