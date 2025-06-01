export const designTokens = {
  spacing: {
    xs: '8px',    // 2 units
    sm: '12px',   // 3 units
    md: '16px',   // 4 units
    lg: '24px',   // 6 units
    xl: '32px',   // 8 units
    // Compact spacing for tags
    xxs: '4px',   // 1 unit - for very compact padding
    compact: '6px' // 1.5 units - for compact tag spacing
  },
  colors: {
    faction: {
      // Base faction button colors
      background: '#e5e7eb',      // gray-200
      text: '#1f2937',            // gray-800
      textSecondary: '#6b7280',   // gray-500
      hover: '#2563eb',           // blue-600
      hoverText: '#ffffff',       // white
      border: 'transparent'
    },
      // Card rank colors
    rank: {
      S: {
        text: '#ea580c',      // orange-600
        background: '#fef3e2', // orange-75 (between orange-50 and orange-100)
        border: '#fdba74'      // orange-300
      },
      A: {
        text: '#9333ea',      // purple-600
        background: '#ede9fe', // purple-90 (lighter than purple-100)
        border: '#c4b5fd'      // purple-300
      },
      B: {
        text: '#2563eb',      // blue-600
        background: '#dbeafe', // blue-100
        border: '#93c5fd'      // blue-300
      },
      C: {
        text: '#16a34a',      // green-600
        background: '#dcfce7', // green-100
        border: '#86efac'      // green-300
      },
      default: {
        text: '#4b5563',      // gray-600
        background: '#f3f4f6', // gray-100
        border: '#d1d5db'      // gray-300
      }
    },
    
    // Card cost colors
    cost: {
      high: {
        text: '#dc2626',      // red-600
        background: '#fee2e2', // red-100
        border: '#fca5a5'      // red-300
      },      medium: {
        text: '#ea580c',      // orange-600
        background: '#fef3e2', // orange-75 (between orange-50 and orange-100)
        border: '#fdba74'      // orange-300
      },
      low: {
        text: '#ca8a04',      // yellow-600
        background: '#fef3c7', // yellow-100
        border: '#fde047'      // yellow-300
      },
      veryLow: {
        text: '#16a34a',      // green-600
        background: '#dcfce7', // green-100
        border: '#86efac'      // green-300
      }
    },
    
    // Positioning tag colors
    positioningTags: {
      // Cat tags
      attack: {
        text: '#dc2626',      // red-600
        background: '#fee2e2', // red-100
        border: '#fca5a5',     // red-300
        container: 'bg-gradient-to-r from-red-50 to-red-100 border border-red-200'
      },
      defense: {
        text: '#2563eb',      // blue-600
        background: '#dbeafe', // blue-100
        border: '#93c5fd',     // blue-300
        container: 'bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200'
      },
      chase: {
        text: '#ea580c',      // orange-600
        background: '#fed7aa', // orange-100
        border: '#fdba74',     // orange-300
        container: 'bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200'
      },
      speedrun: {
        text: '#16a34a',      // green-600
        background: '#dcfce7', // green-100
        border: '#86efac',     // green-300
        container: 'bg-gradient-to-r from-green-50 to-green-100 border border-green-200'
      },
      fight: {
        text: '#9333ea',      // purple-600
        background: '#e9d5ff', // purple-100
        border: '#c4b5fd',     // purple-300
        container: 'bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200'
      },
      lateGame: {
        text: '#4338ca',      // indigo-600
        background: '#e0e7ff', // indigo-100
        border: '#a5b4fc',     // indigo-300
        container: 'bg-gradient-to-r from-indigo-50 to-indigo-100 border border-indigo-200'
      },
      comeback: {
        text: '#ca8a04',      // yellow-600
        background: '#fef3c7', // yellow-100
        border: '#fde047',     // yellow-300
        container: 'bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200'
      },
      // Mouse tags
      cheese: {
        text: '#d97706',      // amber-600
        background: '#fef3c7', // amber-100
        border: '#fcd34d',     // amber-300
        container: 'bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200'
      },
      disrupt: {
        text: '#ec4899',      // pink-600
        background: '#fce7f3', // pink-100
        border: '#f9a8d4',     // pink-300
        container: 'bg-gradient-to-r from-pink-50 to-pink-100 border border-pink-200'
      },
      support: {
        text: '#0891b2',      // cyan-600
        background: '#cffafe', // cyan-100
        border: '#67e8f9',     // cyan-300
        container: 'bg-gradient-to-r from-cyan-50 to-cyan-100 border border-cyan-200'
      },
      rescue: {
        text: '#059669',      // emerald-600
        background: '#d1fae5', // emerald-100
        border: '#6ee7b7',     // emerald-300
        container: 'bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200'
      },
      breakthrough: {
        text: '#7c3aed',      // violet-600
        background: '#ede9fe', // violet-100
        border: '#c4b5fd',     // violet-300
        container: 'bg-gradient-to-r from-violet-50 to-violet-100 border border-violet-200'
      },
      wallBreak: {
        text: '#78716c',      // stone-600
        background: '#f5f5f4', // stone-100
        border: '#d6d3d1',     // stone-300
        container: 'bg-gradient-to-r from-stone-50 to-stone-100 border border-stone-200'
      },
      // Shared tags (mouse variant)
      lateGameMouse: {
        text: '#0d9488',      // teal-600
        background: '#ccfbf1', // teal-100
        border: '#5eead4',     // teal-300
        container: 'bg-gradient-to-r from-teal-50 to-teal-100 border border-teal-200'
      },
      // Minor tags
      minor: {
        text: '#4b5563',      // gray-600
        background: '#f3f4f6', // gray-100
        border: '#d1d5db',     // gray-300
        container: 'bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200'
      }
    },
    
    primary: {
      50: '#eff6ff',
      100: '#dbeafe', 
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8'
    },
    
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      500: '#6b7280',
      600: '#4b5563',
      800: '#1f2937',
      900: '#111827'
    }
  },

  typography: {
    fontSize: {
      xs: '0.75rem',     // 12px
      sm: '0.875rem',    // 14px
      base: '1rem',      // 16px
      lg: '1.125rem',    // 18px
      xl: '1.25rem',     // 20px
      '2xl': '1.5rem',   // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem'   // 36px
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    }
  },

  shadows: {
    card: '0 2px 6px rgba(0, 0, 0, 0.05)',
    cardHover: '0 4px 12px rgba(37, 99, 235, 0.2)',
    button: '0 1px 3px rgba(0, 0, 0, 0.1)',
    navigation: '0 2px 4px rgba(0, 0, 0, 0.1)'
  },
  radius: {
    none: '0',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
    // Compact radius for tags
    xs: '3px',    // Extra small for compact tags
    compact: '6px' // Between sm and md for modern look
  },

  zIndex: {
    base: 1,
    dropdown: 10,
    sticky: 20,
    modal: 30,
    navigation: 9999
  },

  transitions: {
    fast: '150ms ease',
    normal: '200ms ease',
    slow: '300ms ease',
    colors: 'background-color 200ms ease, color 200ms ease',
    transform: 'transform 200ms ease',
    all: 'all 200ms ease',
    hover: 'background-color 300ms ease, color 300ms ease, transform 300ms ease, box-shadow 300ms ease'
  }
} as const;

