import fs from 'fs/promises';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif', '.svg']);

function sanitizeRelativePath(raw: string | null): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  if (!trimmed) return '';
  const normalized = path.posix.normalize(trimmed).replace(/^\//, '');
  if (normalized === '.' || normalized === '..') {
    return '';
  }
  return normalized;
}

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const relativePath = sanitizeRelativePath(searchParams.get('path'));
  if (
    relativePath.startsWith('..') ||
    relativePath.includes('\\') ||
    path.win32.isAbsolute(relativePath)
  ) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 403 });
  }

  try {
    // Trace only the generated index; images remain ordinary public assets.
    const index: string[] = JSON.parse(
      await fs.readFile(path.join(process.cwd(), '.site-images-index.json'), 'utf8')
    );
    const directoryPath = relativePath ? `${relativePath.replace(/\/$/, '')}/` : '/';
    if (!index.includes(directoryPath)) {
      return index.includes(relativePath)
        ? NextResponse.json({ error: 'Not a directory' }, { status: 400 })
        : NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const prefix = directoryPath === '/' ? '' : directoryPath;
    const entries = index
      .filter((entry) => entry.startsWith(prefix) && entry !== directoryPath)
      .map((entry) => entry.slice(prefix.length))
      .filter((entry) => !entry.replace(/\/$/, '').includes('/'))
      .map((entry) => {
        const isDirectory = entry.endsWith('/');
        const name = isDirectory ? entry.slice(0, -1) : entry;
        const entryRelative = relativePath ? path.posix.join(relativePath, name) : name;
        const publicPath = `/${path.posix.join('images', entryRelative)}`;
        return {
          name,
          type: isDirectory ? 'directory' : 'file',
          path: entryRelative,
          publicPath: isDirectory ? null : publicPath,
        };
      })
      .filter(
        (entry) =>
          entry.type === 'directory' || IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())
      )
      .sort((a, b) => {
        if (a.type === b.type) {
          return a.name.localeCompare(b.name, 'zh-CN');
        }
        return a.type === 'directory' ? -1 : 1;
      });

    const parentPath = relativePath ? path.posix.dirname(relativePath) : null;
    const normalizedParent = parentPath === '.' ? '' : parentPath;

    return NextResponse.json({
      basePath: '/images',
      currentPath: relativePath,
      parentPath: normalizedParent,
      entries,
    });
  } catch (error) {
    console.error('Failed to read site image index', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
