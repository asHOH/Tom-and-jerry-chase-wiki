'use client';

import React from 'react';

type PageDescriptionProps = {
  children: React.ReactNode;
};

const PageDescription: React.FC<PageDescriptionProps> = ({ children }) => {
  return (
    <p
      className='mx-auto max-w-3xl px-2 py-1 text-lg leading-8 text-gray-700 transition-colors md:px-4 md:py-2 md:text-xl dark:text-gray-200'
      style={{ fontFamily: 'var(--font-sans-stack)' }}
    >
      {children}
    </p>
  );
};

export default PageDescription;
