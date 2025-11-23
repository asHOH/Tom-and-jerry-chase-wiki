import fs from 'fs/promises';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const IMAGE_ROOT = path.join(PUBLIC_DIR, 'images');
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

function isPathWithinBase(baseDir: string, candidate: string): boolean {
  const relative = path.relative(baseDir, candidate);
  return !!relative && !relative.startsWith('..') && !path.isAbsolute(relative);
}

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const relativePath = sanitizeRelativePath(searchParams.get('path'));
  const targetDir = path.join(IMAGE_ROOT, relativePath);

  if (!isPathWithinBase(IMAGE_ROOT, targetDir) && path.resolve(targetDir) !== IMAGE_ROOT) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 403 });
  }

  try {
    const stat = await fs.stat(targetDir);
    if (!stat.isDirectory()) {
      return NextResponse.json({ error: 'Not a directory' }, { status: 400 });
    }

    const dirents = await fs.readdir(targetDir, { withFileTypes: true });
    const entries = dirents
      .filter((dirent) => {
        if (dirent.isDirectory()) return true;
        const ext = path.extname(dirent.name).toLowerCase();
        return IMAGE_EXTENSIONS.has(ext);
      })
      .map((dirent) => {
        const entryRelative = relativePath
          ? path.posix.join(relativePath, dirent.name)
          : dirent.name;
        const publicPath = `/${path.posix.join('images', entryRelative)}`;
        return {
          name: dirent.name,
          type: dirent.isDirectory() ? 'directory' : 'file',
          path: entryRelative,
          publicPath: dirent.isDirectory() ? null : publicPath,
        };
      })
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
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    console.error('Failed to read site images', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