export const componentTokens = {
  factionButton: {
    base: {
      padding: '16px 24px',
      borderRadius: designTokens.radius.md,
      fontSize: designTokens.typography.fontSize.base,
      fontWeight: designTokens.typography.fontWeight.bold,
      transition: designTokens.transitions.hover,
      cursor: 'pointer',
      border: 'none',
      outline: 'none',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      gap: designTokens.spacing.xs,
      textAlign: 'center' as const,
      flex: 1,
      minWidth: '220px',
      backgroundColor: designTokens.colors.faction.background,
      color: designTokens.colors.faction.text,
      boxShadow: designTokens.shadows.card
    },
    
    content: {
      display: 'flex',
      alignItems: 'center',
      gap: designTokens.spacing.sm
    },
    
    emoji: {
      fontSize: designTokens.typography.fontSize['2xl']
    },
    
    title: {
      fontSize: designTokens.typography.fontSize['2xl'],
      fontWeight: designTokens.typography.fontWeight.bold
    },
    
    description: {
      fontSize: designTokens.typography.fontSize.sm,
      color: designTokens.colors.faction.textSecondary,
      marginTop: '4px'
    },
    
    hover: {
      backgroundColor: designTokens.colors.faction.hover,
      color: designTokens.colors.faction.hoverText,
      boxShadow: designTokens.shadows.cardHover,
      transform: 'translateY(-2px)'
    }
  },
    factionButtonContainer: {
    display: 'flex',
    flexDirection: 'row' as const,
    justifyContent: 'center',
    gap: designTokens.spacing.lg,
    width: '100%',
    maxWidth: '700px',
    margin: '0 auto'
  },

  // Card component tokens
  card: {
    base: {
      borderRadius: designTokens.radius.lg,
      boxShadow: designTokens.shadows.card,
      transition: designTokens.transitions.hover,
      cursor: 'pointer',
      border: 'none',
      outline: 'none'
    },
    content: {
      height: '16rem' // h-64 (256px)
    }
  },
  // Tag component tokens  
  tag: {
    base: {
      padding: `${designTokens.spacing.compact} ${designTokens.spacing.xs}`, // More compact: 6px 8px instead of 8px 12px
      borderRadius: designTokens.radius.compact, // More rounded: 6px instead of 4px
      fontWeight: designTokens.typography.fontWeight.medium,
      display: 'inline-block',
      border: '1px solid transparent' // Add subtle border for better definition
    },
    compact: {
      padding: `${designTokens.spacing.xxs} ${designTokens.spacing.compact}`, // Very compact: 4px 6px
      borderRadius: designTokens.radius.xs, // Smaller radius for tiny tags
      fontWeight: designTokens.typography.fontWeight.medium,
      display: 'inline-block',
      border: '1px solid transparent'
    }
  },

  // Image component tokens
  image: {
    dimensions: {
      CHARACTER_CARD: { width: 120, height: 120 },
      CARD_ITEM: { width: 140, height: 140 },
      CARD_DETAILS: { width: 220, height: 220 }
    },
    container: {
      height: '12rem', // h-48 (192px)
      borderRadius: `${designTokens.radius.lg} ${designTokens.radius.lg} 0 0`
    }
  },

  // Grid component tokens
  grid: {
    gap: designTokens.spacing.md,
    columns: {
      mobile: 2,
      tablet: 3,      desktop: 4,
      large: 5,
      extraLarge: 6
    }
  }
} as const;

