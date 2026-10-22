import fs from 'node:fs';
import path from 'node:path';
import postcss, { type AtRule, type Container, type Rule } from 'postcss';

const projectRoot = process.cwd();
const theme = postcss.parse(
  fs.readFileSync(path.join(projectRoot, 'src/styles/theme.css'), 'utf8')
);
const base = postcss.parse(fs.readFileSync(path.join(projectRoot, 'src/styles/base.css'), 'utf8'));
const patterns = postcss.parse(
  fs.readFileSync(path.join(projectRoot, 'src/styles/patterns.css'), 'utf8')
);

const getRule = (root: Container, selector: string): Rule | undefined =>
  root.nodes?.find(
    (node): node is Rule => node.type === 'rule' && node.selectors.includes(selector)
  );

const getDeclarations = (container: Container | undefined): Record<string, string> => {
  if (!container) throw new Error('Missing CSS rule');
  return Object.fromEntries(
    container.nodes?.flatMap((node) => (node.type === 'decl' ? [[node.prop, node.value]] : [])) ??
      []
  );
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
  'action-primary',
  'action-primary-foreground',
  'action-primary-hover',
];

it('provides semantic colors in both themes and exposes them to Tailwind', () => {
  const lightTheme = getDeclarations(getRule(theme, ':root'));
  const darkTheme = getDeclarations(getRule(theme, '.dark'));
  const aliases = getDeclarations(
    theme.nodes.find(
      (node): node is AtRule =>
        node.type === 'atrule' && node.name === 'theme' && node.params === 'inline'
    )
  );

  for (const name of semanticTokens) {
    expect(lightTheme[`--wiki-${name}`]).toMatch(/\S/);
    expect(darkTheme[`--wiki-${name}`]).toMatch(/\S/);
    expect(aliases[`--color-${name}`]).toBe(`var(--wiki-${name})`);
  }
});

it('applies semantic canvas, text, and keyboard focus colors', () => {
  for (const selector of ['html', 'body']) {
    expect(getDeclarations(getRule(base, selector))).toMatchObject({
      color: 'var(--wiki-foreground)',
      'background-color': 'var(--wiki-background)',
    });
  }
  expect(getDeclarations(getRule(patterns, '.filter-button:focus-visible')).outline).toBe(
    '2px solid var(--wiki-focus)'
  );
});

it('scopes fixed-navigation and offline clearance to the app content shell', () => {
  expect(getDeclarations(getRule(theme, ':root'))).toMatchObject({
    '--nav-height': '56px',
    '--offline-banner-height': '40px',
    '--content-top-gap': '20px',
  });
  const navHeights: string[] = [];
  theme.walkDecls('--nav-height', (declaration) => {
    navHeights.push(declaration.value);
  });
  expect(navHeights).toContain('60px');
  expect(getDeclarations(getRule(patterns, '.offline-banner')).top).toBe('var(--nav-height)');
  expect(getRule(patterns, 'body.offline-banner-visible .app-content-shell')).toBeDefined();
  patterns.walkRules((rule) => {
    expect(rule.selector).not.toMatch(/offline-banner-visible\s+main/);
  });
});
