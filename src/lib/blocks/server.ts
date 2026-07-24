import 'server-only';

import { NextResponse } from 'next/server';

import { getActiveBlock } from './check';
import { type BlockAction, type BlockInfo, type BlockResourceContext } from './types';

export {
  getActiveBlock,
  getRequestIp,
  getUserBlockSummary,
  normalizeIp,
  recordUserIp,
} from './check';

export const blockedResponse = (block: BlockInfo): NextResponse =>
  NextResponse.json(
    {
      error: 'blocked',
      action: block.action,
      block: {
        id: block.id,
        reason: block.reason,
        expiresAt: block.expiresAt,
        isAutoblock: block.isAutoblock,
      },
    },
    { status: 403 }
  );

export const requireNotBlocked = async ({
  request,
  userId,
  action,
  contexts,
}: {
  request?: Request | undefined;
  userId: string | null;
  action: BlockAction;
  contexts?: readonly BlockResourceContext[] | undefined;
}): Promise<NextResponse | null> => {
  const block = await getActiveBlock({ request, userId, action, contexts });
  return block ? blockedResponse(block) : null;
};
