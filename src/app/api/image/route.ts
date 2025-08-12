import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  if (!searchParams.has('src')) {
    return new NextResponse('Missing "src" parameter', { status: 400 });
  }

  const src = decodeURIComponent(searchParams.get('src')!);
  // const width = searchParams.get('w'); // Next.js Image component passes 'w' for width
  // const quality = searchParams.get('q') || '75'; // Default quality to 75

  const sanitizedSrc = path.normalize(src).replace(/^(\.\.[/\\])+/, '');
  const fullOriginalPath = path.join(process.cwd(), 'public', sanitizedSrc);

  const baseNameWithoutExt = path.basename(fullOriginalPath, path.extname(fullOriginalPath));
  const dirName = path.dirname(fullOriginalPath);
  const baseImagePath = path.join(dirName, baseNameWithoutExt);

  try {
    const acceptHeader = request.headers.get('Accept') || '';
    let filePathToServe = fullOriginalPath;
    let contentType = `image/${path.extname(fullOriginalPath).substring(1)}`;

    // Check for AVIF
    if (acceptHeader.includes('image/avif')) {
      const avifPath = `${baseImagePath}.avif`;
      try {
        await fs.access(avifPath);
        filePathToServe = avifPath;
        contentType = 'image/avif';
      } catch (e) {
        void e;
      }
    }

    // Check for WEBP
    if (contentType !== 'image/avif' && acceptHeader.includes('image/webp')) {
      const webpPath = `${baseImagePath}.webp`;
      try {
        await fs.access(webpPath);
        filePathToServe = webpPath;
        contentType = 'image/webp';
      } catch (e) {
        void e;
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

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(imageBuffer);
        controller.close();
      },
    });

    return new NextResponse(stream, { headers });
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
