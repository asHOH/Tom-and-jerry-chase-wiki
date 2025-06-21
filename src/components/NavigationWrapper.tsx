import React from 'react';
import TabNavigation from './TabNavigation';

type NavigationWrapperProps = {
  children: React.ReactNode;
  activeTab: string | null;
  onTabChange: (tabId: string) => void;
  isDetailedView?: boolean;
  onToggleDetailedView?: () => void;
  showDetailToggle?: boolean;
  onSelectCharacter: (characterId: string) => void;
  onSelectCard: (cardId: string) => void;
};

export default function NavigationWrapper({
  children,
  activeTab,
  onTabChange,
  isDetailedView = false,
  onToggleDetailedView = () => {},
  showDetailToggle = false,
  onSelectCharacter,
  onSelectCard,
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
        onSelectCharacter={onSelectCharacter}
        onSelectCard={onSelectCard}
      />

      {/* Content with padding for the fixed navbar */}
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '24px',
          paddingTop: '90px', // Adjust based on your navbar height
        }}
      >
        {children}
      </div>
    </div>
  );
}
