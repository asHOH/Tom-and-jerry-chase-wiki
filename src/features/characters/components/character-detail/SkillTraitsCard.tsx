import { Skill } from '@/data/types';
import AccordionCard from '@/components/ui/AccordionCard';
import CollapseCard from '@/components/ui/CollapseCard';
import { filterTraitsBySingleItem } from '@/components/displays/traits/shared/filterTraitsBySingleItem';
import SingleItemTraitsText from '@/components/displays/traits/shared/SingleItemTraitsText';
import { entities } from '@/data';

interface SkillTraitsCardProps {
  skill: Skill;
}

export default function SkillTraitsCard({ skill }: SkillTraitsCardProps) {
  const OwnEntities = Object.values({ ...entities.cat, ...entities.mouse }).filter((entity) => {
    const owner = entity.owner;

    if (!owner) return false; // 如果 owner 不存在，直接返回 false

    // 处理数组情况
    if (Array.isArray(owner)) {
      return owner.some((item) => item?.type === 'skill' && item?.name === skill.name);
    }

    // 处理单个对象情况（保持原有逻辑）
    return owner?.type === 'skill' && owner?.name === skill.name;
  });
  const NumberOfOwnTraits: number[] = [skill, ...OwnEntities].map((a, key) => {
    return filterTraitsBySingleItem({ name: a.name, type: key === 0 ? 'skill' : 'entity' }).length;
  });
  const OwnEntitiesItems = OwnEntities.map((entity, key) => {
    return {
      id: String(key + 1),
      title: `${entity.name}${entity.name === skill.name ? '-衍生物' : ''}(${NumberOfOwnTraits[key + 1]})`,
      children: <SingleItemTraitsText singleItem={{ name: entity.name, type: 'entity' }} />,
      activeColor: 'orange' as const,
    };
  });

  return (
    <CollapseCard
      title={`${skill.name}${OwnEntities.length > 0 ? '及其衍生物' : ''}的相关互动特性(${NumberOfOwnTraits.reduce((a, b) => a + b)})`}
      size='xs'
      className='rounded-md border-x-1 border-b-1 border-gray-300 px-1 pb-1 whitespace-pre-wrap dark:border-gray-700'
      titleClassName='pl-3'
      color='lime'
    >
      {OwnEntities.length === 0 ? (
        <div>
          <SingleItemTraitsText singleItem={{ name: skill.name, type: 'skill' }} />
        </div>
      ) : (
        <div className='mx-2 mt-0.5 mb-2'>
          <AccordionCard
            items={[
              {
                id: '0',
                title: `${skill.name}(${NumberOfOwnTraits[0]})`,
                children: <SingleItemTraitsText singleItem={{ name: skill.name, type: 'skill' }} />,
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
