import 'server-only';

import { createHash } from 'node:crypto';

import { resolveArticleCharacterForWrite } from '@/lib/articles/articleWriteRelations';
import {
  ArticleRefreshRequiredError,
  ArticleVersionConflictError,
} from '@/lib/articles/versionConflict';
import { readPublishOperationId } from '@/lib/gameData/publishOperation';
import { requireSupabaseAdminClient } from '@/lib/supabase/adminClient';
import type { Database } from '@/data/database.generated';

type ArticleWrite = {
  title: string;
  category: string;
  content: string;
  character_id: string | null;
  commit_message?: string;
  base_version_id?: string | null | undefined;
  pending_version_id?: string | null | undefined;
  pending_revision?: string | null | undefined;
  source_pending_version_id?: string | null | undefined;
};

export class ArticleRequestConflictError extends Error {
  constructor() {
    super('提交标识已用于其他内容，请先确认上次提交的结果。');
  }
}

type SubmissionResult = {
  article_id: string;
  submitted_version_id: string;
  submitted_status: Database['public']['Enums']['version_status'];
  replayed: boolean;
};

/** Owns the retry receipt and write; a retry survives changes to mutable category policy. */
export async function submitArticleRequest({
  request,
  actorId,
  ip,
  articleId = null,
  draft,
}: {
  request: Request;
  actorId: string;
  ip: string | null;
  articleId?: string | null;
  draft: ArticleWrite;
}): Promise<SubmissionResult> {
  const operationId = readPublishOperationId(request);
  const fingerprint = createHash('sha256')
    .update(JSON.stringify({ actorId, articleId, draft }))
    .digest('hex');
  const client = requireSupabaseAdminClient();
  const { data: receipt, error: readError } = await client
    .from('article_submission_requests')
    .select('actor_id, request_fingerprint, article_id, version_id, initial_status')
    .eq('operation_id', operationId)
    .maybeSingle();
  if (readError) throw readError;
  if (receipt) {
    if (receipt.actor_id !== actorId || receipt.request_fingerprint !== fingerprint)
      throw new ArticleRequestConflictError();
    if (!receipt.article_id || !receipt.version_id || !receipt.initial_status)
      throw new Error('Incomplete article submission receipt');
    return {
      article_id: receipt.article_id,
      submitted_version_id: receipt.version_id,
      submitted_status: receipt.initial_status,
      replayed: true,
    };
  }

  if (
    articleId &&
    (draft.base_version_id === undefined ||
      draft.pending_version_id === undefined ||
      draft.pending_revision === undefined ||
      draft.source_pending_version_id === undefined)
  )
    throw new ArticleRefreshRequiredError();

  const characterId = await resolveArticleCharacterForWrite({
    categoryId: draft.category,
    characterId: draft.character_id,
  });
  const { data, error } = await client.rpc('prepared_article_submission_request', {
    p_operation_id: operationId,
    p_actor_id: actorId,
    p_request_fingerprint: fingerprint,
    p_ip: ip,
    p_article_id: articleId,
    p_title: draft.title,
    p_content: draft.content,
    p_category_id: draft.category,
    p_character_id: characterId,
    p_commit_message: draft.commit_message ?? null,
    p_expected_base_version_id: draft.base_version_id ?? null,
    p_expected_pending_version_id: draft.pending_version_id ?? null,
    p_expected_pending_revision: draft.pending_revision ?? null,
    p_source_pending_version_id: draft.source_pending_version_id ?? null,
  });
  if (error?.message.includes('article_edit_conflict')) throw new ArticleVersionConflictError();
  if (error?.message.includes('idempotency_key_reused')) throw new ArticleRequestConflictError();
  if (error) throw error;
  const result = data?.[0];
  if (!result) throw new Error('Missing article submission receipt');
  return result;
}
