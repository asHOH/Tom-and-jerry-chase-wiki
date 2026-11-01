import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '@babel/parser';
import { __unstable__loadDesignSystem } from '@tailwindcss/node';
import { Scanner } from '@tailwindcss/oxide';
import postcss from 'postcss';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const sourceExtension = /\.(?:[cm]?[jt]sx?|html|mdx|css)$/;

export function listSourceFiles(root) {
  return execFileSync(
    'git',
    ['ls-files', '--cached', '--others', '--exclude-standard', '-z', '--', 'src', 'public'],
    { cwd: root, encoding: 'utf8' }
  )
    .split('\0')
    .filter(
      (file) =>
        sourceExtension.test(file) &&
        !file.startsWith('src/data/generated/') &&
        !file.endsWith('.d.ts') &&
        existsSync(path.resolve(root, file))
    );
}

function sourceStrings(content, filename) {
  const strings = [];
  if (filename.endsWith('.css')) {
    postcss.parse(content, { from: filename }).walkAtRules('apply', (rule) => {
      strings.push({
        text: rule.params,
        offset: rule.source.start.offset + rule.toString().indexOf(rule.params),
      });
    });
  } else if (/\.(?:html|mdx)$/.test(filename)) {
    const markup = content.replace(/<!--[\s\S]*?-->/g, (comment) => ' '.repeat(comment.length));
    for (const match of markup.matchAll(
      /(?<![\w:-])(?:class|\w*ClassName|className)\s*=\s*(['"])(.*?)\1/gs
    )) {
      strings.push({ text: match[2], offset: match.index + match[0].indexOf(match[1]) + 1 });
    }
  } else {
    const ast = parse(content, {
      sourceType: 'unambiguous',
      attachComment: false,
      plugins: [
        ...(/\.[cm]?tsx?$/.test(filename) ? ['typescript'] : []),
        ...(/\.[jt]sx?$/.test(filename) && !filename.endsWith('.ts') ? ['jsx'] : []),
      ],
    });
    function visit(node, parent, inClassCall = false) {
      const classCall =
        inClassCall ||
        (node.type === 'CallExpression' &&
          node.callee.type === 'Identifier' &&
          ['cn', 'clsx'].includes(node.callee.name));
      if (node.type === 'StringLiteral' || node.type === 'TemplateElement') {
        if (parent?.key === node && !parent.computed && !classCall) return;
        if (parent?.source === node) return;
        const offset = node.start + (node.type === 'StringLiteral' ? 1 : 0);
        const end = node.end - (node.type === 'StringLiteral' ? 1 : 0);
        let text = content.slice(offset, end);
        if (node.type === 'TemplateElement') {
          const index = parent.quasis.indexOf(node);
          if (index > 0) text = text.replace(/^\S+/, (part) => ' '.repeat(part.length));
          if (index < parent.quasis.length - 1) {
            text = text.replace(/\S+$/, (part) => ' '.repeat(part.length));
          }
        }
        strings.push({ text, offset });
        return;
      }
      for (const value of Object.values(node)) {
        for (const child of Array.isArray(value) ? value : [value]) {
          if (child && typeof child.type === 'string') visit(child, node, classCall);
        }
      }
    }
    visit(ast.program);
  }
  return strings.sort((a, b) => a.offset - b.offset);
}

export function createChecker(designSystem) {
  const scanner = new Scanner({});
  const replacements = new Map();

  function replacementFor(candidate) {
    if (replacements.has(candidate)) return replacements.get(candidate);
    // shortcut: Tailwind's canonicalization API is internal; rerun these tests on Tailwind upgrades.
    const canonical = designSystem.canonicalizeCandidates([candidate], { collapse: false });
    let replacement = canonical.length === 1 ? canonical[0] : candidate;

    // Numeric scales and simple fractions have equivalent values but different generated declarations.
    if (replacement === candidate) {
      replacement = candidate.replace(
        /(^|:)scale-\[(\d+(?:\.\d+)?)\](!?)$/,
        (match, prefix, value, important) => {
          const percent = Number(value) * 100;
          return Math.abs(percent - Math.round(percent)) < 1e-8
            ? `${prefix}scale-${Math.round(percent)}${important}`
            : match;
        }
      );
      replacement = replacement.replace(
        /(^|:)((?:min-|max-)?[wh])-\[(\d+)%\](!?)$/,
        (match, prefix, utility, value, important) => {
          const denominator = [2, 3, 4, 5, 10].find(
            (divisor) => (Number(value) * divisor) % 100 === 0
          );
          return denominator
            ? `${prefix}${utility}-${(Number(value) * denominator) / 100}/${denominator}${important}`
            : match;
        }
      );
    }

    const result =
      replacement !== candidate &&
      replacement.length <= candidate.length &&
      designSystem.candidatesToCss([replacement])[0]
        ? replacement
        : null;
    replacements.set(candidate, result);
    return result;
  }

  return function checkSource(content, filename) {
    const findings = [];
    for (const { text, offset } of sourceStrings(content, filename)) {
      for (const { candidate, position } of scanner.getCandidatesWithPositions({
        content: text,
        extension: 'html',
      })) {
        const replacement = replacementFor(candidate);
        if (!replacement) continue;
        const index = offset + position;
        const line = content.slice(0, index).split('\n').length;
        const column = index - content.lastIndexOf('\n', index - 1);
        findings.push({ candidate, replacement, line, column });
      }
    }
    return findings;
  };
}

async function main() {
  const started = performance.now();
  const requested = process.argv.slice(2);
  const files = requested.length ? requested : listSourceFiles(projectRoot);
  if (files.some((file) => !sourceExtension.test(file))) {
    throw new Error('Expected JavaScript, TypeScript, HTML, MDX, or CSS source files.');
  }
  const stylesheet = path.join(projectRoot, 'src/app/globals.css');
  const designSystem = await __unstable__loadDesignSystem(await readFile(stylesheet, 'utf8'), {
    base: path.dirname(stylesheet),
  });
  const checkSource = createChecker(designSystem);
  let count = 0;
  const uniqueFiles = [...new Set(files)].sort();
  for (const file of uniqueFiles) {
    try {
      const findings = checkSource(await readFile(path.resolve(projectRoot, file), 'utf8'), file);
      for (const finding of findings) {
        console.log(
          `${file}:${finding.line}:${finding.column} ${finding.candidate} -> ${finding.replacement}`
        );
      }
      count += findings.length;
    } catch (error) {
      throw new Error(`${file}: ${error.message}`, { cause: error });
    }
  }
  console.log(
    `Tailwind check: ${uniqueFiles.length} files, ${count} suggestions, ${((performance.now() - started) / 1000).toFixed(3)}s.`
  );
  process.exitCode = count ? 1 : 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`Tailwind check failed: ${error.message}`);
    process.exitCode = 2;
  });
}
