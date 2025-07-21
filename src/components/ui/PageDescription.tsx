import React from 'react';

type PageDescriptionProps = {
  children: React.ReactNode;
};

const PageDescription: React.FC<PageDescriptionProps> = ({ children }) => {
  return (
    <p className='text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto px-4 py-2'>
      {children}
    </p>
  );
};

export default PageDescription;
