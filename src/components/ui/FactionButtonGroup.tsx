import React from 'react';
import clsx from 'clsx';

export interface FactionButtonGroupProps {
  children: React.ReactNode;
  className?: string;
}

export function FactionButtonGroup({ children, className = '' }: FactionButtonGroupProps) {
  return (
    <div
      className={clsx(
        'flex flex-row justify-center gap-3 md:gap-4 w-full max-w-[700px] mx-auto',
        className
      )}
    >
      {children}
    </div>
  );
}

export default React.memo(FactionButtonGroup);
