import fs from 'fs/promises';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  if (!searchParams.has('src')) {
    return new NextResponse('Missing "src" parameter', { status: 400 });
  }

  const src = decodeURIComponent(searchParams.get('src')!);
  // const width = searchParams.get('w'); // Next.js Image component passes 'w' for width
  // const quality = searchParams.get('q') || '75'; // Default quality to 75

  // Define the allowed public directory
  const publicDir = path.resolve(process.cwd(), 'public');

  // Sanitize and resolve the requested path
  const sanitizedSrc = path
    .normalize(src)
    .replace(/^([/\\])+/, '')
    .replace(/^((\.\.)[/\\])+/, '');
  const fullOriginalPath = path.join(publicDir, sanitizedSrc);

  // Validate that the resolved path is within the public directory
  const normalizedFullPath = path.normalize(fullOriginalPath);
  const normalizedPublicDir = path.normalize(publicDir) + path.sep;
  if (
    normalizedFullPath !== path.normalize(publicDir) &&
    !normalizedFullPath.startsWith(normalizedPublicDir)
  ) {
    return new NextResponse('Invalid file path', { status: 403 });
  }

  const baseNameWithoutExt = path.basename(fullOriginalPath, path.extname(fullOriginalPath));
  const dirName = path.dirname(fullOriginalPath);
  const baseImagePath = path.join(dirName, baseNameWithoutExt);

  try {
    const acceptHeader = request.headers.get('Accept') || '';
    let filePathToServe = fullOriginalPath;
    let contentType = `image/${path.extname(fullOriginalPath).substring(1)}`;

    // Check for AVIF
    if (acceptHeader.includes('image/avif')) {
      const avifPath = path.resolve(`${baseImagePath}.avif`);
      // Validate AVIF path is within public directory
      if (avifPath.startsWith(publicDir + path.sep) || avifPath === publicDir) {
        try {
          await fs.access(avifPath);
          filePathToServe = avifPath;
          contentType = 'image/avif';
        } catch (e) {
          void e;
        }
      }
    }

    // Check for WEBP
    if (contentType !== 'image/avif' && acceptHeader.includes('image/webp')) {
      const webpPath = path.resolve(`${baseImagePath}.webp`);
      // Validate WEBP path is within public directory
      if (webpPath.startsWith(publicDir + path.sep) || webpPath === publicDir) {
        try {
          await fs.access(webpPath);
          filePathToServe = webpPath;
          contentType = 'image/webp';
        } catch (e) {
          void e;
        }
      }
    }

    const imageBuffer = await fs.readFile(filePathToServe);

    const headers = new Headers();
    headers.set('Content-Type', contentType);
    if (process.env.NODE_ENV === 'development') {
      headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    } else {
      headers.set('Cache-Control', 'private, max-age=2592000, immutable'); // use private because the response type is not shared
    }

    return new NextResponse(imageBuffer, { headers });
  } catch (error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: string }).code === 'ENOENT'
    ) {
      return new NextResponse('Image not found', { status: 404 });
    }
    console.error('Error serving image:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
