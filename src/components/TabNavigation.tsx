import { useState } from 'react';
import Link from 'next/link';

type Tab = {
  id: string;
  name: string;
  emoji: string;
};

const tabs: Tab[] = [
  { id: 'cat', name: '猫阵营', emoji: '🐱' },
  { id: 'mouse', name: '鼠阵营', emoji: '🐭' },
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
    <div className="fixed top-0 left-0 right-0 bg-white z-50 shadow-md w-full">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex space-x-2">
          <button
            onClick={() => {
              // Reset the active tab to null to go back to the home page
              onTabChange('');
            }}
            className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-800 transition-colors"
          >
            首页
          </button>

          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-4 py-2 rounded-md transition-colors flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              }`}
            >
              <span>{tab.emoji}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </div>

        {/* Global detailed/simple view toggle button */}
        {showDetailToggle && (
          <button
            onClick={onToggleDetailedView}
            className="px-4 py-2 rounded-md bg-blue-100 hover:bg-blue-200 text-blue-700 transition-colors ml-auto"
          >
            {isDetailedView ? '简明描述' : '详细描述'}
          </button>
        )}
      </div>
    </div>
  );
}
