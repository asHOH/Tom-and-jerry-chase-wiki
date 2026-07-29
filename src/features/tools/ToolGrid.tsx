'use client';

import { useRef } from 'react';

import { TOOL_NAV_ITEMS } from '@/constants/navigation';
import ChangeLogs, { ChangeLogsRef } from '@/components/ui/ChangeLogs';
import FeedbackSection, { FeedbackSectionRef } from '@/components/ui/FeedbackSection';
import HomePageSection from '@/components/ui/NavSection';
import PageHeader from '@/components/ui/PageHeader';
import PageShell from '@/components/ui/PageShell';

interface CharacterRankingGridProps {
  description?: string;
}

export default function CharacterRankingGrid({ description }: CharacterRankingGridProps) {
  const feedbackSectionRef = useRef<FeedbackSectionRef>(null);
  const changeLogsRef = useRef<ChangeLogsRef>(null);

  const SECTIONS = [
    {
      title: '使用指南',
      items: ['usage-use', 'usage-edit'],
    },
    {
      title: '查询工具',
      items: [
        'ranks',
        'win-rates',
        'special-skill-advices',
        'traitCollection',
        'recent-changes',
        'random',
      ],
    },
    {
      title: '小游戏',
      items: ['guess-character', 'stat-showdown', 'playstyle-quiz'],
    },
    {
      title: '建设中界面',
      items: ['fixtures', 'achievements'],
    },
    /*{
      title: '编辑工具',
      condition: isEditMode,
      items: ['item-maker', 'entity-maker', 'trait-maker'],
    },*/
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
    <PageShell width='maximum' className='space-y-2 md:space-y-8 dark:text-slate-200'>
      <PageHeader title='工具栏' description={description} className='mb-4 md:mb-8' />

      {SECTIONS.map((section, index) => {
        /*if (section.condition === false) return null;*/
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
    </PageShell>
  );
}
