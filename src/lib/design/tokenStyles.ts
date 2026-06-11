import type { CSSProperties } from 'react';

export const createStyleFromTokens = (tokenPath: Record<string, unknown>): CSSProperties => {
  if (typeof tokenPath === 'object' && tokenPath !== null) {
    const styles: CSSProperties = {};

    for (const [key, value] of Object.entries(tokenPath)) {
      if (typeof value === 'string' || typeof value === 'number') {
        (styles as Record<string, string | number>)[key] = value;
      }
    }

    return styles;
  }

  return {};
};
