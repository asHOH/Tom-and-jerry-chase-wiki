// Shared semantic palettes used by design tokens and color style helpers.
export const sharedPositioningTagPalettes = {
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
