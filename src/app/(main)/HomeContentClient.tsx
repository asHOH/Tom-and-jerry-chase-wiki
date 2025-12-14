'use client';

import { useRef, useState } from 'react';

import { useMobile } from '@/hooks/useMediaQuery';
import { useUser } from '@/hooks/useUser';
import { useEditMode } from '@/context/EditModeContext';
import { useToast } from '@/context/ToastContext';
import { NAV_ITEMS } from '@/constants/navigation';
import ChangeLogs, { ChangeLogsRef } from '@/components/ui/ChangeLogs';
import FeedbackSection, { FeedbackSectionRef } from '@/components/ui/FeedbackSection';
import HomePageSection from '@/components/ui/HomePageSection';
import OfficialSitesDisplay from '@/components/ui/OfficialSitesDisplay';
import PageDescription from '@/components/ui/PageDescription';
import PageTitle from '@/components/ui/PageTitle';
import { DisclaimerText } from '@/components/DisclaimerText';
import LoginDialog from '@/components/LoginDialog';
import { VersionDisplay } from '@/components/VersionDisplay';

type Props = { description: string; hasServiceKey: boolean };

export default function HomeContentClient({ description, hasServiceKey }: Props) {
  const { toggleEditMode, isEditMode } = useEditMode();
  const { success, info } = useToast();
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const feedbackSectionRef = useRef<FeedbackSectionRef>(null);
  const changeLogsRef = useRef<ChangeLogsRef>(null);
  const { nickname } = useUser();
  const isMobile = useMobile();

  const handleEditModeToggle = () => {
    if (feedbackSectionRef.current?.isOpen?.() || changeLogsRef.current?.isOpen?.()) {
      return; // Do nothing if feedback or changelog modal is open
    }
    if (isEditMode) {
      success('成功退出编辑模式', 3000);
      setShowLoginDialog(false);
    } else {
      info('成功进入编辑模式，编辑模式下，修改只在本地保存', 4000);
      if (!nickname && !process.env.NEXT_PUBLIC_DISABLE_ARTICLES && hasServiceKey)
        setShowLoginDialog(true);
    }
    toggleEditMode();
  };

  type SectionItem = {
    id: string;
    condition?: boolean;
  };

  const SECTIONS: { title?: string; items: SectionItem[] }[] = [
    {
      title: '角色',
      items: [{ id: 'mouse' }, { id: 'cat' }],
    },
    {
      title: '备战',
      items: [{ id: 'cards' }, { id: 'special-skills' }],
    },
    {
      title: '物品',
      items: [{ id: 'items' }, { id: 'entities' }],
    },
    {
      title: '资料',
      items: [
        { id: 'buffs' },
        {
          id: 'articles',
          condition:
            !process.env.NEXT_PUBLIC_DISABLE_ARTICLES &&
            !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        },
        { id: 'mechanics' },
        { id: 'tools' },
      ],
    },
  ];

  const getSectionButtons = (items: SectionItem[]) => {
    return items
      .filter((item) => item.condition !== false)
      .map((item) => {
        const navItem = NAV_ITEMS.find((n) => n.id === item.id);
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
    <div className='space-y-8'>
      <header className='space-y-2 text-center'>
        <PageTitle>猫和老鼠手游wiki</PageTitle>
        <PageDescription>{description}</PageDescription>
      </header>

      {SECTIONS.map((section, index) => {
        const buttons = getSectionButtons(section.items);
        if (buttons.length === 0) return null;
        const props = section.title ? { title: section.title } : {};
        return <HomePageSection key={index} {...props} buttons={buttons} />;
      })}

      {/* Division line before 网站说明 */}
      <div className='mt-24 px-2 sm:px-4'>
        <div className='mx-auto max-w-4xl'>
          <div className='h-px w-full bg-gray-300 dark:bg-gray-700'></div>
        </div>
      </div>

      <div className='mt-8 px-2 text-center sm:px-4' onDoubleClick={handleEditModeToggle}>
        <h2 className='mb-2 py-2 text-3xl font-bold dark:text-white'>网站说明</h2>
        <div className='mx-auto max-w-2xl px-2 py-3 text-gray-600 sm:px-4 dark:text-gray-300'>
          <DisclaimerText onFeedbackClick={() => feedbackSectionRef.current?.openFeedback()} />
        </div>
        <VersionDisplay />
        <div className='mt-6 flex flex-wrap justify-center gap-4'>
          <FeedbackSection ref={feedbackSectionRef} />
          <ChangeLogs ref={changeLogsRef} />
        </div>

        <div className='mt-12 px-2 sm:px-4'>
          <div className='mx-auto max-w-4xl'>
            <div className='h-px w-full bg-gray-300 dark:bg-gray-700'></div>
          </div>
        </div>

        <div className='mt-8'>
          <h2 className='mb-6 text-2xl font-bold dark:text-white'>站点列表</h2>
          <OfficialSitesDisplay />
        </div>
      </div>

      {isEditMode && showLoginDialog && (
        <LoginDialog onClose={() => setShowLoginDialog(false)} isMobile={isMobile} />
      )}
    </div>
  );
}
