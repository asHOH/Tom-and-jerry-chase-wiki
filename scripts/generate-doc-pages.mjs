// Generate doc pages index from src/app/docs/*/page.mdx
// Outputs to src/data/generated/docPages.json
import fs from 'node:fs/promises';
import path from 'node:path';

async function main() {
  const root = process.cwd();
  const docsDir = path.join(root, 'src', 'app', 'docs');
  const outDir = path.join(root, 'src', 'data', 'generated');
  const outFile = path.join(outDir, 'docPages.json');

  try {
    await fs.mkdir(outDir, { recursive: true });
  } catch {}

  let entries = [];
  try {
    const items = await fs.readdir(docsDir, { withFileTypes: true });
    for (const item of items) {
      if (!item.isDirectory() || item.name.startsWith('.')) continue;
      const slug = item.name;
      const pagePath = path.join(docsDir, slug, 'page.mdx');
      try {
        const content = await fs.readFile(pagePath, 'utf-8');
        const m = content.match(/^#\s+(.+)$/m);
        const title = m?.[1]?.trim() || slug;
        entries.push({ title, slug, path: `/docs/${slug}` });
      } catch {
        // Ignore missing or unreadable MDX
        continue;
      }
    }
  } catch {
    // No docs dir; write empty list
    entries = [];
  }

  // Sort by title for stable output
  entries.sort((a, b) => a.title.localeCompare(b.title, 'zh-CN'));

  const json = JSON.stringify(entries, null, 2);
  await fs.writeFile(outFile, json + '\n', 'utf-8');
  console.log(`Generated ${outFile} with ${entries.length} entries.`);
}

main().catch((err) => {
  console.error('[generate-doc-pages] Failed:', err);
  process.exit(1);
});
