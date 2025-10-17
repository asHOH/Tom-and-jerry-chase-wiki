import { Buffer } from 'node:buffer';
import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import {
  normalizeHostedImageUrl,
  RTE_IMAGE_ALLOWED_MIME_TYPES,
  RTE_IMAGE_BUCKET,
  RTE_IMAGE_MAX_BYTES,
} from '@/lib/richtext/imagePolicy';

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
