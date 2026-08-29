import React from 'react';

import TabNavigation from './TabNavigation';

type NavigationWrapperProps = {
  children: React.ReactNode;
  showDetailToggle?: boolean;
};

export default function TabNavigationWrapper({
  children,
  showDetailToggle = false,
}: NavigationWrapperProps) {
  return (
    <div className='min-h-screen'>
      {/* Fixed navigation bar */}
      <TabNavigation showDetailToggle={showDetailToggle} />

      {/* Content with padding for the fixed navbar */}
      <div className='app-content-shell mx-auto w-full max-w-7xl px-4 pb-6 sm:px-6 lg:px-8'>
        {children}
      </div>
    </div>
  );
}
