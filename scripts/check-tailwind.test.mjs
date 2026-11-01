import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { __unstable__loadDesignSystem } from '@tailwindcss/node';

import { createChecker, listSourceFiles } from './check-tailwind.mjs';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const stylesheet = path.join(projectRoot, 'src/app/globals.css');
const design = await __unstable__loadDesignSystem(await readFile(stylesheet, 'utf8'), {
  base: path.dirname(stylesheet),
});
const check = createChecker(design);

test('detects the simplified utility forms, including variants and important modifiers', () => {
  const examples = [
    ['z-[10060]', 'z-10060'],
    ['!h-6', 'h-6!'],
    ['!w-6', 'w-6!'],
    ['hover:text-[var(--filter-button-hover-color)]', 'hover:text-(--filter-button-hover-color)'],
    ['[scrollbar-gutter:stable]', 'scrollbar-gutter-stable'],
    ['[scrollbar-width:none]', 'scrollbar-none'],
    ['[@media(pointer:coarse)]:pointer-events-none', 'pointer-coarse:pointer-events-none'],
    ['bg-black/[0.02]', 'bg-black/2'],
    ['dark:bg-white/[0.03]', 'dark:bg-white/3'],
    [
      '[grid-template-columns:repeat(auto-fit,minmax(175px,1fr))]',
      'grid-cols-[repeat(auto-fit,minmax(175px,1fr))]',
    ],
    ['hover:scale-[1.02]', 'hover:scale-102'],
    ['group-hover:scale-[1.02]', 'group-hover:scale-102'],
    ['scale-[0.55]', 'scale-55'],
    ['group-hover:scale-[0.6]', 'group-hover:scale-60'],
    ['max-w-[90%]', 'max-w-9/10'],
    ['md:hover:z-[10060]!', 'md:hover:z-10060!'],
  ];
  for (const [candidate, replacement] of examples) {
    const findings = check(`const className = ${JSON.stringify(candidate)};`, 'example.ts');
    assert.equal(findings.length, 1, candidate);
    assert.equal(findings[0].replacement, replacement, candidate);
    assert.deepEqual(check(`const c = ${JSON.stringify(replacement)};`, 'example.ts'), []);
  }
});

test('preserves pixels, custom formulas, longer selector rewrites, and dynamic fragments', () => {
  const content = [
    'const c = "min-h-[420px] text-[12px] rounded-[2px] w-[83%] scale-[1.2345] h-6 w-6";',
    'const layout = "w-[calc(100%-2rem)] [&_[id]]:scroll-mt-(--character-scroll-offset)";',
    'const dynamic = `z-[${value}] scale-[1.02]${suffix} ${prefix}z-[100]`;',
  ].join('\n');
  assert.deepEqual(check(content, 'example.ts'), []);
});

test('ignores expressions, comments, imports, and property keys', () => {
  assert.deepEqual(
    check(
      `
    import value from 'flex-shrink';
    // z-[10060]
    const enabled = !origin && !content && !filter;
    const styles = { 'flex-shrink': 0 };
  `,
      'example.ts'
    ),
    []
  );
  assert.deepEqual(check('/* @apply z-[10060]; */ .card { flex-shrink: 0; }', 'example.css'), []);
  assert.deepEqual(
    check('<!-- <div class="z-[10060]"> --> <div data-class="z-[10060]">', 'example.html'),
    []
  );
});

test('reports every occurrence with correct Unicode-aware locations in JSX and templates', () => {
  const lines = [
    '// 中文 😀',
    'const view = <div className="z-[10060] z-[10060]" />;',
    'const styles = cn(`中文 😀 z-[10060] ${active ? "hover:scale-[1.02]" : ""}`);',
  ];
  const findings = check(lines.join('\n'), 'example.tsx');
  assert.equal(findings.length, 4);
  assert.deepEqual(
    findings.map(({ line, column }) => [line, column]),
    [
      [2, lines[1].indexOf('z-') + 1],
      [2, lines[1].lastIndexOf('z-') + 1],
      [3, lines[2].indexOf('z-') + 1],
      [3, lines[2].indexOf('hover:') + 1],
    ]
  );
});

