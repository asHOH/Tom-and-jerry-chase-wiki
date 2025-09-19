'use client';

import Link from 'next/link';
import SingleItemCardDisplay from './SingleItemCardDisplay';
import PageTitle from '@/components/ui/PageTitle';
import PageDescription from '@/components/ui/PageDescription';
import type { ItemGroup } from '@/data/types';
import { useMobile } from '@/hooks/useMediaQuery';
import { characters, specialSkills } from '@/data';
import { SingleItem } from '@/data/types';
import TextWithHoverTooltips from '../../characters/shared/TextWithHoverTooltips';

export default function ItemGroupClient({ itemGroup }: { itemGroup: ItemGroup }) {
  // Multi-select state for filters
  const isMobile = useMobile();

  const getSingleItemHref = (singleItem: SingleItem): string => {
    let R: string | undefined;
    if (singleItem.type == 'character') {
      R = `/characters/${singleItem.name}`;
    } else if (singleItem.type == 'knowledgeCard') {
      R = `/cards/${singleItem.name}`;
    } else if (singleItem.type == 'specialSkill') {
      const allSpecialSkills = { ...specialSkills.cat, ...specialSkills.mouse };
      const factionId = singleItem.factionId
        ? singleItem.factionId
        : Object.values(allSpecialSkills).find((skill) => skill.name == singleItem.name)?.factionId;
      R = `/special-skills/${factionId}/${singleItem.name}`;
    } else if (singleItem.type == 'item') {
      R = `/items/${singleItem.name}`;
    } else if (singleItem.type == 'entity') {
      R = `/entities/${singleItem.name}`;
    } else if (singleItem.type == 'buff') {
      R = `/buffs/${singleItem.name}`;
    } else if (singleItem.type == 'skill') {
      const skill = Object.values(characters)
        .flatMap((c) => c.skills)
        .find(
          (skill) => skill.name === singleItem.name || skill.aliases?.includes(singleItem.name)
        );
      if (skill) {
        // Skill in processed characters should have id like `${ownerId}-...`
        const id = (skill as { id?: string }).id;
        const ownerId = id ? id.split('-')[0] : undefined;

        R = `/characters/${ownerId}`;
      }
    }

    return R || '/error';
  };

  return (
    <div
      className={
        isMobile
          ? 'max-w-3xl mx-auto p-2 space-y-2 dark:text-slate-200'
          : 'max-w-6xl mx-auto p-6 space-y-8 dark:text-slate-200'
      }
    >
      <header
        className={isMobile ? 'text-center space-y-2 mb-4 px-2' : 'text-center space-y-4 mb-8 px-4'}
      >
        <PageTitle>{itemGroup.name}</PageTitle>
        <PageDescription>
          <TextWithHoverTooltips text={itemGroup.description || ''} />
        </PageDescription>
      </header>
      <div
        className='auto-fit-grid grid-container grid gap-4 mt-8'
        style={{
          gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? '100px' : '150px'}, 1fr))`,
        }}
      >
        {itemGroup.group.map((singleItem) => (
          <div
            key={singleItem.name}
            className='character-card transform transition-transform hover:-translate-y-1 overflow-hidden rounded-lg'
          >
            <Link href={getSingleItemHref(singleItem)} className='block'>
              <SingleItemCardDisplay singleItem={singleItem} />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
