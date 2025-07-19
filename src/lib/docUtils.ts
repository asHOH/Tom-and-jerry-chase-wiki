'use server';

import fs from 'fs';
import path from 'path';

export interface DocPage {
  title: string;
  slug: string;
  path: string;
}

export async function getDocPages(): Promise<DocPage[]> {
  const docsDir = path.join(process.cwd(), 'src/app/docs');
  const docPages: DocPage[] = [];

  try {
    const items = fs.readdirSync(docsDir, { withFileTypes: true });

    for (const item of items) {
      if (item.isDirectory() && !item.name.startsWith('.')) {
        const pagePath = path.join(docsDir, item.name, 'page.mdx');

        if (fs.existsSync(pagePath)) {
          try {
            const content = fs.readFileSync(pagePath, 'utf-8');

            // Extract title from the MDX file
            const titleMatch = content.match(/export\s+const\s+title\s*=\s*["']([^"']+)["']/);
            const title =
              titleMatch?.[1] ??
              item.name.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

            docPages.push({
              title,
              slug: item.name,
              path: `/docs/${item.name}`,
            });
          } catch (error) {
            console.warn(`Failed to read ${pagePath}:`, error);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error reading docs directory:', error);
  }

  return docPages.sort((a, b) => a.title.localeCompare(b.title));
}
