import 'server-only';

import { NextResponse } from 'next/server';

import { PublishPreparationError } from './publishPreparation';

const DEPENDENT_ROWS_MESSAGE =
  '这些修改存在顺序依赖，暂时无法一起提交。草稿已保留，请将请求编号提供给管理员。';

export type PublishRouteName =
  '/api/game-data-actions/publish' | '/api/game-data-actions/publish-relations';

export function publishPreparationErrorResponse(
  error: PublishPreparationError,
  route: PublishRouteName
): NextResponse {
  if (error.detail.code === 'dependent_rows') {
    const requestId = crypto.randomUUID();
    console.warn('game_data_publish_rejected', {
      event: 'dependent_rows',
      requestId,
      route,
      entityType: error.detail.entityType,
      dependencyGroups: error.detail.dependencyGroups,
      omittedDependencyGroupCount: error.detail.omittedDependencyGroupCount,
    });

    return NextResponse.json(
      {
        error: error.detail.code,
        message: DEPENDENT_ROWS_MESSAGE,
        requestId,
      },
      { status: 400 }
    );
  }

  return NextResponse.json(
    { error: error.detail.code },
    { status: error.detail.code === 'request_too_large' ? 413 : 400 }
  );
}
