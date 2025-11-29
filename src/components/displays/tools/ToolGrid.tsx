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
  const EditButtons2 = TOOL_NAV_ITEMS.filter((i) => i.id === 'trait-maker').map((i) => ({
    imageSrc: i.iconSrc,
    imageAlt: i.iconAlt,
    title: i.label,
    description: i.id === 'trait-maker' ? '编辑特性信息，导出代码片段提交给开发人员' : '',
    href: i.href,
    ariaLabel: i.id === 'trait-maker' ? '编辑特性信息，导出代码片段提交给开发人员' : '',
  }));

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

      <HomePageSection buttons={Buttons} />
      <HomePageSection buttons={Buttons2} />
      {isEditMode ? <HomePageSection title={'编辑工具'} buttons={EditButtons} /> : null}
      {isEditMode ? <HomePageSection buttons={EditButtons2} /> : null}

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
