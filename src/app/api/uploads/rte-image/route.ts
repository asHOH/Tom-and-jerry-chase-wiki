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

  // storage.objects isn't part of the generated Database types, so fall back to an untyped query
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const storageQuery = (supabaseAdmin as any).from('storage.objects');

  let query = storageQuery
    .select('name,created_at,metadata', { count: 'exact' })
    .eq('bucket_id', RTE_IMAGE_BUCKET);

  if (scope === 'mine') {
    const prefixPattern = `${user.id}/%`;
    if (searchTerm) {
      const sanitized = searchTerm.replace(/[%_]/g, '\\$&');
      query = query.ilike('name', `${user.id}/%${sanitized}%`);
    } else {
      query = query.ilike('name', prefixPattern);
    }
  } else if (searchTerm) {
    const sanitized = searchTerm.replace(/[%_]/g, '\\$&');
    query = query.ilike('name', `%${sanitized}%`);
  }

  const { data, error } = await query.order('created_at', { ascending: false }).limit(limit);

  if (error) {
    console.error('Supabase storage list error', error);
    return NextResponse.json({ error: 'Failed to list images' }, { status: 500 });
  }

  type StorageObjectRow = {
    name: string;
    created_at: string | null;
    metadata: null | { size?: number; mimetype?: string; [key: string]: unknown };
  };

  const rows: StorageObjectRow[] = Array.isArray(data) ? (data as StorageObjectRow[]) : [];

  const items = rows.map((item) => {
    const metadata = item.metadata ?? {};
    const rawSize = (metadata as Record<string, unknown>).size;
    const size =
      typeof rawSize === 'number'
        ? rawSize
        : typeof rawSize === 'string'
          ? Number.parseInt(rawSize, 10)
          : null;
    const mimeType = (metadata as Record<string, unknown>).mimetype;
    const publicUrl = RTE_IMAGE_PUBLIC_BASE
      ? `${RTE_IMAGE_PUBLIC_BASE}/${item.name}`
      : supabaseAdmin.storage.from(RTE_IMAGE_BUCKET).getPublicUrl(item.name).data.publicUrl;
    return {
      name:
        String(item.name ?? '')
          .split('/')
          .pop() ?? '',
      path: item.name as string,
      publicUrl,
      createdAt: item.created_at as string | null,
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
