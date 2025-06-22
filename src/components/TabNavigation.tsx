import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import SearchBar from './ui/SearchBar'; // Import SearchBar
import { useAppContext } from '@/context/AppContext';

type Tab = {
  id: string;
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

  const tooltipStyle = {
    position: 'absolute' as const,
    bottom: isMobile ? '-40px' : '-35px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#1f2937',
    color: 'white',
    padding: '6px 10px',
    borderRadius: '4px',
    fontSize: '12px',
    whiteSpace: 'nowrap' as const,
    zIndex: 50000,
    opacity: 0,
    pointerEvents: 'none' as const,
    transition: 'opacity 0.2s',
    minWidth: 'max-content',
    maxWidth: '200px',
    textAlign: 'center' as const,
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
  };

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
          <button
            onClick={() => handleTabChange('')}
            style={buttonStyle(activeTab === null)}
            title={isMobile ? '首页' : undefined}
            onTouchStart={(e) => {
              if (isMobile) {
                const tooltip = e.currentTarget.querySelector('.tooltip');
                if (tooltip) {
                  (tooltip as HTMLElement).style.opacity = '1';
                  setTimeout(() => {
                    (tooltip as HTMLElement).style.opacity = '0';
                  }, 2000);
                }
              }
            }}
            onMouseEnter={(e) => {
              if (!isMobile) {
                const tooltip = e.currentTarget.querySelector('.tooltip');
                if (tooltip) (tooltip as HTMLElement).style.opacity = '1';
              }
            }}
            onMouseLeave={(e) => {
              if (!isMobile) {
                const tooltip = e.currentTarget.querySelector('.tooltip');
                if (tooltip) (tooltip as HTMLElement).style.opacity = '0';
              }
            }}
          >
            {!isMobile && '首页'}
            {isMobile && (
              <>
                🏠
                <div className='tooltip' style={tooltipStyle}>
                  首页
                </div>
              </>
            )}
          </button>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              style={buttonStyle(activeTab === tab.id)}
              title={isMobile ? tab.name : undefined}
              onTouchStart={(e) => {
                if (isMobile) {
                  const tooltip = e.currentTarget.querySelector('.tooltip');
                  if (tooltip) {
                    (tooltip as HTMLElement).style.opacity = '1';
                    setTimeout(() => {
                      (tooltip as HTMLElement).style.opacity = '0';
                    }, 2000);
                  }
                }
              }}
              onMouseEnter={(e) => {
                if (!isMobile) {
                  const tooltip = e.currentTarget.querySelector('.tooltip');
                  if (tooltip) (tooltip as HTMLElement).style.opacity = '1';
                }
              }}
              onMouseLeave={(e) => {
                if (!isMobile) {
                  const tooltip = e.currentTarget.querySelector('.tooltip');
                  if (tooltip) (tooltip as HTMLElement).style.opacity = '0';
                }
              }}
            >
              <Image
                src={tab.imageSrc}
                alt={tab.imageAlt}
                width={isMobile ? 30 : 35}
                height={isMobile ? 24 : 28}
                className='object-contain'
                style={{ width: 'auto', height: isMobile ? '24px' : '28px' }}
              />
              {!isMobile && <span>{tab.name}</span>}
              {isMobile && (
                <div className='tooltip' style={tooltipStyle}>
                  {tab.name}
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Right-aligned detailed/simple view toggle button and SearchBar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <SearchBar isMobile={isMobile} /> {/* Add SearchBar here */}
          {showDetailToggle && (
            <button
              onClick={toggleDetailedView}
              className='whitespace-nowrap'
              style={{
                padding: isMobile ? '8px' : '8px 16px',
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
              title={isMobile ? (isDetailedView ? '简明描述' : '详细描述') : undefined}
            >
              {isMobile ? (isDetailedView ? '简' : '详') : isDetailedView ? '简明描述' : '详细描述'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
