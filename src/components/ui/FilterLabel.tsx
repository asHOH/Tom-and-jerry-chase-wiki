import React from 'react';
import clsx from 'clsx';

type FilterLabelProps = {
  children: React.ReactNode;
  displayMode: 'inline' | 'block';
};

const FilterLabel: React.FC<FilterLabelProps> = ({ children, displayMode }) => {
  const classes = clsx('text-lg font-medium text-gray-700 dark:text-gray-300', {
    'hidden sm:inline': displayMode === 'inline',
    'sm:hidden': displayMode === 'block',
  });

  return <span className={classes}>{children}</span>;
};

export default FilterLabel;
