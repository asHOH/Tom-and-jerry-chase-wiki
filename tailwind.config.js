/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    // Rank colors - text and background
    'text-orange-600', 'bg-orange-100', 'border-orange-300',
    'text-purple-600', 'bg-purple-100', 'border-purple-300',
    'text-blue-600', 'bg-blue-100', 'border-blue-300',
    'text-green-600', 'bg-green-100', 'border-green-300',
    'text-gray-600', 'bg-gray-100', 'border-gray-300',
    // Cost colors - text and background
    'text-red-600', 'bg-red-100', 'border-red-300',
    'text-yellow-600', 'bg-yellow-100', 'border-yellow-300',
    // Cat positioning tag colors
    'text-indigo-600', 'bg-indigo-100', 'border-indigo-300',
    // Mouse positioning tag colors
    'text-amber-600', 'bg-amber-100', 'border-amber-300',
    'text-pink-600', 'bg-pink-100', 'border-pink-300',
    'text-cyan-600', 'bg-cyan-100', 'border-cyan-300',
    'text-emerald-600', 'bg-emerald-100', 'border-emerald-300',
    'text-violet-600', 'bg-violet-100', 'border-violet-300',
    'text-stone-600', 'bg-stone-100', 'border-stone-300',
    'text-teal-600', 'bg-teal-100', 'border-teal-300',
    // Additional utility classes that might be dynamically generated
    'border-current',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
      },
    },
  },
  plugins: [],
};
