import 'server-only';

import { CACHE_TAGS } from '@/lib/cacheTags';
import {
  getAffectedGameDataNames,
  getGameDataDetailHref,
} from '@/lib/gameData/contributionDisplay';
import { GAME_DATA_CONTRIBUTION_FILTER } from '@/lib/gameData/contributionFilter';
import { getGameDataEntityLabel } from '@/lib/gameData/presentation';
import {
  PENDING_GAME_DATA_ACTIONS_CACHE_TAG,
  PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG,
} from '@/lib/gameData/publicActionsCache';
import { cached, MAX_SERVER_CACHE_REVALIDATE_SECONDS } from '@/lib/serverCache';
import { getOptionalSupabaseAdminClient } from '@/lib/supabase/adminClient';
import { getUserSubmissionHref } from '@/lib/users/profileRoutes';

const RECENT_CONTRIBUTION_LIMIT = 10;
const PUBLIC_USER_CACHE_REVALIDATE_SECONDS = MAX_SERVER_CACHE_REVALIDATE_SECONDS;
const REVIEWED_GAME_DATA_ACTION_STATUSES = ['approved', 'rejected', 'synced', 'revoked'] as const;
const APPROVED_GAME_DATA_ACTION_STATUSES = ['approved', 'synced'] as const;

export type PublicContribution = {
  id: string;
  kind: 'article' | 'gameData';
  title: string;
  description: string | null;
  href: string | null;
  createdAt: string;
};

export type PublicUserProfile = {
  id: string;
  nickname: string;
  groups: string[];
  registeredAt: string;
  reviewCount: number;
  contributionTotals: {
    articles: number;
    gameData: number;
    all: number;
  };
  recentContributions: PublicContribution[];
};

async function queryPublicUserNickname(userId: string): Promise<string | null> {
  const supabaseAdmin = getOptionalSupabaseAdminClient();
  if (!supabaseAdmin) return null;

  const { data, error } = await supabaseAdmin
    .from('users_public_view')
    .select('nickname')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data?.nickname ?? null;
}

export async function getPublicUserNickname(userId: string): Promise<string | null> {
  return cached(['public-user-nickname-v1', userId], () => queryPublicUserNickname(userId), {
    revalidate: PUBLIC_USER_CACHE_REVALIDATE_SECONDS,
    tags: [CACHE_TAGS.users],
  });
}

export async function getPublicUserSubmissionHref(
  userId: string,
  highlight?: string | null
): Promise<string | null> {
  const nickname = await getPublicUserNickname(userId);
  return nickname ? getUserSubmissionHref(nickname, highlight) : null;
}

type ArticleContributionRow = {
  id: string;
  article_id: string;
  commit_message: string | null;
  created_at: string;
  articles: { title: string } | null;
};

type GameDataContributionRow = {
  id: string;
  entity_type: string;
  entry?: unknown;
  message: string | null;
  created_at: string;
};

export function mergeRecentContributions(
  articleRows: ArticleContributionRow[],
  gameDataRows: GameDataContributionRow[],
  limit = RECENT_CONTRIBUTION_LIMIT
): PublicContribution[] {
  const articles: PublicContribution[] = articleRows.map((row) => ({
    id: row.id,
    kind: 'article',
    title: `编辑《${row.articles?.title ?? '未知文章'}》`,
    description: row.commit_message,
    href: `/articles/${row.article_id}/history`,
    createdAt: row.created_at,
  }));
  const gameData: PublicContribution[] = gameDataRows.map((row) => {
    const names = getAffectedGameDataNames(row.entity_type, row.entry);
    const namesLabel =
      names.length > 0
        ? `：${names
            .slice(0, 3)
            .map(({ name }) => name)
            .join('、')}`
        : '';
    const overflowLabel = names.length > 3 ? ` 等 ${names.length} 项` : '';

    return {
      id: row.id,
      kind: 'gameData',
      title: `更新${getGameDataEntityLabel(row.entity_type, '游戏数据')}${namesLabel}${overflowLabel}`,
      description: row.message,
      href: getGameDataDetailHref(row.entity_type, names[0]),
      createdAt: row.created_at,
    };
  });

  return [...articles, ...gameData]
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
    .slice(0, limit);
}

export async function getGameDataActionApprovalRate(userId: string): Promise<number | null> {
  const supabaseAdmin = getOptionalSupabaseAdminClient();
  if (!supabaseAdmin) return null;

  const [approvedResult, reviewedResult] = await Promise.all([
    supabaseAdmin
      .from('game_data_actions')
      .select('id', { count: 'exact', head: true })
      .eq('created_by', userId)
      .in('status', APPROVED_GAME_DATA_ACTION_STATUSES),
    supabaseAdmin
      .from('game_data_actions')
      .select('id', { count: 'exact', head: true })
      .eq('created_by', userId)
      .in('status', REVIEWED_GAME_DATA_ACTION_STATUSES),
  ]);

  if (approvedResult.error) throw approvedResult.error;
  if (reviewedResult.error) throw reviewedResult.error;

  const reviewedCount = reviewedResult.count ?? 0;
  if (reviewedCount === 0) return null;

  return (approvedResult.count ?? 0) / reviewedCount;
}

