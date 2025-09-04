'use client';

import { useState, useRef } from 'react';
import TabNavigationWrapper from '@/components/TabNavigationWrapper';
import { DisclaimerText } from '@/components/DisclaimerText';
import { VersionDisplay } from '@/components/VersionDisplay';
import NotificationTooltip from '@/components/ui/NotificationTooltip';
import FeedbackSection, { FeedbackSectionRef } from '@/components/ui/FeedbackSection';
import { AppProvider } from '@/context/AppContext';
import { EditModeProvider, useEditMode } from '@/context/EditModeContext';
import HomePageSection from '@/components/ui/HomePageSection';
import PageTitle from '@/components/ui/PageTitle';
import PageDescription from '../components/ui/PageDescription';

export default function Home() {
  return (
    <AppProvider>
      <EditModeProvider>
        <HomeContent />
      </EditModeProvider>
    </AppProvider>
  );
}

function HomeContent() {
  const { toggleEditMode, isEditMode } = useEditMode();
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const feedbackSectionRef = useRef<FeedbackSectionRef>(null);

  const handleEditModeToggle = () => {
    if (feedbackSectionRef.current?.isOpen?.()) {
      return; // Do nothing if feedback modal is open
    }
    if (isEditMode) {
      setNotificationMessage('成功退出编辑模式');
    } else {
      setNotificationMessage('成功进入编辑模式，编辑模式下，修改只在本地保存');
    }
    setShowNotification(true);
    toggleEditMode();
  };

  const characterButtons = [
    {
      imageSrc: '/images/icons/cat faction.png',
      imageAlt: '猫阵营图标',
      title: '猫阵营',
      description: '猫阵营角色列表',
      href: '/factions/cat',
      ariaLabel: '猫阵营角色列表',
    },
    {
      imageSrc: '/images/icons/mouse faction.png',
      imageAlt: '鼠阵营图标',
      title: '鼠阵营',
      description: '鼠阵营角色列表',
      href: '/factions/mouse',
      ariaLabel: '鼠阵营角色列表',
    },
  ];

  const cardButtons = [
    {
      imageSrc: '/images/icons/cat knowledge card.png',
      imageAlt: '知识卡图标',
      title: '知识卡',
      description: '知识卡列表',
      href: '/cards',
      ariaLabel: '知识卡列表',
    },
    {
      imageSrc: '/images/mouseSpecialSkills/%E5%BA%94%E6%80%A5%E6%B2%BB%E7%96%97.png',
      imageAlt: '特技图标',
      title: '特技',
      description: '特技列表',
      href: '/special-skills',
      ariaLabel: '特技列表',
    },
    {
      imageSrc: '/images/icons/item.png',
      imageAlt: '道具图标',
      title: '道具',
      description: '道具列表',
      href: '/items',
      ariaLabel: '道具列表',
    },
    // {
    //   imageSrc: '/images/icons/cat faction.png',
    //   imageAlt: '排行榜图标',
    //   title: '排行榜',
    //   description: '角色属性排行榜',
    //   href: '/ranks',
    //   ariaLabel: '角色属性排行榜',
    // },
    {
      imageSrc: '/images/icons/entity.png',
      imageAlt: '衍生物图标',
      title: '衍生物',
      description: '衍生物列表',
      href: '/entities',
      ariaLabel: '衍生物列表',
    },
  ];

  return (
    <TabNavigationWrapper showDetailToggle={false}>
      <div className='space-y-8'>
        <header className='text-center space-y-4'>
          <PageTitle>猫和老鼠手游wiki</PageTitle>
          <PageDescription>查询角色技能和知识卡效果</PageDescription>
        </header>

        <HomePageSection title='角色' buttons={characterButtons} />
        <HomePageSection title='更多内容' buttons={cardButtons} />

        {/* Division line before 网站说明 */}
        <div className='mt-24 mb-8 px-2 sm:px-4'>
          <div className='max-w-4xl mx-auto'>
            <div className='h-px bg-gray-300 dark:bg-gray-700 w-full'></div>
          </div>
        </div>

        <div className='mt-8 text-center px-2 sm:px-4' onDoubleClick={handleEditModeToggle}>
          <h2 className='text-3xl font-bold mb-6 py-2 dark:text-white'>网站说明</h2>
          <p className='max-w-2xl mx-auto text-gray-600 dark:text-gray-300 px-2 sm:px-4 py-3'>
            <DisclaimerText onFeedbackClick={() => feedbackSectionRef.current?.openFeedback()} />
          </p>
          <VersionDisplay />
          <FeedbackSection ref={feedbackSectionRef} />
        </div>
      </div>

      <NotificationTooltip
        message={notificationMessage}
        show={showNotification}
        onHide={() => setShowNotification(false)}
        type={isEditMode ? 'success' : 'info'}
        duration={isEditMode ? 3000 : 4000}
      />
    </TabNavigationWrapper>
  );
}
