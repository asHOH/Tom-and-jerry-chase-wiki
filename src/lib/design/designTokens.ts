import { sharedPositioningTagPalettes } from './palettes';

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
