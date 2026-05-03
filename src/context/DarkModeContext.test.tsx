import { renderToString } from 'react-dom/server';

import { useDarkMode } from './DarkModeContext';

const mockSetTheme = jest.fn();

jest.mock('next-themes', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
  useTheme: () => ({
    resolvedTheme: 'dark',
    setTheme: mockSetTheme,
  }),
}));

function DarkModeProbe() {
  const [isDarkMode] = useDarkMode();
  return <span>{isDarkMode ? 'dark' : 'light'}</span>;
}

describe('useDarkMode', () => {
  it('uses a hydration-safe light value before client effects run', () => {
    expect(renderToString(<DarkModeProbe />)).toContain('light');
  });
});
