'use client';

import { useRef } from 'react';
import { TOOL_NAV_ITEMS } from '@/constants/navigation';
import { useEditMode } from '@/context/EditModeContext';

import { useMobile } from '@/hooks/useMediaQuery';
import ChangeLogs, { ChangeLogsRef } from '@/components/ui/ChangeLogs';
import FeedbackSection, { FeedbackSectionRef } from '@/components/ui/FeedbackSection';
import HomePageSection from '@/components/ui/HomePageSection';
import PageDescription from '@/components/ui/PageDescription';
import PageTitle from '@/components/ui/PageTitle';

interface CharacterRankingGridProps {
  description?: string;
}

export default function CharacterRankingGrid({ description }: CharacterRankingGridProps) {
  const isMobile = useMobile();
  const { isEditMode } = useEditMode();
  const feedbackSectionRef = useRef<FeedbackSectionRef>(null);
  const changeLogsRef = useRef<ChangeLogsRef>(null);

  const SECTIONS = [
    {
      items: ['ranks', 'special-skill-advices'],
    },
    {
      items: ['traitCollection'],
    },
    {
      title: '编辑工具',
      condition: isEditMode,
      items: ['item-maker', 'entity-maker'],
    },
    {
      condition: isEditMode,
      items: ['trait-maker'],
    },
  ];

  const getSectionButtons = (items: string[]) => {
    return items
      .map((id) => {
        const navItem = TOOL_NAV_ITEMS.find((n) => n.id === id);
        if (!navItem) return null;
        return {
          imageSrc: navItem.iconSrc,
          imageAlt: navItem.iconAlt,
          title: navItem.label,
          description: navItem.description,
          href: navItem.href,
          ariaLabel: navItem.description,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  };

  return (
    <div
      className={
        isMobile
          ? 'mx-auto max-w-3xl space-y-2 p-2 dark:text-slate-200'
          : 'mx-auto max-w-6xl space-y-8 p-6 dark:text-slate-200'
      }
    >
      <header
        className={isMobile ? 'mb-4 space-y-2 px-2 text-center' : 'mb-8 space-y-4 px-4 text-center'}
      >
        <PageTitle>工具栏</PageTitle>
        <PageDescription>{description}</PageDescription>
      </header>

      {SECTIONS.map((section, index) => {
        if (section.condition === false) return null;
        const buttons = getSectionButtons(section.items);
        if (buttons.length === 0) return null;
        const props = section.title ? { title: section.title } : {};
        return <HomePageSection key={index} {...props} buttons={buttons} />;
      })}

      <div className='mt-24 px-2 sm:px-4'>
        <div className='mx-auto max-w-4xl'>
          <div className='h-px w-full bg-gray-300 dark:bg-gray-700'></div>
        </div>
      </div>
      <div className='mt-8 px-2 text-center sm:px-4'>
        <h2 className='mb-10 py-3 text-3xl font-bold text-gray-800 dark:text-white'>网站工具</h2>
        <div className='mt-6 flex flex-wrap justify-center gap-4'>
          <FeedbackSection ref={feedbackSectionRef} />
          <ChangeLogs ref={changeLogsRef} />
        </div>
      </div>

      {/*<div className='border-t-2 border-b-2 border-dashed border-gray-300 dark:border-gray-700'>
        {children}
      </div>*/}
    </div>
  );
}
