import React from 'react';
import Image from 'next/image';

type Tab = {
  id: string;
  name: string;
  imageSrc: string;
  imageAlt: string;
};

const tabs: Tab[] = [
  { id: 'cat', name: '猫阵营', imageSrc: '/images/icons/cat faction.png', imageAlt: '猫阵营图标' },
  { id: 'mouse', name: '鼠阵营', imageSrc: '/images/icons/mouse faction.png', imageAlt: '鼠阵营图标' },
  { id: 'catCards', name: '猫方知识卡', imageSrc: '/images/icons/cat knowledge card.png', imageAlt: '猫方知识卡图标' },
  { id: 'mouseCards', name: '鼠方知识卡', imageSrc: '/images/icons/mouse knowledge card.png', imageAlt: '鼠方知识卡图标' },
];

type TabNavigationProps = {
  activeTab: string | null;
  onTabChange: (tabId: string) => void;
  isDetailedView?: boolean;
  onToggleDetailedView?: () => void;
  showDetailToggle?: boolean;
};

export default function TabNavigation({
  activeTab,
  onTabChange,
  isDetailedView = false,
  onToggleDetailedView = () => {},
  showDetailToggle = false
}: TabNavigationProps) {
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
        padding: '10px 0'
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 16px'
        }}
      >
        {/* Left-aligned navigation buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => onTabChange('')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              backgroundColor: activeTab === null ? '#2563eb' : '#e5e7eb',
              color: activeTab === null ? 'white' : '#1f2937',
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            首页
          </button>
            {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                backgroundColor: activeTab === tab.id ? '#2563eb' : '#e5e7eb',
                color: activeTab === tab.id ? 'white' : '#1f2937',
                border: 'none',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Image
                src={tab.imageSrc}
                alt={tab.imageAlt}
                width={35}
                height={28}
                className="object-contain"
              />
              <span>{tab.name}</span>
            </button>
          ))}
        </div>

        {/* Right-aligned detailed/simple view toggle button */}
        <div>
          {showDetailToggle && (
            <button
              onClick={onToggleDetailedView}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                backgroundColor: isDetailedView ? '#dbeafe' : '#fef3e2',
                color: isDetailedView ? '#1d4ed8' : '#ea580c',
                border: 'none',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
            >
              {isDetailedView ? '简明描述' : '详细描述'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
