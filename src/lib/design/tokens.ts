// The shared palette logic was originally part of design-tokens.ts
// It is used by both the designTokens definition and the utility functions.

const sharedPositioningTagPalettes = {
  crimson: {
    text: '#dc2626',
    background: '#fee2e2',
    border: '#fca5a5',
    container: 'bg-gradient-to-r from-red-50 to-red-100 border border-red-200',
    dark: {
      text: '#f87171',
      background: '#7f1d1d',
      border: '#dc2626',
      container: 'bg-gradient-to-r from-red-900 to-red-950 border border-red-800',
    },
  },
  azure: {
    text: '#2563eb',
    background: '#dbeafe',
    border: '#93c5fd',
    container: 'bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200',
    dark: {
      text: '#60a5fa',
      background: '#1e3a8a',
      border: '#2563eb',
      container: 'bg-gradient-to-r from-blue-900 to-blue-950 border border-blue-800',
    },
  },
  violet: {
    text: '#9333ea',
    background: '#e9d5ff',
    border: '#c4b5fd',
    container: 'bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200',
    dark: {
      text: '#c4b5fd',
      background: '#581c87',
      border: '#9333ea',
      container: 'bg-gradient-to-r from-purple-900 to-purple-950 border border-purple-800',
    },
  },
  russet: {
    text: '#9a3412',
    background: '#fee5d3',
    border: '#ea580c',
    container: 'bg-gradient-to-r from-orange-100 to-orange-200 border border-orange-300',
    dark: {
      text: '#fdbf74',
      background: '#7c2d12',
      border: '#ea580c',
      container: 'bg-gradient-to-r from-orange-900 to-orange-950 border border-orange-800',
    },
  },
  amber: {
    text: '#d97706',
    background: '#fef3c7',
    border: '#fcd34d',
    container: 'bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200',
    dark: {
      text: '#fcd34d',
      background: '#78350f',
      border: '#d97706',
      container: 'bg-gradient-to-r from-amber-900 to-amber-950 border border-amber-800',
    },
  },
  deepGray: {
    text: '#111111',
    background: '#dbdee3',
    border: '#ffffff',
    container: 'bg-gradient-to-r from-gray-100 to-gray-200 border border-gray-200',
    dark: {
      text: '#dbdee3',
      background: '#4b5563',
      border: '#000000',
      container: 'bg-gradient-to-r from-gray-600 to-gray-650 border border-gray-700',
    },
  },
  emerald: {
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
  pink: {
    text: '#db2777', // pink-600
    background: '#fce7f3', // pink-100
    border: '#f472b6', // pink-400
    container: 'bg-gradient-to-r from-pink-50 to-pink-100 border border-pink-200',
    dark: {
      text: '#f9a8d4', // pink-300
      background: '#831843', // pink-900
      border: '#db2777', // pink-600
      container: 'bg-gradient-to-r from-pink-900 to-pink-950 border border-pink-800',
    },
  },
  indigo: {
    text: '#4f46e5', // indigo-600
    background: '#e0e7ff', // indigo-100
    border: '#818cf8', // indigo-400
    container: 'bg-gradient-to-r from-indigo-50 to-indigo-100 border border-indigo-200',
    dark: {
      text: '#a5b4fc', // indigo-300
      background: '#312e81', // indigo-900
      border: '#4f46e5', // indigo-600
      container: 'bg-gradient-to-r from-indigo-900 to-indigo-950 border border-indigo-800',
    },
  },
  rose: {
    text: '#e11d48', // rose-600
    background: '#ffe4e6', // rose-100
    border: '#fb7185', // rose-400
    container: 'bg-gradient-to-r from-rose-50 to-rose-100 border border-rose-200',
    dark: {
      text: '#fda4af', // rose-300
      background: '#881337', // rose-900
      border: '#e11d48', // rose-600
      container: 'bg-gradient-to-r from-rose-900 to-rose-950 border border-rose-800',
    },
  },
} as const;

export const designTokens = {
  spacing: {
    xs3: '0.1875rem', // 3px
    xs4: '0.25rem', // 4px (1 unit)
    xs5: '0.3125rem', // 5px
    xs6: '0.375rem', // 6px
    xs7: '0.4375rem', // 7px
    xs: '0.5rem', // 8px
    sm: '0.75rem', // 12px
    md: '1rem', // 16px
    lg: '1.5rem', // 24px
    xl: '2rem', // 32px
  },
  colors: {
    // Common base colors
    common: {
      white: '#ffffff',
      black: '#000000',
    },
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
        light: { background: '#E0F2FF', text: '#0369A1' },
        dark: { background: '#024D72', text: '#09AFFF' },
      },
      mouse: {
        light: {
          background: sharedPositioningTagPalettes.russet.background,
          text: sharedPositioningTagPalettes.russet.text,
        },
        dark: {
          background: sharedPositioningTagPalettes.russet.dark.background,
          text: sharedPositioningTagPalettes.russet.dark.text,
        },
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
      attack: sharedPositioningTagPalettes.crimson,
      defense: sharedPositioningTagPalettes.azure,
      chase: sharedPositioningTagPalettes.russet,
      speedrun: sharedPositioningTagPalettes.emerald,
      fight: sharedPositioningTagPalettes.violet,
      lateGame: sharedPositioningTagPalettes.deepGray,
      comeback: sharedPositioningTagPalettes.amber,
      // Mouse tags
      cheese: sharedPositioningTagPalettes.amber,
      disrupt: sharedPositioningTagPalettes.crimson,
      support: sharedPositioningTagPalettes.azure,
      rescue: sharedPositioningTagPalettes.emerald,
      breakthrough: sharedPositioningTagPalettes.violet,
      wallBreak: sharedPositioningTagPalettes.russet,
      // Shared tags (mouse variant)
      lateGameMouse: sharedPositioningTagPalettes.deepGray,
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
    cardHover: '0 12px 24px rgba(37, 99, 235, 0.12), 0 4px 12px rgba(0, 0, 0, 0.04)',
    button: '0 1px 3px rgba(0, 0, 0, 0.1)',
    navigation: '0 2px 4px rgba(0, 0, 0, 0.1)',
    dark: {
      card: '0 2px 6px rgba(0, 0, 0, 0.2)',
      cardHover: '0 12px 32px rgba(37, 99, 235, 0.25), 0 8px 16px rgba(0, 0, 0, 0.2)',
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
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    normal: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '350ms cubic-bezier(0.4, 0, 0.2, 1)',
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
      transform: 'translateY(-2px)',
    },
    theme: {
      light: {
        base: {
          backgroundColor: designTokens.colors.faction.background,
          color: designTokens.colors.faction.text,
          boxShadow: designTokens.shadows.card,
        },
        descriptionColor: designTokens.colors.faction.textSecondary,
        hover: {
          backgroundColor: designTokens.colors.faction.hover,
          color: designTokens.colors.faction.hoverText,
          boxShadow: designTokens.shadows.cardHover,
        },
      },
      dark: {
        base: {
          backgroundColor: designTokens.colors.faction.dark.background,
          color: designTokens.colors.faction.dark.text,
          boxShadow: designTokens.shadows.dark.card,
        },
        descriptionColor: designTokens.colors.faction.dark.textSecondary,
        hover: {
          backgroundColor: designTokens.colors.faction.dark.hover,
          color: designTokens.colors.faction.dark.hoverText,
          boxShadow: designTokens.shadows.dark.cardHover,
        },
      },
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
      padding: `${designTokens.spacing.xs6} ${designTokens.spacing.xs}`, // 6px 8px
      borderRadius: designTokens.radius.sm,
      fontWeight: designTokens.typography.fontWeight.medium,
      display: 'inline-block',
      border: 'none',
    },
    compact: {
      padding: `${designTokens.spacing.xs5} ${designTokens.spacing.xs7}`, // 5px 7px
      borderRadius: designTokens.radius.sm,
      fontWeight: designTokens.typography.fontWeight.medium,
      display: 'inline-block',
      border: 'none',
    },
    micro: {
      padding: `${designTokens.spacing.xs3} ${designTokens.spacing.xs4}`, // 3px 4px
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

export { sharedPositioningTagPalettes };
