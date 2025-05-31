/**
 * Centralized text formatting and parsing utilities
 * Consolidates all text formatting functions to eliminate duplication
 */

import React from 'react';

/**
 * Parse and render text with highlighted parts for markdown-style **bold** formatting
 * Replaces renderDescriptionWithHighlights and similar functions
 * @param text - Text to parse and highlight
 * @returns JSX elements with highlighted portions styled
 */
export const renderTextWithHighlights = (text: string): (string | React.ReactElement)[] => {
  const parts: (string | React.ReactElement)[] = [];
  let lastIndex = 0;
  const highlightPattern = /\*\*(.*?)\*\*/g;
  let match;

  while ((match = highlightPattern.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    // Add the underlined text with styling
    parts.push(
      React.createElement('span', {
        key: match.index,
        className: 'underline decoration-2 underline-offset-2'
      }, match[1])
    );

    lastIndex = highlightPattern.lastIndex;
  }

  // Add remaining text after the last match
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
};

/**
 * Enhanced text formatting with both bold patterns and numerical highlighting
 * Consolidates formatTextWithMarkdown functionality
 * @param text - Text to format
 * @returns JSX element with formatting applied
 */
export const formatTextWithEnhancedMarkdown = (text: string): React.ReactElement => {
  const parts: (string | React.ReactElement)[] = [];
  const combinedPattern = /(\*\*(.*?)\*\*)|(\d+(?:\.\d+)?%?(?:\s*(?:秒|米|点))?)/g;
  let lastIndex = 0;
  let match;

  while ((match = combinedPattern.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[1]) {
      // Bold text pattern **text**
      parts.push(
        React.createElement('span', {
          key: match.index,
          className: 'underline decoration-2 underline-offset-2'
        }, match[2])
      );
    } else if (match[3]) {
      // Numerical pattern
      parts.push(
        React.createElement('span', {
          key: match.index,
          className: 'underline decoration-2 underline-offset-2'
        }, match[3])
      );
    }

    lastIndex = combinedPattern.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return React.createElement(React.Fragment, {}, ...parts);
};

/**
 * Check if text contains specific patterns
 * @param text - Text to check
 * @param pattern - Pattern to look for ('markdown', 'highlights', 'itemkey')
 * @returns boolean indicating if pattern exists
 */
export const hasTextPattern = (text: string, pattern: 'markdown' | 'highlights' | 'itemkey'): boolean => {
  switch (pattern) {
    case 'markdown':
    case 'highlights':
      return /\*\*(.*?)\*\*/.test(text);
    case 'itemkey':
      return text.includes('道具键*');
    default:
      return false;
  }
};

/**
 * Extract action verbs from item key patterns
 * Helper for tooltip content generation
 * @param text - Text containing item key patterns
 * @returns Array of extracted action verbs
 */
export const extractItemKeyActions = (text: string): string[] => {
  const actions: string[] = [];
  const itemKeyPattern = /道具键\*([^（]*)/g;
  let match;

  while ((match = itemKeyPattern.exec(text)) !== null) {
    const actionVerb = match[1].trim();
    if (actionVerb) {
      actions.push(actionVerb);
    }
  }

  return actions;
};

/**
 * Normalize text for consistent processing
 * @param text - Text to normalize
 * @returns Normalized text
 */
export const normalizeText = (text: string): string => {
  return text.trim().replace(/\s+/g, ' ');
};
