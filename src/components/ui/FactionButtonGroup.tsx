import React from 'react';
import clsx from 'clsx';

interface FactionButtonGroupProps {
  children: React.ReactNode;
  className?: string;
}

function FactionButtonGroup({ children, className = '' }: FactionButtonGroupProps) {
  return (
    <div
      className={clsx(
        'mx-auto flex w-full max-w-[700px] flex-row flex-wrap justify-center gap-3 md:gap-4',
        className
      )}
    >
      {children}
    </div>
  );
}

export default React.memo(FactionButtonGroup);
