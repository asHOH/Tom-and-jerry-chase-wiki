'use client';

import { useMobile } from '@/hooks/useMediaQuery';
import PageTitle from '@/components/ui/PageTitle';
import PageDescription from '@/components/ui/PageDescription';
import { TOOL_NAV_ITEMS } from '@/constants/navigation';
import HomePageSection from '@/components/ui/HomePageSection';
import { useEditMode } from '@/context/EditModeContext';
import FeedbackSection, { FeedbackSectionRef } from '@/components/ui/FeedbackSection';
import ChangeLogs, { ChangeLogsRef } from '@/components/ui/ChangeLogs';
import { useRef } from 'react';

interface CharacterRankingGridProps {
  description?: string;
}

export default function CharacterRankingGrid({ description }: CharacterRankingGridProps) {
  const isMobile = useMobile();
  const { isEditMode } = useEditMode();
  const feedbackSectionRef = useRef<FeedbackSectionRef>(null);
  const changeLogsRef = useRef<ChangeLogsRef>(null);

  const Buttons = TOOL_NAV_ITEMS.filter(
    (i) => i.id === 'ranks' || i.id === 'special-skill-advices'
  ).map((i) => ({
    imageSrc: i.iconSrc,
    imageAlt: i.iconAlt,
    title: i.label,
    description: i.id === 'ranks' ? '排列并查看角色属性值' : '便捷查看各特技推荐信息',
    href: i.href,
    ariaLabel: i.id === 'ranks' ? '排列并查看角色属性值' : '便捷查看各特技推荐信息',
  }));
  const Buttons2 = TOOL_NAV_ITEMS.filter((i) => i.id === 'traitCollection').map((i) => ({
    imageSrc: i.iconSrc,
    imageAlt: i.iconAlt,
    title: i.label,
    description: i.id === 'traitCollection' ? '便捷查看已收录的全部特性' : '',
    href: i.href,
    ariaLabel: i.id === 'traitCollection' ? '便捷查看已收录的全部特性' : '',
  }));
  const EditButtons = TOOL_NAV_ITEMS.filter(
    (i) => i.id === 'item-maker' || i.id === 'entity-maker'
  ).map((i) => ({
    imageSrc: i.iconSrc,
    imageAlt: i.iconAlt,
    title: i.label,
    description:
      i.id === 'item-maker'
        ? '编辑道具信息，导出代码片段提交给开发人员'
        : '编辑衍生物信息，导出代码片段提交给开发人员',
    href: i.href,
    ariaLabel:
      i.id === 'item-maker'
        ? '编辑道具信息，导出代码片段提交给开发人员'
        : '编辑衍生物信息，导出代码片段提交给开发人员',
  }));

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
        <PageTitle>工具栏</PageTitle>
        <PageDescription>{description}</PageDescription>
      </header>

      <HomePageSection buttons={Buttons} />
      <HomePageSection buttons={Buttons2} />
      {isEditMode ? <HomePageSection title={'编辑工具'} buttons={EditButtons} /> : null}

      <div className='mt-24 px-2 sm:px-4'>
        <div className='max-w-4xl mx-auto'>
          <div className='h-px bg-gray-300 dark:bg-gray-700 w-full'></div>
        </div>
      </div>
      <div className='mt-8 text-center px-2 sm:px-4'>
        <h2 className='text-3xl font-bold mb-10 py-3 text-gray-800 dark:text-white'>网站工具</h2>
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
