'use server';

import fs from 'fs/promises'; // Use fs.promises for async operations
import path from 'path';
import { constants } from 'fs'; // Import constants for fs.access

export interface DocPage {
  title: string;
  slug: string;
  path: string;
}

export async function getDocPages(): Promise<DocPage[]> {
  const docsDir = path.join(process.cwd(), 'src/app/docs');
  const docPages: DocPage[] = [];

  try {
    const items = await fs.readdir(docsDir, { withFileTypes: true });

    for (const item of items) {
      if (item.isDirectory() && !item.name.startsWith('.')) {
        const pagePath = path.join(docsDir, item.name, 'page.mdx');

        try {
          await fs.access(pagePath, constants.F_OK); // Check if file exists
          const content = await fs.readFile(pagePath, 'utf-8');

          // Extract title from the MDX file
          const titleMatch = content.match(/^#\s+(.*)\n/);
          const title =
            titleMatch?.[1] ??
            item.name.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());

          docPages.push({
            title,
            slug: item.name,
            path: `/docs/${item.name}`,
          });
        } catch (error) {
          // If fs.access or fs.readFile fails, it means the file doesn't exist or can't be read
          // We can ignore this specific file and continue
          if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
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

export async function getTutorialPage(id: string): Promise<DocPage | null> {
  const docPages = await getDocPages();
  return docPages.find((page) => page.title == `${id}操作技巧`) ?? null;
}
