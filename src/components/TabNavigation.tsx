import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import SearchBar from './ui/SearchBar'; // Import SearchBar
import Tooltip from './ui/Tooltip'; // Import Tooltip
import { TabName, useAppContext } from '@/context/AppContext';

type Tab = {
  id: TabName;
  name: string;
  imageSrc: string;
  imageAlt: string;
};

const tabs: Tab[] = [
  { id: 'cat', name: '猫阵营', imageSrc: '/images/icons/cat faction.png', imageAlt: '猫阵营图标' },
  {
    id: 'mouse',
    name: '鼠阵营',
    imageSrc: '/images/icons/mouse faction.png',
    imageAlt: '鼠阵营图标',
  },
  {
    id: 'catCards',
    name: '猫方知识卡',
    imageSrc: '/images/icons/cat knowledge card.png',
    imageAlt: '猫方知识卡图标',
  },
  {
    id: 'mouseCards',
    name: '鼠方知识卡',
    imageSrc: '/images/icons/mouse knowledge card.png',
    imageAlt: '鼠方知识卡图标',
  },
];

type TabNavigationProps = {
  showDetailToggle?: boolean;
};

export default function TabNavigation({ showDetailToggle = false }: TabNavigationProps) {
  const [isMobile, setIsMobile] = useState(false);
  const { activeTab, handleTabChange, isDetailedView, toggleDetailedView } = useAppContext();

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const buttonStyle = (isActive: boolean) => ({
    padding: isMobile ? '8px' : '8px 16px',
    borderRadius: '6px',
    backgroundColor: isActive ? '#2563eb' : '#e5e7eb',
    color: isActive ? 'white' : '#1f2937',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: isMobile ? '0' : '8px',
    position: 'relative' as const,
    minWidth: isMobile ? '44px' : 'auto',
    justifyContent: 'center',
  });

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        zIndex: 9999,
        width: '100%',
        padding: '10px 0',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 16px',
        }}
      >
        {/* Left-aligned navigation buttons */}
        <div
          style={{
            display: 'flex',
            gap: isMobile ? '8px' : '12px',
            overflowX: isMobile ? 'auto' : 'visible',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            overflowY: 'visible',
            position: 'relative',
          }}
        >
          <Tooltip content='首页' className='border-none' disabled={!isMobile} delay={800}>
            <button
              type='button'
              onClick={() => handleTabChange('')}
              style={buttonStyle(activeTab === null)}
            >
              {!isMobile && '首页'}
              {isMobile && '🏠'}
            </button>
          </Tooltip>
          {tabs.map((tab) => (
            <Tooltip
              key={tab.id}
              content={tab.name}
              className='border-none'
              disabled={!isMobile}
              delay={800}
            >
              <button
                type='button'
                onClick={() => handleTabChange(tab.id)}
                style={buttonStyle(activeTab === tab.id)}
              >
                <Image
                  src={tab.imageSrc}
                  alt={tab.imageAlt}
                  width={0}
                  height={0}
                  className='object-contain'
                  style={{ height: isMobile ? '24px' : '28px', width: 'auto' }}
                />
                {!isMobile && <span>{tab.name}</span>}
              </button>
            </Tooltip>
          ))}
        </div>

        {/* Right-aligned detailed/simple view toggle button and SearchBar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <SearchBar isMobile={isMobile} />
          {showDetailToggle && (
            <Tooltip
              content={isDetailedView ? '简明描述' : '详细描述'}
              className='border-none'
              disabled={!isMobile}
              delay={800}
            >
              <button
                type='button'
                onClick={toggleDetailedView}
                className='whitespace-nowrap'
                style={{
                  padding: isMobile ? '10px' : '10px 16px',
                  borderRadius: '6px',
                  backgroundColor: isDetailedView ? '#dbeafe' : '#fef3e2',
                  color: isDetailedView ? '#1d4ed8' : '#ea580c',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  fontSize: isMobile ? '14px' : '16px',
                  minWidth: isMobile ? '44px' : 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isMobile
                  ? isDetailedView
                    ? '简'
                    : '详'
                  : isDetailedView
                    ? '简明描述'
                    : '详细描述'}
              </button>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
}
