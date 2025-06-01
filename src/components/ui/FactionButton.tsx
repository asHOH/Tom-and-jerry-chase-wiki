/**
 * FactionButton Component
 * 
 * A reusable button component for faction selection that eliminates inline styles
 * and provides consistent styling through design tokens.
 */

import React from 'react';
import { componentTokens, createStyleFromTokens } from '@/lib/design-tokens';

export interface FactionButtonProps {
  /** Emoji icon to display */
  emoji: string;
  /** Main title text */
  title: string;
  /** Description text shown below title */
  description: string;
  /** Click handler */
  onClick: () => void;
  /** Accessibility label for screen readers */
  ariaLabel: string;
  /** Optional CSS class name for additional styling */
  className?: string;
}

/**
 * FactionButton - Replaces 50+ lines of inline styles with clean component
 * 
 * Features:
 * - Type-safe props with proper validation
 * - Consistent styling through design tokens
 * - Maintains all accessibility features
 * - Optimized hover effects via CSS
 */
export function FactionButton({ 
  emoji, 
  title, 
  description, 
  onClick, 
  ariaLabel, 
  className = '' 
}: FactionButtonProps) {
  const baseStyle = createStyleFromTokens(componentTokens.factionButton.base);
  const contentStyle = createStyleFromTokens(componentTokens.factionButton.content);
  const emojiStyle = createStyleFromTokens(componentTokens.factionButton.emoji);
  const titleStyle = createStyleFromTokens(componentTokens.factionButton.title);
  const descriptionStyle = createStyleFromTokens(componentTokens.factionButton.description);

  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={`faction-button ${className}`}
      style={baseStyle}
    >
      <div style={contentStyle}>
        <span style={emojiStyle}>{emoji}</span>
        <span style={titleStyle}>{title}</span>
      </div>
      <div style={descriptionStyle}>
        {description}
      </div>
    </button>
  );
}

// Memoize the component for performance optimization
export default React.memo(FactionButton);
