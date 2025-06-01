/**
 * FactionButtonGroup Component
 * 
 * A container component for grouping faction buttons with consistent layout.
 * Eliminates container inline styles and provides responsive design.
 */

import React from 'react';
import { componentTokens, createStyleFromTokens } from '@/lib/design-tokens';

export interface FactionButtonGroupProps {
  /** Child faction buttons */
  children: React.ReactNode;
  /** Optional CSS class name for additional styling */
  className?: string;
}

/**
 * FactionButtonGroup - Container for faction buttons with responsive layout
 */
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
