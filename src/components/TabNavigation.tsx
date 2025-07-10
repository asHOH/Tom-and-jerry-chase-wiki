'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import SearchBar from './ui/SearchBar'; // Import SearchBar
import Tooltip from './ui/Tooltip'; // Import Tooltip
import { useAppContext } from '@/context/AppContext';
import { useNavigation } from '@/lib/useNavigation';

type Tab = {
  id: string;
  name: string;
  imageSrc: string;
  imageAlt: string;
  path: string;
};

const tabs: Tab[] = [
  {
    id: 'cat',
    name: '猫阵营',
    imageSrc: '/images/icons/cat faction.png',
    imageAlt: '猫阵营图标',
    path: '/factions/cat',
  },
  {
    id: 'mouse',
    name: '鼠阵营',
    imageSrc: '/images/icons/mouse faction.png',
    imageAlt: '鼠阵营图标',
    path: '/factions/mouse',
  },
  {
    id: 'catCards',
    name: '猫方知识卡',
    imageSrc: '/images/icons/cat knowledge card.png',
    imageAlt: '猫方知识卡图标',
    path: '/cards/cat',
  },
  {
    id: 'mouseCards',
    name: '鼠方知识卡',
    imageSrc: '/images/icons/mouse knowledge card.png',
    imageAlt: '鼠方知识卡图标',
    path: '/cards/mouse',
  },
];

type TabNavigationProps = {
  showDetailToggle?: boolean;
};

export default function TabNavigation({ showDetailToggle = false }: TabNavigationProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  const pathname = usePathname();
  const { isDetailedView, toggleDetailedView } = useAppContext();
  const { navigateWithOfflineCheck } = useNavigation();

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Reset navigation state when pathname changes
  useEffect(() => {
    if (navigatingTo && pathname) {
      // Check if the current pathname matches where we were navigating to
      if (pathname === navigatingTo || pathname.startsWith(navigatingTo)) {
        setNavigatingTo(null);
      }
    }
  }, [pathname, navigatingTo]);

  const handleNavigation = async (targetPath: string) => {
    setNavigatingTo(targetPath);
    try {
      const navigationSucceeded = await navigateWithOfflineCheck(targetPath);
      // If navigation failed (blocked), reset the navigating state
      if (!navigationSucceeded) {
        setNavigatingTo(null);
      } else {
        // Reset after a short delay to allow navigation to complete
        setTimeout(() => setNavigatingTo(null), 2000);
      }
    } catch (error) {
      console.error('Navigation error:', error);
      setNavigatingTo(null);
    }
  };

  const isTabActive = (tabPath: string) => {
    return pathname?.startsWith(tabPath) || false;
  };

  const isHomeActive = () => {
    return pathname === '/';
  };

  const baseButtonStyle = {
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: isMobile ? '40px' : '44px',
    minWidth: isMobile ? '40px' : 'auto',
    position: 'relative' as const,
    gap: isMobile ? '0' : '8px',
    fontSize: isMobile ? '14px' : '16px',
  };

  const tabButtonStyle = (isActive: boolean, isNavigating: boolean = false) => ({
    ...baseButtonStyle,
    padding: isMobile ? '8px' : '8px 16px',
    backgroundColor: isNavigating ? '#9ca3af' : isActive ? '#2563eb' : '#e5e7eb',
    color: isNavigating ? '#ffffff' : isActive ? 'white' : '#1f2937',
    opacity: isNavigating ? 0.8 : 1,
    cursor: isNavigating ? 'not-allowed' : 'pointer',
  });

  const toggleButtonStyle = (isDetailedView: boolean) => ({
    ...baseButtonStyle,
    padding: isMobile ? '10px' : '10px 16px',
    backgroundColor: isDetailedView ? '#dbeafe' : '#fef3e2',
    color: isDetailedView ? '#1d4ed8' : '#ea580c',
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
            gap: isMobile ? '10px' : '12px',
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
              onClick={() => handleNavigation('/')}
              className='whitespace-nowrap'
              style={tabButtonStyle(isHomeActive(), navigatingTo === '/')}
              disabled={navigatingTo !== null}
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
                onClick={() => handleNavigation(tab.path)}
                className='whitespace-nowrap'
                style={tabButtonStyle(isTabActive(tab.path), navigatingTo === tab.path)}
                disabled={navigatingTo !== null}
              >
                <Image
                  src={tab.imageSrc}
                  alt={tab.imageAlt}
                  width={64}
                  height={64}
                  className='object-contain'
                  style={{ height: isMobile ? '24px' : '28px', width: 'auto' }}
                />
                {!isMobile && <span>{tab.name}</span>}
              </button>
            </Tooltip>
          ))}
        </div>

        {/* Right-aligned detailed/simple view toggle button and SearchBar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '12px' }}>
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
                style={toggleButtonStyle(isDetailedView)}
              >
                {isMobile ? (isDetailedView ? '简' : '详') : isDetailedView ? '简明' : '详细'}
              </button>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
}