export async function getCachedGameDataActionApprovalRate(userId: string): Promise<number | null> {
  return cached(
    ['public-user-game-data-approval-rate-v1', userId],
    () => getGameDataActionApprovalRate(userId),
    {
      revalidate: PUBLIC_USER_CACHE_REVALIDATE_SECONDS,
      tags: [PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG, PENDING_GAME_DATA_ACTIONS_CACHE_TAG],
    }
  );
}

export async function getPublicUserProfile(nickname: string): Promise<PublicUserProfile | null> {
  const supabaseAdmin = getOptionalSupabaseAdminClient();
  if (!supabaseAdmin) return null;

  const { data: userRow, error: userError } = await supabaseAdmin
    .from('users')
    .select('id, nickname')
    .eq('nickname', nickname)
    .maybeSingle();

  if (userError) throw userError;
  if (!userRow) return null;

  const userId = userRow.id;

  const [
    authResult,
    membershipsResult,
    articleCountResult,
    gameDataCountResult,
    reviewCountResult,
    articleRowsResult,
    gameDataRowsResult,
  ] = await Promise.all([
    supabaseAdmin.auth.admin.getUserById(userId),
    supabaseAdmin.from('user_group_memberships').select('group_id').eq('user_id', userId),
    supabaseAdmin
      .from('article_versions')
      .select('id', { count: 'exact', head: true })
      .eq('editor_id', userId)
      .eq('status', 'approved'),
    supabaseAdmin
      .from('game_data_actions')
      .select('id', { count: 'exact', head: true })
      .eq('created_by', userId)
      .or(GAME_DATA_CONTRIBUTION_FILTER),
    supabaseAdmin
      .from('game_data_actions')
      .select('id', { count: 'exact', head: true })
      .eq('reviewed_by', userId)
      .neq('created_by', userId)
      .not('reviewed_at', 'is', null),
    supabaseAdmin
      .from('article_versions')
      .select(
        'id, article_id, commit_message, created_at, articles!article_versions_article_id_fkey(title)'
      )
      .eq('editor_id', userId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(RECENT_CONTRIBUTION_LIMIT),
    supabaseAdmin
      .from('game_data_actions')
      .select('id, entity_type, entry, message, created_at')
      .eq('created_by', userId)
      .or(GAME_DATA_CONTRIBUTION_FILTER)
      .order('created_at', { ascending: false })
      .limit(RECENT_CONTRIBUTION_LIMIT),
  ]);

  if (authResult.error) throw authResult.error;
  if (!authResult.data.user) return null;

  const databaseErrors = [
    membershipsResult.error,
    articleCountResult.error,
    gameDataCountResult.error,
    reviewCountResult.error,
    articleRowsResult.error,
    gameDataRowsResult.error,
  ].filter((error) => error !== null);
  if (databaseErrors[0]) throw databaseErrors[0];

  const groupIds = (membershipsResult.data ?? []).map((membership) => membership.group_id);
  let groups: string[] = [];
  if (groupIds.length > 0) {
    const { data, error } = await supabaseAdmin
      .from('user_groups')
      .select('name')
      .in('id', groupIds)
      .order('name');
    if (error) throw error;
    groups = data.map((group) => group.name);
  }

  const articleTotal = articleCountResult.count ?? 0;
  const gameDataTotal = gameDataCountResult.count ?? 0;

  return {
    id: userRow.id,
    nickname: userRow.nickname,
    groups,
    registeredAt: authResult.data.user.created_at,
    reviewCount: reviewCountResult.count ?? 0,
    contributionTotals: {
      articles: articleTotal,
      gameData: gameDataTotal,
      all: articleTotal + gameDataTotal,
    },
    recentContributions: mergeRecentContributions(
      articleRowsResult.data ?? [],
      gameDataRowsResult.data ?? []
    ),
  };
}

export async function getCachedPublicUserProfile(
  nickname: string
): Promise<PublicUserProfile | null> {
  return cached(['public-user-profile-v1', nickname], () => getPublicUserProfile(nickname), {
    revalidate: PUBLIC_USER_CACHE_REVALIDATE_SECONDS,
    tags: [
      CACHE_TAGS.users,
      CACHE_TAGS.articles,
      PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG,
      PENDING_GAME_DATA_ACTIONS_CACHE_TAG,
    ],
  });
}
