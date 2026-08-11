import { sharedPositioningTagPalettes } from './palettes';

export const gameColorPalettes = {
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

  // Knowledge card group metadata colors
  knowledgeCardGroupMeta: {
    contributor: {
      text: '#1e293b', // slate-800
      background: '#e0e7ef', // slate-200 adjusted
      dark: {
        text: '#e0e7ef', // slate-200 adjusted
        background: '#334155', // slate-700
      },
    },
    missingWarning: {
      text: '#dc2626', // red-600
      background: '#fef2f2', // red-50
      dark: {
        text: '#fef2f2', // red-50
        background: '#dc2626', // red-600
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
} as const;
