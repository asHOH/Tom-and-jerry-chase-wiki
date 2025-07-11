import React from 'react';

export interface FactionButtonGroupProps {
  children: React.ReactNode;
  className?: string;
}

export function FactionButtonGroup({ children, className = '' }: FactionButtonGroupProps) {
  return (
    <div className={`flex flex-row sm:flex-row justify-center gap-4 w-full max-w-[700px] mx-auto ${className}`}>
      {children}
    </div>
  );
}

export default React.memo(FactionButtonGroup);
