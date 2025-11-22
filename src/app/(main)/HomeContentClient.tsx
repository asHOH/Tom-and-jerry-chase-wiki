'use client';

import { useState, useRef } from 'react';
import { DisclaimerText } from '@/components/DisclaimerText';
import { VersionDisplay } from '@/components/VersionDisplay';
import NotificationTooltip from '@/components/ui/NotificationTooltip';
import FeedbackSection, { FeedbackSectionRef } from '@/components/ui/FeedbackSection';
import ChangeLogs, { ChangeLogsRef } from '@/components/ui/ChangeLogs';
import HomePageSection from '@/components/ui/HomePageSection';
import PageTitle from '@/components/ui/PageTitle';
import PageDescription from '@/components/ui/PageDescription';
import LoginDialog from '@/components/LoginDialog';
import { useMobile } from '@/hooks/useMediaQuery';
import { useUser } from '@/hooks/useUser';
import { useEditMode } from '@/context/EditModeContext';
import { NAV_ITEMS } from '@/constants/navigation';

type Props = { description: string };

export default function HomeContentClient({ description }: Props) {
  const { toggleEditMode, isEditMode } = useEditMode();
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
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
      setNotificationMessage('成功退出编辑模式');
      setShowLoginDialog(false);
    } else {
      setNotificationMessage('成功进入编辑模式，编辑模式下，修改只在本地保存');
      if (!nickname && !process.env.NEXT_PUBLIC_DISABLE_ARTICLES) setShowLoginDialog(true);
    }
    setShowNotification(true);
    toggleEditMode();
  };

  const characterButtons = NAV_ITEMS.filter((i) => i.id === 'cat' || i.id === 'mouse').map((i) => ({
    imageSrc: i.iconSrc,
    imageAlt: i.iconAlt,
    title: i.label,
    description: i.id === 'cat' ? '猫阵营角色列表' : '鼠阵营角色列表',
    href: i.href,
    ariaLabel: i.id === 'cat' ? '猫阵营角色列表' : '鼠阵营角色列表',
  }));

  const prepareButtons = NAV_ITEMS.filter((i) => i.id === 'cards' || i.id === 'special-skills').map(
    (i) => ({
      imageSrc: i.iconSrc,
      imageAlt: i.iconAlt,
      title: i.label,
      description: i.id === 'cards' ? '知识卡列表' : '特技列表',
      href: i.href,
      ariaLabel: i.id === 'cards' ? '知识卡列表' : '特技列表',
    })
  );

  const itemButtons = NAV_ITEMS.filter((i) => i.id === 'items' || i.id === 'entities').map((i) => ({
    imageSrc: i.iconSrc,
    imageAlt: i.iconAlt,
    title: i.label,
    description: i.id === 'items' ? '道具列表' : '衍生物列表',
    href: i.href,
    ariaLabel: i.id === 'items' ? '道具列表' : '衍生物列表',
  }));

  const cardButtons = NAV_ITEMS.filter(
    (i) => (!process.env.NEXT_PUBLIC_DISABLE_ARTICLES && i.id === 'articles') || i.id === 'buffs'
  ).map((i) => ({
    imageSrc: i.iconSrc,
    imageAlt: i.iconAlt,
    title: i.label,
    description: i.id === 'articles' ? '社区文章列表' : '状态效果列表',
    href: i.href,
    ariaLabel: i.id === 'articles' ? '社区文章列表' : '状态效果列表',
  }));

  const Buttons5 = NAV_ITEMS.filter((i) => i.id === 'mechanics' || i.id === 'tools').map((i) => ({
    imageSrc: i.iconSrc,
    imageAlt: i.iconAlt,
    title: i.label,
    description: i.id === 'mechanics' ? '局内机制列表' : '便捷工具栏',
    href: i.href,
    ariaLabel: i.id === 'mechanics' ? '局内机制列表' : '便捷工具栏',
  }));

  return (
    <div className='space-y-8'>
      <header className='text-center space-y-2'>
        <PageTitle>猫和老鼠手游wiki</PageTitle>
        <PageDescription>{description}</PageDescription>
      </header>

      <HomePageSection title='角色' buttons={characterButtons} />
      <HomePageSection title='更多内容' buttons={prepareButtons} />
      <HomePageSection buttons={itemButtons} />
      <HomePageSection buttons={cardButtons} />
      <HomePageSection buttons={Buttons5} />

      {/* Division line before 网站说明 */}
      <div className='mt-24 px-2 sm:px-4'>
        <div className='max-w-4xl mx-auto'>
          <div className='h-px bg-gray-300 dark:bg-gray-700 w-full'></div>
        </div>
      </div>

      <div className='mt-8 text-center px-2 sm:px-4' onDoubleClick={handleEditModeToggle}>
        <h2 className='text-3xl font-bold mb-2 py-2 dark:text-white'>网站说明</h2>
        <div className='max-w-2xl mx-auto text-gray-600 dark:text-gray-300 px-2 sm:px-4 py-3'>
          <DisclaimerText onFeedbackClick={() => feedbackSectionRef.current?.openFeedback()} />
        </div>
        <VersionDisplay />
        <div className='mt-6 flex flex-wrap justify-center gap-4'>
          <FeedbackSection ref={feedbackSectionRef} />
          <ChangeLogs ref={changeLogsRef} />
        </div>
      </div>

      <NotificationTooltip
        message={notificationMessage}
        show={showNotification}
        onHide={() => setShowNotification(false)}
        type={isEditMode ? 'success' : 'info'}
        duration={isEditMode ? 3000 : 4000}
      />

      {isEditMode && showLoginDialog && (
        <LoginDialog onClose={() => setShowLoginDialog(false)} isMobile={isMobile} />
      )}
    </div>
  );
}