export const createStyleFromTokens = (tokenPath: any): React.CSSProperties => {
  if (typeof tokenPath === 'object' && tokenPath !== null) {
    const styles: React.CSSProperties = {};
    
    for (const [key, value] of Object.entries(tokenPath)) {
      if (typeof value === 'string' || typeof value === 'number') {
        (styles as any)[key] = value;
      }
    }
    
    return styles;
  }
  
  return {};
};

// Card utility functions using design tokens
export const getCardRankColors = (rank: string, includeBorder: boolean = false) => {
  const rankKey = rank as keyof typeof designTokens.colors.rank;
  const colorScheme = designTokens.colors.rank[rankKey] || designTokens.colors.rank.default;
  
  return {
    color: colorScheme.text,
    backgroundColor: colorScheme.background,
    ...(includeBorder && { borderColor: colorScheme.border })
  };
};

export const getCardCostColors = (cost: number, includeBorder: boolean = false) => {
  let colorScheme;
  
  if (cost >= 6) {
    colorScheme = designTokens.colors.cost.high;
  } else if (cost >= 4) {
    colorScheme = designTokens.colors.cost.medium;
  } else if (cost >= 3) {
    colorScheme = designTokens.colors.cost.low;
  } else {
    colorScheme = designTokens.colors.cost.veryLow;
  }
  
  return {
    color: colorScheme.text,
    backgroundColor: colorScheme.background,
    ...(includeBorder && { borderColor: colorScheme.border })
  };
};

// Positioning tag utility functions
export const getPositioningTagColors = (tagName: string, isMinor: boolean = false, includeBorder: boolean = false, faction?: 'cat' | 'mouse') => {
  if (isMinor) {
    const colorScheme = designTokens.colors.positioningTags.minor;
    return {
      color: colorScheme.text,
      backgroundColor: colorScheme.background,
      ...(includeBorder && { borderColor: colorScheme.border })
    };
  }

  // Map Chinese tag names to design token keys
  const tagMapping: Record<string, keyof typeof designTokens.colors.positioningTags> = {
    '进攻': 'attack',
    '防守': 'defense',
    '追击': 'chase',
    '速通': 'speedrun',
    '打架': 'fight',
    '后期': faction === 'mouse' ? 'lateGameMouse' : 'lateGame',
    '翻盘': 'comeback',
    '奶酪': 'cheese',
    '干扰': 'disrupt',
    '辅助': 'support',
    '救援': 'rescue',
    '破局': 'breakthrough',
    '砸墙': 'wallBreak'
  };

  const tagKey = tagMapping[tagName];
  const colorScheme = tagKey ? designTokens.colors.positioningTags[tagKey] : designTokens.colors.positioningTags.minor;
  
  return {
    color: colorScheme.text,
    backgroundColor: colorScheme.background,
    ...(includeBorder && { borderColor: colorScheme.border })
  };
};

