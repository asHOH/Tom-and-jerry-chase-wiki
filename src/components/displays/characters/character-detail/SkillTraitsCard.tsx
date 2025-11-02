import AccordionCard from '@/components/ui/AccordionCard';
import CollapseCard from '@/components/ui/CollapseCard';
import { entities } from '@/data';
import { Skill } from '@/data/types';
import SingleItemTraitsText, {
  filterTraitsBySingleItem,
} from '../../traits/shared/SingleItemTraitsText';

interface SkillTraitsCardProps {
  skill: Skill;
}

export default function SkillTraitsCard({ skill }: SkillTraitsCardProps) {
  const OwnEntities = Object.values({ ...entities.cat, ...entities.mouse }).filter(
    (entity) => entity.owner?.type === 'skill' && entity.owner.name === skill.name
  );
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
      className='pb-1 px-1 border-x-1 border-b-1 border-gray-300 dark:border-gray-700 rounded-md whitespace-pre-wrap'
      titleClassName='pl-3'
      color='lime'
    >
      {OwnEntities.length === 0 ? (
        <div>
          <SingleItemTraitsText singleItem={{ name: skill.name, type: 'skill' }} />
        </div>
      ) : (
        <div className='mx-2 mb-2 mt-0.5'>
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
