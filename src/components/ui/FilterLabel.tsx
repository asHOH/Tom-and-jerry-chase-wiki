import React from 'react';
import clsx from 'clsx';

type FilterLabelProps = {
  id?: string;
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

const FilterLabel: React.FC<FilterLabelProps> = ({ id, full, short, className }) => {
  const shortLabel = deriveShortLabel(full, short);
  const accessibleLabel =
    typeof full === 'string' ? full : typeof shortLabel === 'string' ? shortLabel : undefined;

  return (
    <>
      {accessibleLabel ? (
        <span id={id} className='sr-only'>
          {accessibleLabel}
        </span>
      ) : null}
      <span className={clsx(baseClasses, 'hidden sm:inline', className)} aria-hidden='true'>
        {full}
      </span>
      <span className={clsx(baseClasses, 'sm:hidden', className)} aria-hidden='true'>
        {shortLabel}
      </span>
    </>
  );
};

export default FilterLabel;
