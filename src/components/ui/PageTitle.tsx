import React from 'react';

type PageTitleProps = {
  children: React.ReactNode;
};

const PageTitle: React.FC<PageTitleProps> = ({ children }) => {
  return <h1 className='text-4xl font-bold text-blue-600 dark:text-blue-400 py-3'>{children}</h1>;
};

export default PageTitle;