export const getPositioningTagContainerColor = (tagName: string, isMinor: boolean = false, faction?: 'cat' | 'mouse'): string => {
  if (isMinor) {
    return designTokens.colors.positioningTags.minor.container;
  }

  const tagMapping: Record<string, keyof typeof designTokens.colors.positioningTags> = {
    '进攻': 'attack',
    '防守': 'defense', 
    '追击': 'chase',
    '速通': 'speedrun',
    '打架': 'fight',
    '后期': faction === 'mouse' ? 'lateGameMouse' : 'lateGame',
    '翻盘': 'comeback',
    '奶酪': 'cheese',
    '干扰': 'disrupt',
    '辅助': 'support',
    '救援': 'rescue',
    '破局': 'breakthrough',
    '砸墙': 'wallBreak'
  };

  const tagKey = tagMapping[tagName];
  return tagKey ? designTokens.colors.positioningTags[tagKey].container : designTokens.colors.positioningTags.minor.container;
};

// Legacy compatibility functions (generate Tailwind classes for gradual migration)
export const getRankColor = (rank: string, includeBorder: boolean = false): string => {
  console.warn('getRankColor is deprecated. Use getCardRankColors from design-tokens.ts instead.');
  
  switch (rank) {
    case 'S':
      return `text-orange-600 bg-orange-100${includeBorder ? ' border-orange-300' : ''}`;
    case 'A':
      return `text-purple-600 bg-purple-100${includeBorder ? ' border-purple-300' : ''}`;
    case 'B':
      return `text-blue-600 bg-blue-100${includeBorder ? ' border-blue-300' : ''}`;
    case 'C':
      return `text-green-600 bg-green-100${includeBorder ? ' border-green-300' : ''}`;
    default:
      return `text-gray-600 bg-gray-100${includeBorder ? ' border-gray-300' : ''}`;
  }
};

export const getCostColor = (cost: number, includeBorder: boolean = false): string => {
  console.warn('getCostColor is deprecated. Use getCardCostColors from design-tokens.ts instead.');
    if (cost >= 6) return `text-red-600 bg-red-100${includeBorder ? ' border-red-300' : ''}`;
  if (cost >= 4) return `text-orange-600 bg-orange-100${includeBorder ? ' border-orange-300' : ''}`;
  if (cost >= 3) return `text-yellow-600 bg-yellow-100${includeBorder ? ' border-yellow-300' : ''}`;
  return `text-green-600 bg-green-100${includeBorder ? ' border-green-300' : ''}`;
};

// Legacy compatibility function for positioning tags (generates Tailwind classes)
export const getPositioningTagColor = (tagName: string, isMinor: boolean = false, includeBorder: boolean = false, faction?: 'cat' | 'mouse'): string => {
  console.warn('getPositioningTagColor is deprecated. Use getPositioningTagColors from design-tokens.ts instead.');
  
  if (isMinor) {
    return `text-gray-600 bg-gray-100${includeBorder ? ' border-gray-300' : ''}`;
  }

  // Map Chinese tag names to Tailwind classes
  const tagClassMapping: Record<string, string> = {
    '进攻': `text-red-600 bg-red-100${includeBorder ? ' border-red-300' : ''}`,
    '防守': `text-blue-600 bg-blue-100${includeBorder ? ' border-blue-300' : ''}`,
    '追击': `text-orange-600 bg-orange-100${includeBorder ? ' border-orange-300' : ''}`,
    '速通': `text-green-600 bg-green-100${includeBorder ? ' border-green-300' : ''}`,
    '打架': `text-purple-600 bg-purple-100${includeBorder ? ' border-purple-300' : ''}`,
    '后期': faction === 'mouse' 
      ? `text-teal-600 bg-teal-100${includeBorder ? ' border-teal-300' : ''}`
      : `text-indigo-600 bg-indigo-100${includeBorder ? ' border-indigo-300' : ''}`,
    '翻盘': `text-yellow-600 bg-yellow-100${includeBorder ? ' border-yellow-300' : ''}`,
    '奶酪': `text-amber-600 bg-amber-100${includeBorder ? ' border-amber-300' : ''}`,
    '干扰': `text-pink-600 bg-pink-100${includeBorder ? ' border-pink-300' : ''}`,
    '辅助': `text-cyan-600 bg-cyan-100${includeBorder ? ' border-cyan-300' : ''}`,
    '救援': `text-emerald-600 bg-emerald-100${includeBorder ? ' border-emerald-300' : ''}`,
    '破局': `text-violet-600 bg-violet-100${includeBorder ? ' border-violet-300' : ''}`,
    '砸墙': `text-stone-600 bg-stone-100${includeBorder ? ' border-stone-300' : ''}`
  };

  return tagClassMapping[tagName] || `text-gray-600 bg-gray-100${includeBorder ? ' border-gray-300' : ''}`;
};
