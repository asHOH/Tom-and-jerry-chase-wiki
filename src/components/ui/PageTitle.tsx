import React from 'react';

type PageTitleProps = {
  children: React.ReactNode;
};

const PageTitle: React.FC<PageTitleProps> = ({ children }) => {
  return (
    <h1
      className='py-3 text-4xl leading-tight font-bold tracking-tight text-blue-600 md:text-5xl dark:text-blue-400'
      style={{ fontFamily: 'var(--font-display-stack)' }}
    >
      {children}
    </h1>
  );
};

export default PageTitle;
