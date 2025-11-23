import React from 'react';

import { useMobile } from '@/hooks/useMediaQuery';

type PageDescriptionProps = {
  children: React.ReactNode;
};

const PageDescription: React.FC<PageDescriptionProps> = ({ children }) => {
  const isMobile = useMobile();
  return (
    <p
      className={`${isMobile ? 'px-2 py-1 text-lg' : 'px-4 py-2 text-xl'} mx-auto max-w-3xl text-gray-600 dark:text-gray-300`}
    >
      {children}
    </p>
  );
};

export default PageDescription;
