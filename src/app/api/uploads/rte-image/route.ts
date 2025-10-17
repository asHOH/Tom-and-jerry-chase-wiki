import { Buffer } from 'node:buffer';
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import {
  normalizeHostedImageUrl,
  RTE_IMAGE_ALLOWED_MIME_TYPES,
  RTE_IMAGE_BUCKET,
  RTE_IMAGE_MAX_BYTES,
  RTE_IMAGE_PUBLIC_BASE,
} from '@/lib/richtext/imagePolicy';

const MAX_LIBRARY_LIMIT = 60;
const LIST_PAGE_SIZE = 100;

type StorageEntry = {
  name: string | null;
  id: string | null;
  updated_at: string | null;
  created_at: string | null;
  metadata: { size?: number; mimetype?: string } | null;
};

async function collectFiles(
  prefix: string,
  depth: number,
  limit: number,
  searchTerm: string | null,
  results: Array<{ entry: StorageEntry; path: string }>
): Promise<void> {
  if (results.length >= limit) return;

  const options = {
    limit: LIST_PAGE_SIZE,
    offset: 0,
    sortBy: { column: 'updated_at', order: 'desc' } as const,
  };

  const { data, error } = await supabaseAdmin.storage.from(RTE_IMAGE_BUCKET).list(prefix, options);

  if (error) {
    throw error;
  }

  for (const rawEntry of data ?? []) {
    if (!rawEntry?.name) continue;
    const entry = rawEntry as StorageEntry;
    const name = entry.name ?? '';
    if (!name) continue;
    const isFile = Boolean(entry.id);
    const fullPath = prefix ? `${prefix}/${name}` : name;

    if (isFile) {
      if (searchTerm && !fullPath.toLowerCase().includes(searchTerm)) {
        continue;
      }
      results.push({ entry, path: fullPath });
      if (results.length >= limit) {
        return;
      }
    } else if (depth > 0) {
      await collectFiles(fullPath, depth - 1, limit, searchTerm, results);
      if (results.length >= limit) {
        return;
      }
    }
  }
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limitParam = Number.parseInt(searchParams.get('limit') ?? '30', 10);
  const limit = Number.isFinite(limitParam)
    ? Math.min(Math.max(limitParam, 1), MAX_LIBRARY_LIMIT)
    : 30;
  const scope = searchParams.get('scope') === 'all' ? 'all' : 'mine';
  const searchTerm = searchParams.get('search')?.trim();

  const normalizedSearch = searchTerm ? searchTerm.toLowerCase() : null;
  const prefixes = scope === 'mine' ? [user.id] : [''];
  const maxDepth = scope === 'mine' ? 2 : 3;
  const aggregated: Array<{ entry: StorageEntry; path: string }> = [];

  try {
    for (const prefix of prefixes) {
      await collectFiles(prefix, maxDepth, limit, normalizedSearch, aggregated);
      if (aggregated.length >= limit) {
        break;
      }
    }
  } catch (error) {
    console.error('Supabase storage recursive list error', error);
    return NextResponse.json({ error: 'Failed to list images' }, { status: 500 });
  }

  const items = aggregated.slice(0, limit).map(({ entry, path }) => {
    const rawSize = entry.metadata?.size;
    const size =
      typeof rawSize === 'number'
        ? rawSize
        : typeof rawSize === 'string'
          ? Number.parseInt(rawSize, 10)
          : null;
    const mimeType = entry.metadata?.mimetype;
    const publicUrl = RTE_IMAGE_PUBLIC_BASE
      ? `${RTE_IMAGE_PUBLIC_BASE}/${path}`
      : supabaseAdmin.storage.from(RTE_IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
    return {
      name: path.split('/').pop() ?? '',
      path,
      publicUrl,
      createdAt: entry.created_at,
      size,
      mimeType: typeof mimeType === 'string' ? mimeType : null,
    };
  });

  return NextResponse.json({ items });
}

const MIME_EXTENSION_MAP: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
};

export const runtime = 'nodejs';

function resolveExtension(uploadedFile: File | Blob): string {
  if ('name' in uploadedFile) {
    const explicitExt = extname(uploadedFile.name).toLowerCase().replace('.', '');
    if (explicitExt) {
      return explicitExt;
    }
  }
  return MIME_EXTENSION_MAP[uploadedFile.type] ?? 'bin';
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: 'Missing file' }, { status: 400 });
  }

  if (!RTE_IMAGE_ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Unsupported image format' }, { status: 400 });
  }

  if (file.size > RTE_IMAGE_MAX_BYTES) {
    return NextResponse.json({ error: 'File too large' }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const extension = resolveExtension(file);
  const today = new Date();
  const folder = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, '0')}-${String(
    today.getUTCDate()
  ).padStart(2, '0')}`;
  const objectKey = `${user.id}/${folder}/${randomUUID()}.${extension}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from(RTE_IMAGE_BUCKET)
    .upload(objectKey, buffer, {
      upsert: false,
      contentType: file.type,
      cacheControl: '31536000',
    });

  if (uploadError) {
    console.error('Supabase storage upload error', uploadError);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = supabaseAdmin.storage.from(RTE_IMAGE_BUCKET).getPublicUrl(objectKey);

  if (!normalizeHostedImageUrl(publicUrl)) {
    console.error('Uploaded image URL failed policy check', publicUrl);
    return NextResponse.json({ error: 'Uploaded image URL not allowed' }, { status: 500 });
  }

  return NextResponse.json({ publicUrl, path: objectKey });
}
