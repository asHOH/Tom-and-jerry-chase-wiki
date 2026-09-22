import 'server-only';

import { NextResponse } from 'next/server';

import { PublishPreparationError } from './publishPreparation';

export type PublishRouteName =
  '/api/game-data-actions/publish' | '/api/game-data-actions/publish-relations';

export function publishPreparationErrorResponse(error: PublishPreparationError): NextResponse {
  return NextResponse.json(
    { error: error.detail.code },
    { status: error.detail.code === 'request_too_large' ? 413 : 400 }
  );
}