test('checks static markup attributes and CSS @apply with locations', () => {
  assert.deepEqual(
    check('const c = cn({ "flex-shrink": active });', 'example.ts').map(
      ({ replacement }) => replacement
    ),
    ['shrink']
  );
  for (const extension of ['html', 'mdx']) {
    const findings = check(
      '<div class="z-[10060]" panelClassName=\'!h-6\'>',
      `example.${extension}`
    );
    assert.deepEqual(
      findings.map(({ replacement }) => replacement),
      ['z-10060', 'h-6!']
    );
    assert.equal(findings[0].column, 13);
  }
  assert.deepEqual(check('.card {\n  @apply z-[10060];\n}', 'example.css'), [
    { candidate: 'z-[10060]', replacement: 'z-10060', line: 2, column: 10 },
  ]);
});

test('uses the supplied theme spacing without converting px to rem', async () => {
  const custom = createChecker(
    await __unstable__loadDesignSystem('@theme { --spacing: 0.5rem; }', {
      base: projectRoot,
    })
  );
  const findings = custom('const c = "h-[1rem] h-[16px]";', 'example.ts');
  assert.equal(findings.length, 1);
  assert.equal(findings[0].replacement, 'h-2');
});

test('CLI exits 1 for suggestions, 0 for clean files, and 2 for input errors without rewriting', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'tailwind-check-'));
  const file = path.join(directory, 'example.tsx');
  const run = () =>
    spawnSync(process.execPath, ['scripts/check-tailwind.mjs', file], {
      cwd: projectRoot,
      encoding: 'utf8',
      timeout: 30_000,
    });
  try {
    const original = 'const view = <div className="z-[10060]" />;';
    await writeFile(file, original);
    let result = run();
    assert.equal(result.status, 1, result.stderr);
    assert.match(result.stdout, /z-\[10060\] -> z-10060/);
    assert.equal(await readFile(file, 'utf8'), original);

    await writeFile(file, original.replace('z-[10060]', 'z-10060'));
    result = run();
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /1 files, 0 suggestions/);

    await writeFile(file, 'const =');
    result = run();
    assert.equal(result.status, 2);
    assert.match(result.stderr, /Tailwind check failed:/);
  } finally {
    assert.equal(path.dirname(path.resolve(directory)), path.resolve(tmpdir()));
    assert.ok(path.basename(directory).startsWith('tailwind-check-'));
    await rm(directory, { recursive: true, force: true });
  }
});

test('default discovery includes new sources and excludes ignored, generated, and deleted files', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'tailwind-check-'));
  try {
    execFileSync('git', ['init', '--quiet'], { cwd: directory });
    await mkdir(path.join(directory, 'src/data/generated'), { recursive: true });
    await mkdir(path.join(directory, 'public'));
    await writeFile(path.join(directory, '.gitignore'), 'src/ignored.tsx\n');
    for (const file of [
      'src/tracked.tsx',
      'src/deleted.tsx',
      'src/new.tsx',
      'public/offline.html',
      'src/ignored.tsx',
      'src/types.d.ts',
      'src/data/generated/example.ts',
    ]) {
      await writeFile(path.join(directory, file), '');
    }
    execFileSync('git', ['add', 'src/tracked.tsx', 'src/deleted.tsx'], { cwd: directory });
    await unlink(path.join(directory, 'src/deleted.tsx'));
    assert.deepEqual(listSourceFiles(directory).sort(), [
      'public/offline.html',
      'src/new.tsx',
      'src/tracked.tsx',
    ]);
  } finally {
    assert.equal(path.dirname(path.resolve(directory)), path.resolve(tmpdir()));
    assert.ok(path.basename(directory).startsWith('tailwind-check-'));
    await rm(directory, { recursive: true, force: true });
  }
});
