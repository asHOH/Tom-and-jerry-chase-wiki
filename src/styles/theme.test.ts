import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const themeSource = fs.readFileSync(path.join(projectRoot, 'src/styles/theme.css'), 'utf8');
const baseSource = fs.readFileSync(path.join(projectRoot, 'src/styles/base.css'), 'utf8');
const patternsSource = fs.readFileSync(path.join(projectRoot, 'src/styles/patterns.css'), 'utf8');
const layoutSource = fs.readFileSync(path.join(projectRoot, 'src/app/layout.tsx'), 'utf8');
const sharedNeutralSources = [
  'src/lib/design/componentClasses.ts',
  'src/components/TabNavigation.tsx',
  'src/components/ui/CharacterSelector.tsx',
  'src/components/ui/RichTextEditor.tsx',
  'src/components/ui/RichTextEditor/ImagePickerModal.tsx',
  'src/components/ui/RichTextEditor/Toolbar.tsx',
  'src/components/ui/SearchDialog.tsx',
  'src/components/ui/SpecifyTypeNavigationButtons.tsx',
].map((filePath) => ({
  filePath,
  source: fs.readFileSync(path.join(projectRoot, filePath), 'utf8'),
}));
const manualThemePairs = [
  /(?:bg-white|bg-(?:gray|slate)-(?:50|100|200))[^'\n]*dark:bg-(?:slate|gray)-(?:600|700|800|900)/,
  /hover:bg-(?:gray|slate)-(?:50|100|200|300)[^'\n]*dark:hover:bg-(?:slate|gray)-(?:600|700|800|900)/,
  /border-(?:gray|slate)-200[^'\n]*dark:border-(?:slate|gray)-700/,
];

const collectSourceFiles = (relativePath: string): string[] => {
  const absolutePath = path.join(projectRoot, relativePath);
  const stat = fs.statSync(absolutePath);
  if (stat.isFile()) return /\.tsx?$/.test(relativePath) ? [relativePath] : [];

  return fs
    .readdirSync(absolutePath, { withFileTypes: true })
    .flatMap((entry) => collectSourceFiles(path.join(relativePath, entry.name)));
};

const highDriftNeutralSources = [
  'src/app/(main)/articles',
  'src/app/(main)/games',
  'src/app/(main)/notifications',
  'src/app/(main)/recent-changes',
  'src/app/(main)/users',
  'src/app/(main)/win-rates',
  'src/components/articles',
  'src/features/admin',
  'src/features/articles',
  'src/features/users',
]
  .flatMap(collectSourceFiles)
  .map((filePath) => ({
    filePath: filePath.split(path.sep).join('/'),
    source: fs.readFileSync(path.join(projectRoot, filePath), 'utf8'),
  }));

const intentionalHighDriftNeutralPairs = [
  {
    filePath: 'src/app/(main)/articles/[id]/history/ArticleHistoryClient.tsx',
    marker: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20',
  },
  {
    filePath: 'src/app/(main)/articles/preview/PreviewClient.tsx',
    marker: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30',
  },
  {
    filePath: 'src/app/(main)/games/playstyle-quiz/components/QuizProgress.tsx',
    marker: 'bg-gray-200 dark:bg-gray-700',
  },
  {
    filePath: 'src/features/admin/components/GameDataActionPreviewList.tsx',
    marker: 'bg-slate-50 px-3 text-slate-500 dark:bg-slate-900',
  },
  {
    filePath: 'src/features/admin/components/NoticeManagement.tsx',
    marker: 'bg-slate-100 text-slate-600 dark:bg-slate-700',
  },
  {
    filePath: 'src/features/articles/components/ArticleDiffViewer.tsx',
    marker: 'bg-white hover:bg-slate-50 dark:bg-slate-900',
  },
  {
    filePath: 'src/features/users/components/ContributionAnalytics.tsx',
    marker: 'bg-gray-100 dark:bg-gray-800',
  },
  {
    filePath: 'src/features/users/components/ContributionCalendar.tsx',
    marker: 'bg-slate-100 ring-slate-200 dark:bg-slate-800',
  },
] as const;

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getRuleBody = (source: string, selector: string): string => {
  const match = new RegExp(`${escapeRegExp(selector)}\\s*\\{([^}]*)\\}`).exec(source);
  if (!match?.[1]) throw new Error(`Missing CSS rule: ${selector}`);
  return match[1];
};

const semanticTokens = {
  '--wiki-background': {
    light: 'var(--color-gray-100)',
    dark: 'var(--color-slate-900)',
  },
  '--wiki-foreground': {
    light: 'var(--color-black)',
    dark: 'var(--color-slate-200)',
  },
  '--wiki-surface': {
    light: 'var(--color-white)',
    dark: 'var(--color-slate-800)',
  },
  '--wiki-surface-raised': {
    light: 'var(--color-white)',
    dark: 'var(--color-slate-800)',
  },
  '--wiki-surface-muted': {
    light: 'var(--color-gray-100)',
    dark: 'var(--color-slate-700)',
  },
  '--wiki-surface-sunken': {
    light: 'var(--color-gray-50)',
    dark: 'var(--color-slate-900)',
  },
  '--wiki-control': {
    light: 'var(--color-gray-200)',
    dark: 'var(--color-slate-700)',
  },
  '--wiki-control-hover': {
    light: 'var(--color-gray-300)',
    dark: 'var(--color-slate-600)',
  },
  '--wiki-control-active': {
    light: 'var(--color-gray-400)',
    dark: 'var(--color-gray-600)',
  },
  '--wiki-control-active-hover': {
    light: 'var(--color-gray-300)',
    dark: 'var(--color-gray-700)',
  },
  '--wiki-muted-foreground': {
    light: 'var(--color-gray-600)',
    dark: 'var(--color-gray-400)',
  },
  '--wiki-border': {
    light: 'var(--color-gray-200)',
    dark: 'var(--color-slate-700)',
  },
  '--wiki-focus': {
    light: 'var(--color-blue-500)',
    dark: 'var(--color-blue-400)',
  },
} as const;

describe('semantic root theme', () => {
  it('binds every semantic token to light and dark Tailwind primitives', () => {
    const lightTheme = getRuleBody(themeSource, ':root');
    const darkTheme = getRuleBody(themeSource, '.dark');

    for (const [token, values] of Object.entries(semanticTokens)) {
      expect(lightTheme).toContain(`${token}: ${values.light};`);
      expect(darkTheme).toContain(`${token}: ${values.dark};`);
    }
  });

  it('exposes semantic colors to Tailwind through inline aliases', () => {
    const aliases = getRuleBody(themeSource, '@theme inline');

    for (const token of Object.keys(semanticTokens)) {
      const semanticName = token.replace('--wiki-', '');
      expect(aliases).toContain(`--color-${semanticName}: var(${token});`);
    }
  });

  it('uses the semantic theme as the only root canvas and foreground source', () => {
    expect(baseSource).toMatch(
      /html,\s*body\s*\{[^}]*color:\s*var\(--wiki-foreground\);[^}]*background-color:\s*var\(--wiki-background\);/s
    );
    expect(baseSource).toContain('outline: 2px solid var(--wiki-focus);');
    expect(themeSource).not.toContain('--foreground-rgb');
    expect(themeSource).not.toContain('--background-rgb');
    expect(baseSource).not.toContain('--foreground-rgb');
    expect(baseSource).not.toContain('--background-rgb');
  });

  it('does not retain competing root layout background utilities', () => {
    expect(layoutSource).not.toContain('bg-gray-100');
    expect(layoutSource).not.toContain('dark:bg-slate-900');
  });

  it('keeps shared neutral recipes on semantic surface and control tokens', () => {
    for (const { filePath, source } of sharedNeutralSources) {
      for (const pattern of manualThemePairs) {
        expect({ filePath, match: source.match(pattern)?.[0] }).toEqual({
          filePath,
          match: undefined,
        });
      }
    }
  });

  it('limits manual neutral pairs in high-drift features to intentional data states', () => {
    const unexpectedPairs: Array<{ filePath: string; line: string }> = [];
    const manualSurfacePairs = manualThemePairs.slice(0, 2);

    for (const { filePath, source } of highDriftNeutralSources) {
      for (const line of source.split('\n')) {
        if (!manualSurfacePairs.some((pattern) => pattern.test(line))) continue;

        const isIntentional = intentionalHighDriftNeutralPairs.some(
          (exception) => exception.filePath === filePath && line.includes(exception.marker)
        );
        if (!isIntentional) unexpectedPairs.push({ filePath, line: line.trim() });
      }
    }

    expect(unexpectedPairs).toEqual([]);
    for (const exception of intentionalHighDriftNeutralPairs) {
      const source = highDriftNeutralSources.find(
        ({ filePath }) => filePath === exception.filePath
      )?.source;
      expect(source).toContain(exception.marker);
    }
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
});
