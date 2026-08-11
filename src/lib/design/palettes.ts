// Shared semantic palettes used by game palettes and color style helpers.
export const sharedPositioningTagPalettes = {
  crimson: {
    text: '#dc2626',
    background: '#fee2e2',
    border: '#fca5a5',
    dark: {
      text: '#f87171',
      background: '#7f1d1d',
      border: '#dc2626',
    },
  },
  azure: {
    text: '#2563eb',
    background: '#dbeafe',
    border: '#93c5fd',
    dark: {
      text: '#60a5fa',
      background: '#1e3a8a',
      border: '#2563eb',
    },
  },
  violet: {
    text: '#9333ea',
    background: '#e9d5ff',
    border: '#c4b5fd',
    dark: {
      text: '#c4b5fd',
      background: '#581c87',
      border: '#9333ea',
    },
  },
  russet: {
    text: '#9a3412',
    background: '#fee5d3',
    border: '#ea580c',
    dark: {
      text: '#fdbf74',
      background: '#7c2d12',
      border: '#ea580c',
    },
  },
  amber: {
    text: '#d97706',
    background: '#fef3c7',
    border: '#fcd34d',
    dark: {
      text: '#fcd34d',
      background: '#78350f',
      border: '#d97706',
    },
  },
  deepGray: {
    text: '#111111',
    background: '#dbdee3',
    border: '#ffffff',
    dark: {
      text: '#dbdee3',
      background: '#4b5563',
      border: '#000000',
    },
  },
  emerald: {
    text: '#059669', // emerald-600
    background: '#d1fae5', // emerald-100
    border: '#6ee7b7', // emerald-300
    dark: {
      text: '#34d399', // emerald-400
      background: '#064e3b', // emerald-900
      border: '#059669', // emerald-600
    },
  },
  pink: {
    text: '#db2777', // pink-600
    background: '#fce7f3', // pink-100
    border: '#f472b6', // pink-400
    dark: {
      text: '#f9a8d4', // pink-300
      background: '#831843', // pink-900
      border: '#db2777', // pink-600
    },
  },
  indigo: {
    text: '#4f46e5', // indigo-600
    background: '#e0e7ff', // indigo-100
    border: '#818cf8', // indigo-400
    dark: {
      text: '#a5b4fc', // indigo-300
      background: '#312e81', // indigo-900
      border: '#4f46e5', // indigo-600
    },
  },
  rose: {
    text: '#e11d48', // rose-600
    background: '#ffe4e6', // rose-100
    border: '#fb7185', // rose-400
    dark: {
      text: '#fda4af', // rose-300
      background: '#881337', // rose-900
      border: '#e11d48', // rose-600
    },
  },
} as const;
