import { NextResponse } from 'next/server';
import { z } from 'zod';

import { canAccess, canAccessAny } from '@/lib/auth/permissions';
import { requirePermission } from '@/lib/auth/requirePermission';
import { getGameActionResourceContexts } from '@/lib/auth/resourceContexts';
import { getGameDataNotificationDetails } from '@/lib/gameData/contributionDisplay';
import { publishNotification } from '@/lib/notificationUtils';
import { requireSupabaseAdminClient } from '@/lib/supabase/adminClient';
import { getPublicUserSubmissionHref } from '@/lib/users/publicProfile';

const idSchema = z.uuid();
const bodySchema = z.object({
  message: z.string().trim().min(1).max(500),
});

type ThankTarget = {
  recipientUserId: string;
  contributionLabel: string;
};

const getReviewerNickname = async (reviewerId: string): Promise<string | null> => {
  const { data, error } = await requireSupabaseAdminClient()
    .from('users_public_view')
    .select('nickname')
    .eq('id', reviewerId)
    .maybeSingle();
  if (error) throw error;
  return data?.nickname ?? null;
};

export async function POST(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ kind: string; contributionId: string }>;
  }
) {
  const { kind, contributionId: rawContributionId } = await params;
  const contributionId = idSchema.safeParse(rawContributionId);
  if (!contributionId.success || (kind !== 'article' && kind !== 'game-data')) {
    return NextResponse.json({ error: 'Invalid contribution' }, { status: 400 });
  }
  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: '感谢内容不能为空，且不能超过500字' }, { status: 400 });
  }

  let target: ThankTarget;
  let reviewerId: string;

  if (kind === 'article') {
    const guard = await requirePermission('article_version.approve', undefined, 'all', {
      request,
      blockAction: 'edit',
    });
    if ('error' in guard) return guard.error;
    reviewerId = guard.userId;

    const { data: version, error } = await requireSupabaseAdminClient()
      .from('article_versions')
      .select(
        'article_id, editor_id, proposed_category_id, proposed_title, status, articles!article_versions_article_id_fkey(title, category_id)'
      )
      .eq('id', contributionId.data)
      .maybeSingle();

    if (error) {
      console.error('Failed to load article contribution for thanks:', error);
      return NextResponse.json({ error: 'Failed to load contribution' }, { status: 500 });
    }
    if (!version) {
      return NextResponse.json({ error: 'Contribution not found' }, { status: 404 });
    }
    if (version.status !== 'approved') {
      return NextResponse.json(
        { error: 'Only approved contributions can be thanked' },
        { status: 409 }
      );
    }

    const currentCategoryId = version.articles?.category_id;
    const canApproveCurrent = canAccessAny(guard.grants, 'article_version.approve', [
      { resourceType: 'articles', resourceId: version.article_id },
      ...(currentCategoryId ? [{ resourceType: 'categories', resourceId: currentCategoryId }] : []),
    ]);
    const canApproveProposed =
      !version.proposed_category_id ||
      version.proposed_category_id === currentCategoryId ||
      canAccess(guard.grants, 'article_version.approve', {
        resourceType: 'categories',
        resourceId: version.proposed_category_id,
      });
    if (!canApproveCurrent || !canApproveProposed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    target = {
      recipientUserId: version.editor_id,
      contributionLabel: `文章《${version.proposed_title ?? version.articles?.title ?? '文章'}》`,
    };
  } else {
    const initialGuard = await requirePermission('game_data_action.approve', undefined, 'all', {
      request,
      blockAction: 'edit',
    });
    if ('error' in initialGuard) return initialGuard.error;
    reviewerId = initialGuard.userId;

    const { data: action, error } = await requireSupabaseAdminClient()
      .from('game_data_actions')
      .select('created_by, entity_type, entry, status')
      .eq('id', contributionId.data)
      .maybeSingle();

    if (error) {
      console.error('Failed to load game-data contribution for thanks:', error);
      return NextResponse.json({ error: 'Failed to load contribution' }, { status: 500 });
    }
    if (!action) {
      return NextResponse.json({ error: 'Contribution not found' }, { status: 404 });
    }
    if (action.status !== 'approved' && action.status !== 'synced') {
      return NextResponse.json(
        { error: 'Only approved contributions can be thanked' },
        { status: 409 }
      );
    }

    const resourceGuard = await requirePermission(
      'game_data_action.approve',
      getGameActionResourceContexts(action.entity_type, [action.entry]),
      'all',
      { request, blockAction: 'edit' }
    );
    if ('error' in resourceGuard) return resourceGuard.error;
    if (!action.created_by) {
      return NextResponse.json(
        { error: 'Anonymous contributions cannot receive notifications' },
        { status: 409 }
      );
    }

    target = {
      recipientUserId: action.created_by,
      contributionLabel: getGameDataNotificationDetails([action]).summary,
    };
  }

  if (target.recipientUserId === reviewerId) {
    return NextResponse.json({ error: 'You cannot thank your own contribution' }, { status: 409 });
  }

  try {
    let contributionHref: string | undefined;
    try {
      contributionHref =
        (await getPublicUserSubmissionHref(target.recipientUserId, contributionId.data)) ??
        undefined;
    } catch (error) {
      console.error('Failed to build contribution profile link:', error);
    }
    const reviewerNickname = await getReviewerNickname(reviewerId);
    const result = await publishNotification({
      recipientUserId: target.recipientUserId,
      kind: 'contribution_thanked',
      decisionOrigin: 'manual',
      title: '收到贡献感谢',
      body: `${reviewerNickname ? `审核者 ${reviewerNickname}` : '审核者'}感谢了您对${target.contributionLabel}的贡献：\n${body.data.message}`,
      ...(contributionHref ? { href: contributionHref } : {}),
      sourceIds: [contributionId.data],
      dedupeKey: `contribution-thanked:${kind}:${contributionId.data}`,
    });

    return NextResponse.json({
      created: result.created,
      message: result.created ? 'Thanks sent' : 'Contribution was already thanked',
    });
  } catch (error) {
    console.error('Failed to thank contribution:', error);
    return NextResponse.json({ error: 'Failed to send thanks' }, { status: 500 });
  }
}
