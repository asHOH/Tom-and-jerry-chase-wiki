import { useMobile } from '@/hooks/useMediaQuery';
import React from 'react';

type PageDescriptionProps = {
  children: React.ReactNode;
};

const PageDescription: React.FC<PageDescriptionProps> = ({ children }) => {
  const isMobile = useMobile();
  return (
    <p
      className={`${isMobile ? 'text-lg px-2 py-1' : 'text-xl px-4 py-2'} text-gray-600 dark:text-gray-300 max-w-3xl mx-auto`}
    >
      {children}
    </p>
  );
};

export default PageDescription;
