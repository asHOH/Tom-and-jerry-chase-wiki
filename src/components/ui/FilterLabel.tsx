import React from 'react';
import clsx from 'clsx';

type FilterLabelProps = {
  full: React.ReactNode;
  short?: React.ReactNode;
  className?: string;
};

const baseClasses = 'text-lg font-medium text-gray-700 dark:text-gray-300';

const deriveShortLabel = (full: React.ReactNode, provided?: React.ReactNode) => {
  if (provided !== undefined) return provided;
  if (typeof full !== 'string') return full;

  const trimmed = full.trim();
  const withoutFilterWord = trimmed.replace('筛选', '').trim();

  return withoutFilterWord.length > 0 ? withoutFilterWord : trimmed;
};

const FilterLabel: React.FC<FilterLabelProps> = ({ full, short, className }) => {
  const shortLabel = deriveShortLabel(full, short);

  return (
    <>
      <span className={clsx(baseClasses, 'hidden sm:inline', className)}>{full}</span>
      <span className={clsx(baseClasses, 'sm:hidden', className)}>{shortLabel}</span>
    </>
  );
};

export default FilterLabel;
