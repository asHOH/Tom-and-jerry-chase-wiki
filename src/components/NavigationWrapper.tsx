import React from 'react';
import TabNavigation from './TabNavigation';

type NavigationWrapperProps = {
  children: React.ReactNode;
  activeTab: string | null;
  onTabChange: (tabId: string) => void;
  isDetailedView?: boolean;
  onToggleDetailedView?: () => void;
  showDetailToggle?: boolean;
};

export default function NavigationWrapper({
  children,
  activeTab,
  onTabChange,
  isDetailedView = false,
  onToggleDetailedView = () => {},
  showDetailToggle = false
}: NavigationWrapperProps) {
  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Fixed navigation bar */}
      <TabNavigation
        activeTab={activeTab}
        onTabChange={onTabChange}
        isDetailedView={isDetailedView}
        onToggleDetailedView={onToggleDetailedView}
        showDetailToggle={showDetailToggle}
      />

      {/* Content with padding for the fixed navbar */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '16px',
        paddingTop: '80px' // Adjust based on your navbar height
      }}>
        {children}
      </div>
    </div>
  );
}
