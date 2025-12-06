'use client';

import { useRef, useState } from 'react';
import { NAV_ITEMS } from '@/constants/navigation';
import { useEditMode } from '@/context/EditModeContext';
import { useToast } from '@/context/ToastContext';

import { useMobile } from '@/hooks/useMediaQuery';
import { useUser } from '@/hooks/useUser';
import ChangeLogs, { ChangeLogsRef } from '@/components/ui/ChangeLogs';
import FeedbackSection, { FeedbackSectionRef } from '@/components/ui/FeedbackSection';
import HomePageSection from '@/components/ui/HomePageSection';
import PageDescription from '@/components/ui/PageDescription';
import PageTitle from '@/components/ui/PageTitle';
import { DisclaimerText } from '@/components/DisclaimerText';
import LoginDialog from '@/components/LoginDialog';
import { VersionDisplay } from '@/components/VersionDisplay';

type Props = { description: string };

export default function HomeContentClient({ description }: Props) {
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
      if (!nickname && !process.env.NEXT_PUBLIC_DISABLE_ARTICLES) setShowLoginDialog(true);
    }
    toggleEditMode();
  };

  type SectionItem = {
    id: string;
    description: string;
    condition?: boolean;
  };

  const SECTIONS: { title?: string; items: SectionItem[] }[] = [
    {
      title: '角色',
      items: [
        { id: 'mouse', description: '鼠阵营角色列表' },
        { id: 'cat', description: '猫阵营角色列表' },
      ],
    },
    {
      title: '更多内容',
      items: [
        { id: 'cards', description: '知识卡列表' },
        { id: 'special-skills', description: '特技列表' },
      ],
    },
    {
      items: [
        { id: 'items', description: '道具列表' },
        { id: 'entities', description: '衍生物列表' },
      ],
    },
    {
      items: [
        { id: 'buffs', description: '状态效果列表' },
        {
          id: 'articles',
          description: '社区文章列表',
          condition: !process.env.NEXT_PUBLIC_DISABLE_ARTICLES,
        },
        { id: 'mechanics', description: '局内机制列表' },
        { id: 'tools', description: '便捷工具栏' },
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
          description: item.description,
          href: navItem.href,
          ariaLabel: item.description,
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
      </div>

      {isEditMode && showLoginDialog && (
        <LoginDialog onClose={() => setShowLoginDialog(false)} isMobile={isMobile} />
      )}
    </div>
  );
}
