import type { FactionId } from '@/data/types';

export const designTokens = {
  spacing: {
    xxxxxxs: '0.1875rem', // 3px
    xxxxxs: '0.25rem', // 4px (1 unit)
    xxxxs: '0.3125rem', // 5px
    xxxs: '0.375rem', // 6px
    xxs: '0.4375rem', // 7px
    xs: '0.5rem', // 8px
    sm: '0.75rem', // 12px
    md: '1rem', // 16px
    lg: '1.5rem', // 24px
    xl: '2rem', // 32px
  },
  colors: {
    faction: {
      // Base faction button colors
      background: '#e5e7eb', // gray-200
      text: '#1f2937', // gray-800
      textSecondary: '#6b7280', // gray-500
      hover: '#2563eb', // blue-600
      hoverText: '#ffffff', // white
      border: 'transparent',
      dark: {
        background: '#000000', // black
        text: '#e5e7eb', // gray-200
        textSecondary: '#9ca3af', // gray-400
        hover: '#1f2937', // gray-800
        hoverText: '#ffffff', // white
        border: 'transparent',
      },
    },
    // Centralized faction filter palettes (used for faction filter buttons)
    factions: {
      cat: {
        light: { background: '#fef9c3', text: '#b45309' }, // yellow-100 bg, yellow-800 text
        dark: { background: '#fbbf24', text: '#000000' }, // yellow-400 bg, black text
      },
      mouse: {
        light: { background: '#e0f2fe', text: '#0369a1' }, // sky-100 bg, sky-800 text
        dark: { background: '#38bdf8', text: '#000000' }, // sky-400 bg, black text
      },
    },

    // Skill type colors
    skillTypes: {
      passive: {
        text: '#4b5563', // gray-600
        background: '#f9fafb', // gray-50
        border: '#9ca3af', // gray-400
        container: 'bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-300',
        dark: {
          text: '#9ca3af', // gray-400
          background: '#1f2937', // gray-800
          border: '#4b5563', // gray-600
          container: 'bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700',
        },
      },
      active: {
        text: '#2563eb', // blue-600
        background: '#eff6ff', // blue-50
        border: '#3b82f6', // blue-500
        container: 'bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-300',
        dark: {
          text: '#60a5fa', // blue-400
          background: '#1e3a8a', // blue-900
          border: '#3b82f6', // blue-500
          container: 'bg-gradient-to-r from-blue-900 to-blue-950 border border-blue-800',
        },
      },
      weapon1: {
        text: '#059669', // emerald-600
        background: '#ecfdf5', // emerald-50
        border: '#10b981', // emerald-500
        container: 'bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-300',
        dark: {
          text: '#34d399', // emerald-400
          background: '#064e3b', // emerald-900
          border: '#059669', // emerald-600
          container: 'bg-gradient-to-r from-emerald-900 to-emerald-950 border border-emerald-800',
        },
      },
      weapon2: {
        text: '#7c3aed', // violet-600
        background: '#f5f3ff', // violet-50
        border: '#8b5cf6', // violet-500
        container: 'bg-gradient-to-r from-violet-50 to-violet-100 border border-violet-300',
        dark: {
          text: '#a78bfa', // violet-400
          background: '#4c1d95', // violet-900
          border: '#7c3aed', // violet-600
          container: 'bg-gradient-to-r from-violet-900 to-violet-950 border border-violet-800',
        },
      },
    },

    // Skill level colors
    skillLevels: {
      level1: {
        text: '#2563eb', // blue-600
        background: '#eff6ff', // blue-50
        border: '#3b82f6', // blue-500
        container: 'bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-300',
        dark: {
          text: '#60a5fa', // blue-400
          background: '#1e3a8a', // blue-900
          border: '#3b82f6', // blue-500
          container: 'bg-gradient-to-r from-blue-900 to-blue-950 border border-blue-800',
        },
      },
      level2: {
        text: '#d97706', // amber-600
        background: '#fffbeb', // amber-50
        border: '#f59e0b', // amber-500
        container: 'bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-300',
        dark: {
          text: '#fbbf24', // amber-400
          background: '#78350f', // amber-900
          border: '#d97706', // amber-600
          container: 'bg-gradient-to-r from-amber-900 to-amber-950 border border-amber-800',
        },
      },
      level3: {
        text: '#dc2626', // red-600
        background: '#fef2f2', // red-50
        border: '#ef4444', // red-500
        container: 'bg-gradient-to-r from-red-50 to-red-100 border border-red-300',
        dark: {
          text: '#f87171', // red-400
          background: '#7f1d1d', // red-900
          border: '#dc2626', // red-600
          container: 'bg-gradient-to-r from-red-900 to-red-950 border border-red-800',
        },
      },
    },

    // Card rank colors
    rank: {
      S: {
        text: '#ea580c', // orange-600
        background: '#fef3e2', // orange-75 (between orange-50 and orange-100)
        border: '#fdba74', // orange-300
        dark: {
          text: '#fdba74', // orange-300
          background: '#7c2d12', // orange-900
          border: '#ea580c', // orange-600
        },
      },
      A: {
        text: '#9333ea', // purple-600
        background: '#ede9fe', // purple-90 (lighter than purple-100)
        border: '#c4b5fd', // purple-300
        dark: {
          text: '#c4b5fd', // purple-300
          background: '#581c87', // purple-900
          border: '#9333ea', // purple-600
        },
      },
      B: {
        text: '#2563eb', // blue-600
        background: '#dbeafe', // blue-100
        border: '#93c5fd', // blue-300
        dark: {
          text: '#93c5fd', // blue-300
          background: '#1e3a8a', // blue-900
          border: '#2563eb', // blue-600
        },
      },
      C: {
        text: '#16a34a', // green-600
        background: '#dcfce7', // green-100
        border: '#86efac', // green-300
        dark: {
          text: '#86efac', // green-300
          background: '#065f46', // green-900
          border: '#16a34a', // green-600
        },
      },
      default: {
        text: '#4b5563', // gray-600
        background: '#f3f4f6', // gray-100
        border: '#d1d5db', // gray-300
        dark: {
          text: '#9ca3af', // gray-400
          background: '#1f2937', // gray-800
          border: '#4b5563', // gray-600
        },
      },
    },

    // Card cost colors
    cost: {
      high: {
        text: '#dc2626', // red-600
        background: '#fee2e2', // red-100
        border: '#fca5a5', // red-300
        dark: {
          text: '#fca5a5', // red-300
          background: '#7f1d1d', // red-900
          border: '#dc2626', // red-600
        },
      },
      medium: {
        text: '#ea580c', // orange-600
        background: '#fee5d3', // orange-85
        border: '#fdba74', // orange-300
        dark: {
          text: '#fcd34d', // amber-300
          background: '#92400e', // amber-800
          border: '#ea580c', // orange-600
        },
      },
      low: {
        text: '#ca8a04', // yellow-600
        background: '#fef3c7', // yellow-100
        border: '#fde047', // yellow-300
        dark: {
          text: '#fde047', // yellow-300
          background: '#854d0e', // yellow-800
          border: '#ca8a04', // yellow-600
        },
      },
      veryLow: {
        text: '#16a34a', // green-600
        background: '#dcfce7', // green-100
        border: '#86efac', // green-300
        dark: {
          text: '#86efac', // green-300
          background: '#065f46', // green-900
          border: '#16a34a', // green-600
        },
      },
    },

    // Positioning tag colors
    positioningTags: {
      // Cat tags
      attack: {
        text: '#dc2626', // red-600
        background: '#fee2e2', // red-100
        border: '#fca5a5', // red-300
        container: 'bg-gradient-to-r from-red-50 to-red-100 border border-red-200',
        dark: {
          text: '#f87171', // red-400
          background: '#7f1d1d', // red-900
          border: '#dc2626', // red-600
          container: 'bg-gradient-to-r from-red-900 to-red-950 border border-red-800',
        },
      },
      defense: {
        text: '#2563eb', // blue-600
        background: '#dbeafe', // blue-100
        border: '#93c5fd', // blue-300
        container: 'bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200',
        dark: {
          text: '#60a5fa', // blue-400
          background: '#1e3a8a', // blue-900
          border: '#2563eb', // blue-600
          container: 'bg-gradient-to-r from-blue-900 to-blue-950 border border-blue-800',
        },
      },
      chase: {
        text: '#9a3412', // orange-800 (deeper reddish brown)
        background: '#fee5d3', // orange-175 equivalent (lighter background)
        border: '#ea580c', // orange-600 (reddish brown border)
        container: 'bg-gradient-to-r from-orange-100 to-orange-200 border border-orange-300',
        dark: {
          text: '#fdbf74', // orange-300
          background: '#7c2d12', // orange-900
          border: '#ea580c', // orange-600
          container: 'bg-gradient-to-r from-orange-900 to-orange-950 border border-orange-800',
        },
      },
      speedrun: {
        text: '#16a34a', // green-600
        background: '#dcfce7', // green-100
        border: '#86efac', // green-300
        container: 'bg-gradient-to-r from-green-50 to-green-100 border border-green-200',
        dark: {
          text: '#86efac', // green-300
          background: '#065f46', // green-900
          border: '#16a34a', // green-600
          container: 'bg-gradient-to-r from-green-900 to-green-950 border border-green-800',
        },
      },
      fight: {
        text: '#9333ea', // purple-600
        background: '#e9d5ff', // purple-100
        border: '#c4b5fd', // purple-300
        container: 'bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200',
        dark: {
          text: '#c4b5fd', // purple-300
          background: '#581c87', // purple-900
          border: '#9333ea', // purple-600
          container: 'bg-gradient-to-r from-purple-900 to-purple-950 border border-purple-800',
        },
      },
      lateGame: {
        text: '#4338ca', // indigo-600
        background: '#e0e7ff', // indigo-100
        border: '#a5b4fc', // indigo-300
        container: 'bg-gradient-to-r from-indigo-50 to-indigo-100 border border-indigo-200',
        dark: {
          text: '#a5b4fc', // indigo-300
          background: '#3730a3', // indigo-900
          border: '#4338ca', // indigo-600
          container: 'bg-gradient-to-r from-indigo-900 to-indigo-950 border border-indigo-800',
        },
      },
      comeback: {
        text: '#d97706', // amber-600
        background: '#fef3c7', // amber-100
        border: '#fcd34d', // amber-300
        container: 'bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200',
        dark: {
          text: '#fcd34d', // amber-300
          background: '#78350f', // amber-900
          border: '#d97706', // amber-600
          container: 'bg-gradient-to-r from-amber-900 to-amber-950 border border-amber-800',
        },
      },
      // Mouse tags
      cheese: {
        text: '#d97706', // amber-600
        background: '#fef3c7', // amber-100
        border: '#fcd34d', // amber-300
        container: 'bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200',
        dark: {
          text: '#fcd34d', // amber-300
          background: '#78350f', // amber-900
          border: '#d97706', // amber-600
          container: 'bg-gradient-to-r from-amber-900 to-amber-950 border border-amber-800',
        },
      },
      disrupt: {
        text: '#dc2626', // red-600
        background: '#fee2e2', // red-100
        border: '#fca5a5', // red-300
        container: 'bg-gradient-to-r from-red-50 to-red-100 border border-red-200',
        dark: {
          text: '#f87171', // red-400
          background: '#7f1d1d', // red-900
          border: '#dc2626', // red-600
          container: 'bg-gradient-to-r from-red-900 to-red-950 border border-red-800',
        },
      },
      support: {
        text: '#2563eb', // blue-600
        background: '#dbeafe', // blue-100
        border: '#93c5fd', // blue-300
        container: 'bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200',
        dark: {
          text: '#60a5fa', // blue-400
          background: '#1e3a8a', // blue-900
          border: '#2563eb', // blue-600
          container: 'bg-gradient-to-r from-blue-900 to-blue-950 border border-blue-800',
        },
      },
      rescue: {
        text: '#059669', // emerald-600
        background: '#d1fae5', // emerald-100
        border: '#6ee7b7', // emerald-300
        container: 'bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200',
        dark: {
          text: '#34d399', // emerald-400
          background: '#064e3b', // emerald-900
          border: '#059669', // emerald-600
          container: 'bg-gradient-to-r from-emerald-900 to-emerald-950 border border-emerald-800',
        },
      },
      breakthrough: {
        text: '#9333ea', // purple-600
        background: '#e9d5ff', // purple-100
        border: '#c4b5fd', // purple-300
        container: 'bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200',
        dark: {
          text: '#c4b5fd', // purple-300
          background: '#581c87', // purple-900
          border: '#9333ea', // purple-600
          container: 'bg-gradient-to-r from-purple-900 to-purple-950 border border-purple-800',
        },
      },
      wallBreak: {
        text: '#9a3412', // orange-800 (deeper reddish brown)
        background: '#fee5d3', // orange-175 equivalent (lighter background)
        border: '#ea580c', // orange-600 (reddish brown border)
        container: 'bg-gradient-to-r from-orange-100 to-orange-200 border border-orange-300',
        dark: {
          text: '#fdbf74', // orange-300
          background: '#7c2d12', // orange-900
          border: '#ea580c', // orange-600
          container: 'bg-gradient-to-r from-orange-900 to-orange-950 border border-orange-800',
        },
      },
      // Shared tags (mouse variant)
      lateGameMouse: {
        text: '#0d9488', // teal-600
        background: '#ccfbf1', // teal-100
        border: '#5eead4', // teal-300
        container: 'bg-gradient-to-r from-teal-50 to-teal-100 border border-teal-200',
        dark: {
          text: '#5eead4', // teal-300
          background: '#0f766e', // teal-900
          border: '#0d9488', // teal-600
          container: 'bg-gradient-to-r from-teal-900 to-teal-950 border border-teal-800',
        },
      },
      // Minor tags
      minor: {
        text: '#4b5563', // gray-600
        background: '#f3f4f6', // gray-100
        border: '#d1d5db', // gray-300
        container: 'bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200',
        dark: {
          text: '#9ca3af', // gray-400
          background: '#1f2937', // gray-800
          border: '#4b5563', // gray-600
          container: 'bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700',
        },
      },
    },

    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      dark: {
        50: '#1e3a8a',
        100: '#1d4ed8',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8',
      },
    },

    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      500: '#6b7280',
      600: '#4b5563',
      800: '#1f2937',
      900: '#111827',
      dark: {
        50: '#111827',
        100: '#1f2937',
        200: '#374151',
        300: '#4b5563',
        500: '#6b7280',
        600: '#9ca3af',
        800: '#e5e7eb',
        900: '#f9fafb',
      },
    },
  },

  typography: {
    fontSize: {
      xs: '0.75rem', // 12px
      sm: '0.875rem', // 14px
      base: '1rem', // 16px
      lg: '1.125rem', // 18px
      xl: '1.25rem', // 20px
      '2xl': '1.5rem', // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },

  shadows: {
    card: '0 2px 6px rgba(0, 0, 0, 0.05)',
    cardHover: '0 4px 12px rgba(37, 99, 235, 0.2)',
    button: '0 1px 3px rgba(0, 0, 0, 0.1)',
    navigation: '0 2px 4px rgba(0, 0, 0, 0.1)',
    dark: {
      card: '0 2px 6px rgba(0, 0, 0, 0.2)',
      cardHover: '0 4px 12px rgba(37, 99, 235, 0.4)',
      button: '0 1px 3px rgba(0, 0, 0, 0.2)',
      navigation: '0 2px 4px rgba(0, 0, 0, 0.2)',
    },
  },
  radius: {
    none: '0',
    xs: '0.25rem', // 4px
    sm: '0.375rem', // 6px
    md: '0.5rem', // 8px
    lg: '0.75rem', // 12px
    xl: '1rem', // 16px
    full: '9999px',
  },

  zIndex: {
    base: 1,
    dropdown: 10,
    sticky: 20,
    modal: 30,
    navigation: 9999,
  },

  transitions: {
    fast: '150ms ease',
    normal: '200ms ease',
    slow: '300ms ease',
    colors: 'background-color 200ms ease, color 200ms ease',
    transform: 'transform 200ms ease',
    all: 'all 200ms ease',
    hover:
      'background-color 300ms ease, color 300ms ease, transform 300ms ease, box-shadow 300ms ease',
  },
} as const;

export const componentTokens = {
  factionButton: {
    base: {
      padding: '1rem 1.5rem', // 16px 24px
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
      minWidth: '11.25rem', // 180px
      backgroundColor: designTokens.colors.faction.background,
      color: designTokens.colors.faction.text,
      boxShadow: designTokens.shadows.card,
    },

    mobile: {
      padding: '0.75rem 1rem', // 12px 16px
    },

    content: {
      display: 'flex',
      alignItems: 'center',
      gap: designTokens.spacing.sm,
    },

    emoji: {
      fontSize: designTokens.typography.fontSize['2xl'],
    },

    title: {
      fontSize: designTokens.typography.fontSize['2xl'],
      fontWeight: designTokens.typography.fontWeight.bold,
      whiteSpace: 'nowrap',
    },

    description: {
      fontSize: designTokens.typography.fontSize.sm,
      color: designTokens.colors.faction.textSecondary,
      marginTop: '0.25rem', // 4px
    },

    hover: {
      backgroundColor: designTokens.colors.faction.hover,
      color: designTokens.colors.faction.hoverText,
      boxShadow: designTokens.shadows.cardHover,
      transform: 'translateY(-2px)',
    },
  },
  factionButtonContainer: {
    display: 'flex',
    flexDirection: 'row' as const,
    justifyContent: 'center',
    gap: designTokens.spacing.lg,
    width: '100%',
    maxWidth: '43.75rem', // 700px
    margin: '0 auto',
  },

  // Card component tokens
  card: {
    base: {
      borderRadius: designTokens.radius.lg,
      boxShadow: designTokens.shadows.card,
      transition: designTokens.transitions.hover,
      border: 'none',
      outline: 'none',
    },
    content: {
      height: '16rem', // h-64 (256px)
    },
  },
  // Tag component tokens
  tag: {
    base: {
      padding: `${designTokens.spacing.xxxs} ${designTokens.spacing.xs}`, // 6px 8px
      borderRadius: designTokens.radius.sm,
      fontWeight: designTokens.typography.fontWeight.medium,
      display: 'inline-block',
      border: 'none',
    },
    compact: {
      padding: `${designTokens.spacing.xxxxs} ${designTokens.spacing.xxs}`, // 5px 7px
      borderRadius: designTokens.radius.sm,
      fontWeight: designTokens.typography.fontWeight.medium,
      display: 'inline-block',
      border: 'none',
    },
    micro: {
      padding: `${designTokens.spacing.xxxxxxs} ${designTokens.spacing.xxxxxs}`, // 3px 4px
      borderRadius: designTokens.radius.sm,
      fontWeight: designTokens.typography.fontWeight.medium,
      display: 'inline-block',
      border: 'none',
    },
  },

  // Image component tokens
  image: {
    dimensions: {
      CHARACTER_CARD: { width: 140, height: 140 },
      KNOWLEDGECARD_CARD: { width: 140, height: 140 },
      SPECIAL_SKILL_CARD: { width: 90, height: 90 },
      ITEM_CARD: { width: 130, height: 130 },
      CARD_DETAILS: { width: 220, height: 220 },
    },
    container: {
      height: '12rem', // h-48 (192px)
      borderRadius: `${designTokens.radius.lg} ${designTokens.radius.lg} 0 0`,
    },
  },

  // Grid component tokens
  grid: {
    gap: designTokens.spacing.md,
    columns: {
      mobile: 2,
      tablet: 3,
      desktop: 4,
      large: 5,
      extraLarge: 6,
    },
  },
} as const;

export const createStyleFromTokens = (tokenPath: Record<string, unknown>): React.CSSProperties => {
  if (typeof tokenPath === 'object' && tokenPath !== null) {
    const styles: React.CSSProperties = {};

    for (const [key, value] of Object.entries(tokenPath)) {
      if (typeof value === 'string' || typeof value === 'number') {
        (styles as Record<string, string | number>)[key] = value;
      }
    }

    return styles;
  }

  return {};
};

// Card utility functions using design tokens
export const getCardRankColors = (rank: string, includeBorder: boolean, isDarkMode: boolean) => {
  const rankKey = rank as keyof typeof designTokens.colors.rank;
  const colorScheme = designTokens.colors.rank[rankKey] || designTokens.colors.rank.default;

  return {
    color: isDarkMode && colorScheme.dark ? colorScheme.dark.text : colorScheme.text,
    backgroundColor:
      isDarkMode && colorScheme.dark ? colorScheme.dark.background : colorScheme.background,
    ...(includeBorder && {
      borderColor: isDarkMode && colorScheme.dark ? colorScheme.dark.border : colorScheme.border,
    }),
  };
};

export const getCardCostColors = (cost: number, includeBorder: boolean, isDarkMode: boolean) => {
  let colorScheme;

  if (cost >= 6) {
    colorScheme = designTokens.colors.cost.high;
  } else if (cost >= 5) {
    colorScheme = designTokens.colors.cost.medium;
  } else if (cost >= 4) {
    colorScheme = designTokens.colors.cost.low;
  } else {
    colorScheme = designTokens.colors.cost.veryLow;
  }

  return {
    color: isDarkMode && colorScheme.dark ? colorScheme.dark.text : colorScheme.text,
    backgroundColor:
      isDarkMode && colorScheme.dark ? colorScheme.dark.background : colorScheme.background,
    ...(includeBorder && {
      borderColor: isDarkMode && colorScheme.dark ? colorScheme.dark.border : colorScheme.border,
    }),
  };
};

// Type label utility (for preview badges like 角色/知识卡)
export const getTypeLabelColors = (type: string, isDarkMode = false) => {
  const map: Record<
    string,
    {
      text: string;
      background: string;
      dark: { text: string; background: string };
    }
  > = {
    character: {
      text: '#1D4ED8',
      background: '#DBEAFE',
      dark: { text: '#60A5FA', background: '#1E3A8A' },
    }, // blue-700 on blue-100 | dark: blue-400 on blue-900
    card: {
      text: '#A16207',
      background: '#FEF9C3',
      dark: { text: '#C4B5FD', background: '#581C87' },
    }, // yellow-700 | dark: purple-300 on purple-900
    item: {
      text: '#15803D',
      background: '#DCFCE7',
      dark: { text: '#34D399', background: '#064E3B' },
    }, // green-700 | dark: emerald-400 on emerald-900
    entity: {
      text: '#C2410C',
      background: '#FFEDD5',
      dark: { text: '#FDBA74', background: '#7C2D12' },
    }, // orange-700 | dark: orange-300 on orange-900
    'special-skill-cat': {
      text: '#BE185D',
      background: '#FCE7F3',
      dark: { text: '#F9A8D4', background: '#831843' },
    }, // pink-700 | dark: pink-300 on pink-900
    'special-skill-mouse': {
      text: '#6D28D9',
      background: '#EDE9FE',
      dark: { text: '#C4B5FD', background: '#4C1D95' },
    }, // purple-700 | dark: violet-300 on violet-900
    doc: {
      text: '#374151',
      background: '#F3F4F6',
      dark: { text: '#9CA3AF', background: '#1F2937' },
    }, // gray-700 | dark: gray-400 on gray-800
    'character-skill': {
      text: '#4338CA',
      background: '#E0E7FF',
      dark: { text: '#A5B4FC', background: '#3730A3' },
    }, // indigo-700 | dark: indigo-300 on indigo-900
  };

  const scheme = map[type] ?? map.doc!;
  return isDarkMode
    ? { color: scheme.dark.text, backgroundColor: scheme.dark.background }
    : { color: scheme.text, backgroundColor: scheme.background };
};

// Positioning tag utility functions
export const getPositioningTagColors = (
  tagName: string,
  isMinor: boolean,
  includeBorder: boolean,
  faction: FactionId,
  isDarkMode: boolean
) => {
  // Map Chinese tag names to design token keys
  const tagMapping: Record<string, keyof typeof designTokens.colors.positioningTags> = {
    进攻: 'attack',
    防守: 'defense',
    追击: 'chase',
    速通: 'speedrun',
    打架: 'fight',
    后期: faction === 'mouse' ? 'lateGameMouse' : 'lateGame',
    翻盘: 'comeback',
    奶酪: 'cheese',
    干扰: 'disrupt',
    辅助: 'support',
    救援: 'rescue',
    破局: 'breakthrough',
    砸墙: 'wallBreak',
  };

  const tagKey = tagMapping[tagName];
  const colorScheme = tagKey
    ? designTokens.colors.positioningTags[tagKey]
    : designTokens.colors.positioningTags.minor;

  // Base style object with consistent properties

  if (isMinor && tagKey) {
    // For minor tags, create diagonal gradient background
    const originalColorScheme = designTokens.colors.positioningTags[tagKey];
    const greyColorScheme = designTokens.colors.positioningTags.minor;

    return {
      color:
        isDarkMode && originalColorScheme.dark
          ? originalColorScheme.dark.text
          : originalColorScheme.text,
      background: `linear-gradient(135deg, ${
        isDarkMode && originalColorScheme.dark
          ? originalColorScheme.dark.background
          : originalColorScheme.background
      } 20%, ${
        isDarkMode && greyColorScheme.dark
          ? greyColorScheme.dark.background
          : greyColorScheme.background
      } 40%)`,
      borderColor: includeBorder
        ? isDarkMode && greyColorScheme.dark
          ? greyColorScheme.dark.border
          : greyColorScheme.border
        : 'transparent',
    };
  }

  if (isMinor) {
    // Fallback for minor tags without recognized tag name
    const greyColorScheme = designTokens.colors.positioningTags.minor;
    return {
      color: isDarkMode && greyColorScheme.dark ? greyColorScheme.dark.text : greyColorScheme.text,
      backgroundColor:
        isDarkMode && greyColorScheme.dark
          ? greyColorScheme.dark.background
          : greyColorScheme.background,
      borderColor: includeBorder
        ? isDarkMode && greyColorScheme.dark
          ? greyColorScheme.dark.border
          : greyColorScheme.border
        : 'transparent',
    };
  }

  return {
    color: isDarkMode && colorScheme.dark ? colorScheme.dark.text : colorScheme.text,
    backgroundColor:
      isDarkMode && colorScheme.dark ? colorScheme.dark.background : colorScheme.background,
    borderColor: includeBorder
      ? isDarkMode && colorScheme.dark
        ? colorScheme.dark.border
        : colorScheme.border
      : 'transparent',
  };
};

/**
 * Item type color utility
 */
export const getItemTypeColors = (itemtype: string, isDarkMode: boolean) => {
  const itemTypeColorMap: Record<string, 'weapon1' | 'weapon2' | 'active' | 'passive'> = {
    投掷类: 'weapon1',
    手持类: 'weapon2',
    物件类: 'active',
    食物类: 'passive',
    流程类: 'passive',
    其它: 'passive',
  };
  const skillType = itemTypeColorMap[itemtype] || 'passive';
  const colorScheme =
    designTokens.colors.skillTypes[skillType] || designTokens.colors.skillTypes.passive;
  return {
    color: isDarkMode && colorScheme.dark ? colorScheme.dark.text : colorScheme.text,
    backgroundColor:
      isDarkMode && colorScheme.dark ? colorScheme.dark.background : colorScheme.background,
  };
};

/**
 * Item source color utility
 */
export const getItemSourceColors = (itemsource: string, isDarkMode: boolean) => {
  const itemSourceColorMap: Record<
    string,
    { color: string; backgroundColor: string; darkColor: string; darkBackgroundColor: string }
  > = {
    常规道具: {
      color: designTokens.colors.primary[600],
      backgroundColor: designTokens.colors.primary[50],
      darkColor: designTokens.colors.primary.dark[500],
      darkBackgroundColor: designTokens.colors.primary.dark[50],
    },
    地图道具: {
      color: designTokens.colors.gray[600],
      backgroundColor: designTokens.colors.gray[100],
      darkColor: designTokens.colors.gray.dark[800],
      darkBackgroundColor: designTokens.colors.gray.dark[100],
    },
    技能道具: {
      color: designTokens.colors.rank.A.text,
      backgroundColor: designTokens.colors.rank.A.background,
      darkColor: designTokens.colors.rank.A.dark.text,
      darkBackgroundColor: designTokens.colors.rank.A.dark.background,
    },
  };
  const colorSet = itemSourceColorMap[itemsource] || {
    color: designTokens.colors.gray[600],
    backgroundColor: designTokens.colors.gray[100],
    darkColor: designTokens.colors.gray.dark[800],
    darkBackgroundColor: designTokens.colors.gray.dark[100],
  };
  return {
    color: isDarkMode ? colorSet.darkColor : colorSet.color,
    backgroundColor: isDarkMode ? colorSet.darkBackgroundColor : colorSet.backgroundColor,
  };
};

/**
 * Avatar filter color utility
 * - 杰瑞: use the same brownish colors as the "砸墙" positioning tag
 * - 泰菲: grayish blue
 * - 汤姆: blue
 * - 其他: neutral gray
 */
export const getAvatarFilterColors = (
  option: '杰瑞' | '泰菲' | '汤姆' | '其他',
  isDarkMode: boolean
): { color: string; backgroundColor: string } => {
  // 杰瑞: 复用“砸墙”定位标签的配色
  if (option === '杰瑞') {
    const c = designTokens.colors.positioningTags.wallBreak;
    const light = { text: c.text, bg: c.background };
    const dark = c.dark ? { text: c.dark.text, bg: c.dark.background } : light;
    const theme = isDarkMode ? dark : light;
    return { color: theme.text, backgroundColor: theme.bg };
  }

  // 其他选项采用固定配色
  const palette = {
    汤姆: {
      light: { bg: '#E0F2FF', text: '#0369A1' },
      dark: { bg: '#024D72', text: '#09AFFF' },
    },
    泰菲: {
      light: { bg: '#D8DBF8', text: '#4453AA' },
      dark: { bg: '#4453AA', text: '#D7DAF9' },
    },
    其他: {
      light: { bg: '#e5e7eb', text: '#4b5563' },
      dark: { bg: '#374151', text: '#e5e7eb' },
    },
  } as const;

  const scheme = palette[option];
  const theme = isDarkMode ? scheme.dark : scheme.light;
  return { color: theme.text, backgroundColor: theme.bg };
};

// Skill type utility functions
export const getSkillTypeColors = (
  skillType: 'passive' | 'active' | 'weapon1' | 'weapon2',
  includeBorder: boolean,
  isDarkMode: boolean
) => {
  const colorScheme =
    designTokens.colors.skillTypes[skillType] || designTokens.colors.skillTypes.passive;

  return {
    color: isDarkMode && colorScheme.dark ? colorScheme.dark.text : colorScheme.text,
    backgroundColor:
      isDarkMode && colorScheme.dark ? colorScheme.dark.background : colorScheme.background,
    ...(includeBorder && {
      borderColor: isDarkMode && colorScheme.dark ? colorScheme.dark.border : colorScheme.border,
    }),
  };
};

export const getSkillTypeContainerColor = (
  skillType: 'passive' | 'active' | 'weapon1' | 'weapon2',
  isDarkMode: boolean
): string => {
  const colorScheme =
    designTokens.colors.skillTypes[skillType] || designTokens.colors.skillTypes.passive;

  return isDarkMode && colorScheme.dark ? colorScheme.dark.container : colorScheme.container;
};

// Skill level utility functions
export const getSkillLevelColors = (level: number, includeBorder: boolean, isDarkMode: boolean) => {
  let colorScheme;

  if (level === 1) {
    colorScheme = designTokens.colors.skillLevels.level1;
  } else if (level === 2) {
    colorScheme = designTokens.colors.skillLevels.level2;
  } else if (level === 3) {
    colorScheme = designTokens.colors.skillLevels.level3;
  } else {
    // Default to level 1 colors for any other level
    colorScheme = designTokens.colors.skillLevels.level1;
  }

  return {
    color: isDarkMode && colorScheme.dark ? colorScheme.dark.text : colorScheme.text,
    backgroundColor:
      isDarkMode && colorScheme.dark ? colorScheme.dark.background : colorScheme.background,
    ...(includeBorder && {
      borderColor: isDarkMode && colorScheme.dark ? colorScheme.dark.border : colorScheme.border,
    }),
  };
};

export const getSkillLevelContainerColor = (level: number, isDarkMode: boolean): string => {
  let colorScheme;

  if (level === 1) {
    colorScheme = designTokens.colors.skillLevels.level1;
  } else if (level === 2) {
    colorScheme = designTokens.colors.skillLevels.level2;
  } else if (level === 3) {
    colorScheme = designTokens.colors.skillLevels.level3;
  } else {
    // Default to level 1 colors for any other level
    colorScheme = designTokens.colors.skillLevels.level1;
  }

  return isDarkMode && colorScheme.dark ? colorScheme.dark.container : colorScheme.container;
};

export const getPositioningTagContainerColor = (
  tagName: string,
  isMinor: boolean,
  faction: FactionId,
  isDarkMode: boolean
): string => {
  // Map Chinese tag names to design token keys
  const tagMapping: Record<string, keyof typeof designTokens.colors.positioningTags> = {
    进攻: 'attack',
    防守: 'defense',
    追击: 'chase',
    速通: 'speedrun',
    打架: 'fight',
    后期: faction === 'mouse' ? 'lateGameMouse' : 'lateGame',
    翻盘: 'comeback',
    奶酪: 'cheese',
    干扰: 'disrupt',
    辅助: 'support',
    救援: 'rescue',
    破局: 'breakthrough',
    砸墙: 'wallBreak',
  };

  const tagKey = tagMapping[tagName];
  const colorScheme = tagKey
    ? designTokens.colors.positioningTags[tagKey]
    : designTokens.colors.positioningTags.minor;

  if (isMinor) {
    return isDarkMode
      ? 'bg-slate-800/50 border border-slate-700'
      : 'bg-gray-50 border border-gray-100';
  }

  return isDarkMode && colorScheme.dark ? colorScheme.dark.container : colorScheme.container;
};

/**
 * Entity type color utility
 */
export const getEntityTypeColors = (entitytype: string, isDarkMode: boolean) => {
  const entityTypeColorMap: Record<string, 'weapon1' | 'weapon2' | 'active' | 'passive'> = {
    道具类: 'weapon1',
    投射物类: 'weapon2',
    召唤物类: 'active',
    平台类: 'passive',
    NPC类: 'passive',
    其它: 'passive',
  };
  const skillType = entityTypeColorMap[entitytype] || 'passive';
  const colorScheme =
    designTokens.colors.skillTypes[skillType] || designTokens.colors.skillTypes.passive;
  return {
    color: isDarkMode && colorScheme.dark ? colorScheme.dark.text : colorScheme.text,
    backgroundColor:
      isDarkMode && colorScheme.dark ? colorScheme.dark.background : colorScheme.background,
  };
};
