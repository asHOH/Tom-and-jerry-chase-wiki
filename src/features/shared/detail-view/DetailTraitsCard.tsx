import { SingleItem } from '@/data/types';
import AccordionCard from '@/components/ui/AccordionCard';
import CollapseCard from '@/components/ui/CollapseCard';
import { entities } from '@/data';

import SingleItemTraitsText from '../components/SingleItemTraitsText';
import { filterTraitsBySingleItem } from '../traits/filterTraitsBySingleItem';

interface DetailTraitsCardProps {
  singleItem: SingleItem;
}

export default function DetailTraitsCard({ singleItem }: DetailTraitsCardProps) {
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
  const NumberOfOwnTraits: number[] = [singleItem, ...OwnEntities].map((a, key) => {
    return filterTraitsBySingleItem({ name: a.name, type: key === 0 ? singleItem.type : 'entity' })
      .length;
  });
  const OwnEntitiesItems = OwnEntities.map((entity, key) => {
    return {
      id: String(key + 1),
      title: `${entity.name}${entity.name === singleItem.name ? '-衍生物' : ''}(${NumberOfOwnTraits[key + 1]})`,
      children: <SingleItemTraitsText singleItem={{ name: entity.name, type: 'entity' }} />,
      activeColor: 'orange' as const,
    };
  });

  return (
    <CollapseCard
      title={`${singleItem.name}${OwnEntities.length > 0 ? '及其衍生物' : ''}的相关互动特性(${NumberOfOwnTraits.reduce((a, b) => a + b)})`}
      size='xs'
      className='rounded-md border-x-1 border-b-1 border-gray-300 px-1 pb-1 whitespace-pre-wrap dark:border-gray-700'
      titleClassName='pl-3'
      color='lime'
    >
      {OwnEntities.length === 0 ? (
        <div>
          <SingleItemTraitsText singleItem={{ name: singleItem.name, type: singleItem.type }} />
        </div>
      ) : (
        <div className='mx-2 mt-0.5 mb-2'>
          <AccordionCard
            items={[
              {
                id: '0',
                title: `${singleItem.name}(${NumberOfOwnTraits[0]})`,
                children: (
                  <SingleItemTraitsText
                    singleItem={{ name: singleItem.name, type: singleItem.type }}
                  />
                ),
                activeColor: 'orange',
              },
              ...OwnEntitiesItems,
            ]}
            size='xs'
            defaultOpenId={String(NumberOfOwnTraits.findIndex((number) => number > 0))}
          ></AccordionCard>
        </div>
      )}
    </CollapseCard>
  );
}
