import React from 'react';
import { Skill } from '@/data/types';
import CollapseCard from '@/components/ui/CollapseCard';
import SingleItemTraitsText from '../../traits/shared/TextOfSingleItemTraits';
import AccordionCard from '@/components/ui/AccordionCard';
import { entities } from '@/data';

interface SkillTraitsCardProps {
  skill: Skill;
}

export default function SkillTraitsCard({ skill }: SkillTraitsCardProps) {
  const OwnEntities = Object.values({ ...entities.cat, ...entities.mouse }).filter(
    (entity) => entity.skillname === skill.name
  );
  const OwnEntitiesItems = OwnEntities.map((entity, key) => {
    return {
      id: String(key),
      title: `${entity.name}`,
      children: <SingleItemTraitsText singleItem={{ name: entity.name, type: 'entity' }} />,
    };
  });
  return (
    <CollapseCard
      title={`${skill.name}${OwnEntities.length > 0 ? '及其衍生物' : ''}的相关互动特性`}
      size='xs'
      className='pb-1 border-x-1 border-b-1 border-gray-300 dark:border-gray-700 rounded-md whitespace-pre-wrap'
      titleClassName='pl-3 bg-lime-100 dark:bg-lime-900 border-2 border-lime-200 dark:border-lime-700'
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
                id: 'skill',
                title: `${skill.name}(技能)`,
                children: <SingleItemTraitsText singleItem={{ name: skill.name, type: 'skill' }} />,
                color: 'orange',
              },
              ...OwnEntitiesItems,
            ]}
            size='xs'
            defaultOpenId='skill'
          ></AccordionCard>
        </div>
      )}
    </CollapseCard>
  );
}
