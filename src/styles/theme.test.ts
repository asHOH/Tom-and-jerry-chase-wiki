import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const themeSource = fs.readFileSync(path.join(projectRoot, 'src/styles/theme.css'), 'utf8');
const baseSource = fs.readFileSync(path.join(projectRoot, 'src/styles/base.css'), 'utf8');
const patternsSource = fs.readFileSync(path.join(projectRoot, 'src/styles/patterns.css'), 'utf8');

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getRuleBody = (source: string, selector: string): string => {
  const match = new RegExp(`${escapeRegExp(selector)}\\s*\\{([^}]*)\\}`).exec(source);
  if (!match?.[1]) throw new Error(`Missing CSS rule: ${selector}`);
  return match[1];
};

const semanticTokens = [
  'background',
  'foreground',
  'surface',
  'surface-raised',
  'surface-muted',
  'surface-sunken',
  'control',
  'control-hover',
  'control-active',
  'control-active-hover',
  'muted-foreground',
  'border',
  'focus',
];

it('provides semantic colors in both themes and exposes them to Tailwind', () => {
  const lightTheme = getRuleBody(themeSource, ':root');
  const darkTheme = getRuleBody(themeSource, '.dark');
  const aliases = getRuleBody(themeSource, '@theme inline');

  for (const name of semanticTokens) {
    const declaration = new RegExp(`--wiki-${name}:\\s*[^;]+;`);
    expect(lightTheme).toMatch(declaration);
    expect(darkTheme).toMatch(declaration);
    expect(aliases).toContain(`--color-${name}: var(--wiki-${name});`);
  }
});

it('applies semantic canvas, text, and keyboard focus colors', () => {
  expect(baseSource).toMatch(
    /html,\s*body\s*\{[^}]*color:\s*var\(--wiki-foreground\);[^}]*background-color:\s*var\(--wiki-background\);/s
  );
  expect(baseSource).toContain('outline: 2px solid var(--wiki-focus);');
});

it('scopes fixed-navigation and offline clearance to the app content shell', () => {
  expect(themeSource).toContain('--nav-height: 56px;');
  expect(themeSource).toContain('--nav-height: 60px;');
  expect(themeSource).toContain('--offline-banner-height: 40px;');
  expect(themeSource).toContain('--content-top-gap: 20px;');
  expect(patternsSource).toContain('top: var(--nav-height);');
  expect(patternsSource).toContain('body.offline-banner-visible .app-content-shell');
  expect(patternsSource).not.toMatch(/offline-banner-visible\s+main/);
});
