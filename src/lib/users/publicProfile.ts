import 'server-only';

import { hasSupabaseAdminConfig, supabaseAdmin } from '@/lib/supabase/admin';

const RECENT_CONTRIBUTION_LIMIT = 10;

const GAME_DATA_LABELS: Record<string, string> = {
  achievements: '成就',
  buffs: '增益与减益',
  cards: '知识卡',
  characters: '角色',
  entities: '场景物件',
  fixtures: '地图设施',
  items: '道具',
  maps: '地图',
  modes: '游戏模式',
  specialSkills: '特技',
};

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
  const gameData: PublicContribution[] = gameDataRows.map((row) => ({
    id: row.id,
    kind: 'gameData',
    title: `更新${GAME_DATA_LABELS[row.entity_type] ?? '游戏数据'}`,
    description: row.message,
    href: null,
    createdAt: row.created_at,
  }));

  return [...articles, ...gameData]
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
    .slice(0, limit);
}

export async function getPublicUserProfile(userId: string): Promise<PublicUserProfile | null> {
  if (!hasSupabaseAdminConfig()) return null;

  const { data: userRow, error: userError } = await supabaseAdmin
    .from('users')
    .select('id, nickname')
    .eq('id', userId)
    .maybeSingle();

  if (userError) throw userError;
  if (!userRow) return null;

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
      .in('status', ['approved', 'synced'])
      .eq('is_public', true),
    supabaseAdmin
      .from('game_data_actions')
      .select('id', { count: 'exact', head: true })
      .eq('reviewed_by', userId)
      .neq('created_by', userId)
      .not('reviewed_at', 'is', null),
    supabaseAdmin
      .from('article_versions')
      .select('id, article_id, commit_message, created_at, articles(title)')
      .eq('editor_id', userId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(RECENT_CONTRIBUTION_LIMIT),
    supabaseAdmin
      .from('game_data_actions')
      .select('id, entity_type, message, created_at')
      .eq('created_by', userId)
      .in('status', ['approved', 'synced'])
      .eq('is_public', true)
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
