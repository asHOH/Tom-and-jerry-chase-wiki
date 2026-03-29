import singleItemRreverse from '@/lib/singleItemReverse';
import { SingleItem } from '@/data/types';
import AccordionCard from '@/components/ui/AccordionCard';
import CollapseCard from '@/components/ui/CollapseCard';
import { entities } from '@/data';

import SingleItemReverseCard from '../components/SingleItemReverseCard';
import TextWithHoverTooltips from '../components/TextWithHoverTooltips';

interface DetailReverseCardProps {
  singleItem: SingleItem;
}

export default function DetailReverseCard({ singleItem }: DetailReverseCardProps) {
  const contentClassName =
    'rounded-b-md border border-t-0 border-slate-200/80 bg-white/80 px-3 pb-3 pt-2 whitespace-pre-wrap shadow-sm dark:border-slate-700 dark:bg-slate-900/40';

  const OwnEntities = Object.values(entities).filter((entity) => {
    const owner = entity.owner;

    if (!owner) return false; // 如果 owner 不存在，直接返回 false

    // 处理数组情况
    if (Array.isArray(owner)) {
      return owner.some((item) => item?.type === singleItem.type && item?.name === singleItem.name);
    }

    // 处理单个对象情况（保持原有逻辑）
    return owner?.type === singleItem.type && owner?.name === singleItem.name;
  });
  const NumberOfOwnReverse: number[] = [singleItem, ...OwnEntities].map((a, key) => {
    return singleItemRreverse({
      name: a.name,
      type: key === 0 ? singleItem.type : 'entity',
      ...(a.factionId !== undefined ? { factionId: a.factionId } : {}),
    }).length;
  });
  const OwnEntitiesItems = OwnEntities.map((entity, key) => {
    return {
      id: String(key + 1),
      title: `${entity.name}${entity.name === singleItem.name ? '-衍生物' : ''}(${NumberOfOwnReverse[key + 1]})`,
      children: <SingleItemReverseCard singleItem={{ name: entity.name, type: 'entity' }} />,
      activeColor: 'orange' as const,
    };
  });

  return (
    <CollapseCard
      title={`${singleItem.name}${OwnEntities.length > 0 ? '及其衍生物' : ''}的相关引用项(${NumberOfOwnReverse.reduce((a, b) => a + b)})`}
      size='xs'
      className={contentClassName}
      titleClassName='rounded-t-md border px-3 pt-1.5 pb-1'
      color='yellow'
    >
      {OwnEntities.length === 0 ? (
        <div>
          {NumberOfOwnReverse[0] === 0 ? (
            <TextWithHoverTooltips text='    $暂无任何引用本项的界面$italic text-gray-500 dark:text-gray-400 text-sm#' />
          ) : (
            <SingleItemReverseCard singleItem={singleItem} />
          )}
        </div>
      ) : (
        <div>
          <AccordionCard
            items={[
              {
                id: '0',
                title: `${singleItem.name}(${NumberOfOwnReverse[0]})`,
                children: <SingleItemReverseCard singleItem={singleItem} />,
                activeColor: 'orange',
              },
              ...OwnEntitiesItems,
            ]}
            size='xs'
            defaultOpenId={String(NumberOfOwnReverse.findIndex((number) => number > 0))}
          ></AccordionCard>
        </div>
      )}
    </CollapseCard>
  );
}
