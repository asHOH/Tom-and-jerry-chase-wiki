'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import NavigationWrapper from '@/components/NavigationWrapper';
import { DisclaimerText } from '@/components/DisclaimerText';
import { VersionDisplay } from '@/components/VersionDisplay';
import FactionButton from '@/components/ui/FactionButton';
import FactionButtonGroup from '@/components/ui/FactionButtonGroup';
import NotificationTooltip from '@/components/ui/NotificationTooltip';
import { AppProvider } from '@/context/AppContext';
import { EditModeProvider, useEditMode } from '@/context/EditModeContext';

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
  const router = useRouter();
  const { toggleEditMode, isEditMode } = useEditMode();
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  const handleEditModeToggle = () => {
    if (isEditMode) {
      setNotificationMessage('成功退出编辑模式');
    } else {
      setNotificationMessage('成功进入编辑模式，编辑模式下，修改只在本地保存');
    }
    setShowNotification(true);
    toggleEditMode();
  };

  return (
    <NavigationWrapper showDetailToggle={false}>
      <div className='space-y-8'>
        <header className='text-center space-y-4 px-4'>
          <h1 className='text-4xl font-bold text-blue-600 py-3'>猫和老鼠手游wiki</h1>
          <p className='text-xl text-gray-600 px-4 py-2'>查询角色技能和知识卡效果</p>
        </header>

        <div className='flex flex-col items-center mt-16 px-4'>
          <h2 className='text-3xl font-bold mb-10 py-3 text-gray-800'>角色</h2>
          <FactionButtonGroup>
            <FactionButton
              imageSrc='/images/icons/cat faction.png'
              imageAlt='猫阵营图标'
              title='猫阵营'
              description='猫阵营角色列表'
              onClick={() => router.push('/factions/cat')}
              ariaLabel='猫阵营角色列表'
              priority
            />
            <FactionButton
              imageSrc='/images/icons/mouse faction.png'
              imageAlt='鼠阵营图标'
              title='鼠阵营'
              description='鼠阵营角色列表'
              onClick={() => router.push('/factions/mouse')}
              ariaLabel='鼠阵营角色列表'
              priority
            />
          </FactionButtonGroup>
        </div>

        <div className='flex flex-col items-center mt-16 px-4'>
          <h2 className='text-3xl font-bold mb-10 py-3 text-gray-800'>知识卡</h2>
          <FactionButtonGroup>
            <FactionButton
              imageSrc='/images/icons/cat knowledge card.png'
              imageAlt='猫方知识卡图标'
              title='猫方知识卡'
              description='猫方知识卡列表'
              onClick={() => router.push('/cards/cat')}
              ariaLabel='猫方知识卡列表'
              priority
            />
            <FactionButton
              imageSrc='/images/icons/mouse knowledge card.png'
              imageAlt='鼠方知识卡图标'
              title='鼠方知识卡'
              description='鼠方知识卡列表'
              onClick={() => router.push('/cards/mouse')}
              ariaLabel='鼠方知识卡列表'
              priority
            />
          </FactionButtonGroup>
        </div>

        {/* Division line before 网站说明 */}
        <div className='mt-24 mb-8 px-4'>
          <div className='max-w-4xl mx-auto'>
            <div className='h-px bg-gray-300 w-full'></div>
          </div>
        </div>

        <div className='mt-8 text-center px-4' onDoubleClick={handleEditModeToggle}>
          <h2 className='text-3xl font-bold mb-6 py-2'>网站说明</h2>
          <p className='max-w-2xl mx-auto text-gray-600 px-4 py-3'>
            <DisclaimerText />
          </p>
          {process.env.NEXT_PUBLIC_BUILD_TIME && (
            <p className='text-sm text-gray-500 mt-4'>
              最近更新：{process.env.NEXT_PUBLIC_BUILD_TIME}
            </p>
          )}
          <VersionDisplay />
        </div>
      </div>

      <NotificationTooltip
        message={notificationMessage}
        show={showNotification}
        onHide={() => setShowNotification(false)}
        type={isEditMode ? 'success' : 'info'}
        duration={isEditMode ? 3000 : 4000}
      />
    </NavigationWrapper>
  );
}
