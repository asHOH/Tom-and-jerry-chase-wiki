import React from 'react';
import { componentTokens, createStyleFromTokens } from '@/lib/design-tokens';

export interface FactionButtonGroupProps {
  children: React.ReactNode;
  className?: string;
}

export function FactionButtonGroup({ children, className = '' }: FactionButtonGroupProps) {
  const containerStyle = createStyleFromTokens(componentTokens.factionButtonContainer);
  
  return (
    <div 
      style={containerStyle}
      className={`flex-row sm:flex-row ${className}`}
    >
      {children}
    </div>
  );
}

export default React.memo(FactionButtonGroup);
