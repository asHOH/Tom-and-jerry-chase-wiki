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
