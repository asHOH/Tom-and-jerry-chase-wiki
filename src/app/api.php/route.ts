import { handleMediaWikiGet, handleMediaWikiOptions } from '@/lib/mediaWiki/actionApi';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return handleMediaWikiGet(request);
}

export function OPTIONS() {
  return handleMediaWikiOptions();
}
