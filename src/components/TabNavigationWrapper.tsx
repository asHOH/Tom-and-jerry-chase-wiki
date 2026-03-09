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
      <div className='mx-auto max-w-300 p-6 pt-[calc(var(--nav-height)+20px)]'>{children}</div>
    </div>
  );
}
