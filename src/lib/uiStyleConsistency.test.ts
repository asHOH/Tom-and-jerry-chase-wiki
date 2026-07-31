import fs from 'node:fs';
import path from 'node:path';
import postcss, { type Container, type Rule } from 'postcss';

const globalStylesPath = path.join(process.cwd(), 'src/styles/base.css');

function getRule(root: Container, selectorFragment: string): Rule {
  const rule = root.nodes?.find(
    (node): node is Rule => node.type === 'rule' && node.selector.includes(selectorFragment)
  );

  if (!rule) {
    throw new Error(`Expected a CSS rule containing selector: ${selectorFragment}`);
  }

  return rule;
}

function hasDeclaration(rule: Rule, property: string, value?: string): boolean {
  return (
    rule.nodes?.some(
      (node) =>
        node.type === 'decl' &&
        node.prop === property &&
        (value === undefined || node.value === value)
    ) ?? false
  );
}

describe('global style contracts', () => {
  it('preserves component focus styles and the development overlay radius token', () => {
    const root = postcss.parse(fs.readFileSync(globalStylesPath, 'utf8'));
    const focusFallback = getRule(root, '*:focus-visible:not(');

    for (const selector of [
      "[class*='focus:ring-']",
      "[class*='focus-visible:ring-']",
      "[class*='focus:outline-']",
      "[class*='focus-visible:outline-']",
    ]) {
      expect(focusFallback.selector).toContain(selector);
    }

    expect(hasDeclaration(focusFallback, 'outline', '2px solid var(--wiki-focus)')).toBe(true);
    expect(hasDeclaration(focusFallback, 'outline-offset', '2px')).toBe(true);
    expect(hasDeclaration(focusFallback, 'border-radius')).toBe(false);

    const nextErrorOverlay = getRule(root, '[data-nextjs-call-stack-frame]');
    expect(hasDeclaration(nextErrorOverlay, 'border-radius', 'var(--radius-lg)')).toBe(true);
  });
});
