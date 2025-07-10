import React from 'react';
import TabNavigation from './TabNavigation';
import { EditModeIndicator } from './EditModeIndicator';

type NavigationWrapperProps = {
  children: React.ReactNode;
  showDetailToggle?: boolean;
};

export default function TabNavigationWrapper({
  children,
  showDetailToggle = false,
}: NavigationWrapperProps) {
  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Edit mode indicator */}
      <EditModeIndicator />

      {/* Fixed navigation bar */}
      <TabNavigation showDetailToggle={showDetailToggle} />

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
