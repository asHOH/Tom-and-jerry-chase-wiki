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

  // Sanitize the src to prevent directory traversal
  const sanitizedSrc = path.normalize(src).replace(/^(\.\.[/\\])+/, '');
  const fullOriginalPath = path.join(process.cwd(), 'public', sanitizedSrc);

  // Get the path without the original extension
  const baseNameWithoutExt = path.basename(fullOriginalPath, path.extname(fullOriginalPath));
  const dirName = path.dirname(fullOriginalPath);
  const baseImagePath = path.join(dirName, baseNameWithoutExt); // This is the path without any extension

  try {
    // Determine preferred format based on Accept header
    const acceptHeader = request.headers.get('Accept') || '';
    let filePathToServe = fullOriginalPath; // Start with the original path
    let contentType = `image/${path.extname(fullOriginalPath).substring(1)}`; // Start with original content type

    // Check for AVIF
    if (acceptHeader.includes('image/avif')) {
      const avifPath = `${baseImagePath}.avif`; // Use baseImagePath
      try {
        await fs.access(avifPath);
        filePathToServe = avifPath;
        contentType = 'image/avif';
      } catch (e) {
        void e;
        // AVIF not found, fall back to WebP or original
      }
    }

    // Check for WebP if AVIF not found or not accepted
    if (contentType !== 'image/avif' && acceptHeader.includes('image/webp')) {
      const webpPath = `${baseImagePath}.webp`; // Use baseImagePath
      try {
        await fs.access(webpPath);
        filePathToServe = webpPath;
        contentType = 'image/webp';
      } catch (e) {
        void e;
        // WebP not found, fall back to original
      }
    }

    const imageBuffer = await fs.readFile(filePathToServe);

    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Cache-Control', 'public, max-age=31536000, immutable'); // Cache for a year

    // Convert Buffer to ReadableStream for NextResponse
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(imageBuffer);
        controller.close();
      },
    });

    return new NextResponse(stream, { headers });
  } catch (error: unknown) {
    // Type guard to check if error is an object with a 'code' property
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
