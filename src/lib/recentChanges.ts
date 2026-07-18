import 'server-only';

import type { Route } from 'next';

import { CACHE_TAGS } from '@/lib/cacheTags';
import { flattenActionEntries, normalizePublicActionEntries } from '@/lib/gameData/actionEntries';
import { PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG } from '@/lib/gameData/publicActionsCache';
import { cached } from '@/lib/serverCache';
import { hasSupabaseAdminConfig, supabaseAdmin } from '@/lib/supabase/admin';
import { hasSupabasePublicConfig } from '@/lib/supabase/config';
import { supabaseServerPublic } from '@/lib/supabase/public';

export const RECENT_CHANGES_PAGE_SIZE = 20;
export const RECENT_CHANGES_MAX_ITEMS = 100;

export type RecentChangesFilter = 'all' | 'articles' | 'game-data';

export type RecentChange = {
  id: string;
  kind: 'article' | 'gameData';
  title: string;
  description: string | null;
  href: Route | null;
  createdAt: string;
  editor: { id: string; nickname: string } | null;
};

export type RecentChangesPage = {
  changes: RecentChange[];
  currentPage: number;
  totalItems: number;
  totalPages: number;
};

type ArticleChangeRow = {
  id: string;
  article_id: string;
  commit_message: string | null;
  created_at: string;
  editor_id: string | null;
  articles: { title: string } | null;
  users: { nickname: string } | null;
};

type GameDataChangeRow = {
  id: string;
  entity_type: string;
  entry: unknown;
  message: string | null;
  created_at: string;
  created_by: string | null;
  users: { nickname: string } | null;
};

const GAME_DATA_LABELS: Record<string, string> = {
  achievements: '成就',
  buffs: '状态',
  cards: '知识卡',
  characters: '角色',
  entities: '衍生物',
  fixtures: '地图组件',
  items: '道具',
  maps: '地图',
  modes: '游戏模式',
  specialSkills: '特技',
};

const GAME_DATA_ROUTES: Record<string, string> = {
  buffs: '/buffs',
  cards: '/cards',
  characters: '/characters',
  entities: '/entities',
  fixtures: '/fixtures',
  items: '/items',
  maps: '/maps',
  modes: '/modes',
};

export function normalizeRecentChangesFilter(value: string | undefined): RecentChangesFilter {
  return value === 'articles' || value === 'game-data' ? value : 'all';
}

export function normalizeRecentChangesPage(value: string | undefined): number {
  const page = Number.parseInt(value ?? '', 10);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

function extractAffectedNames(row: GameDataChangeRow): string[] {
  const entries = normalizePublicActionEntries(row.entry);
  const names = new Set<string>();

  for (const action of flattenActionEntries(entries)) {
    const parts = action.path.split('.').filter(Boolean);
    const name = row.entity_type === 'specialSkills' ? parts[1] : parts[0];
    if (name) names.add(name);
  }

  return [...names];
}

function gameDataHref(entityType: string, names: string[]): Route | null {
  const route = GAME_DATA_ROUTES[entityType];
  const name = names[0];
  return route && name ? (`${route}/${encodeURIComponent(name)}` as Route) : null;
}

export function mapArticleChange(row: ArticleChangeRow): RecentChange {
  return {
    id: row.id,
    kind: 'article',
    title: `编辑《${row.articles?.title ?? '未知文章'}》`,
    description: row.commit_message,
    href: `/articles/${row.article_id}/history` as Route,
    createdAt: row.created_at,
    editor: row.editor_id && row.users ? { id: row.editor_id, nickname: row.users.nickname } : null,
  };
}

export function mapGameDataChange(row: GameDataChangeRow): RecentChange {
  const names = extractAffectedNames(row);
  const label = GAME_DATA_LABELS[row.entity_type] ?? '游戏数据';
  const namesLabel = names.length > 0 ? `：${names.slice(0, 3).join('、')}` : '';
  const overflowLabel = names.length > 3 ? ` 等 ${names.length} 项` : '';

  return {
    id: row.id,
    kind: 'gameData',
    title: `更新${label}${namesLabel}${overflowLabel}`,
    description: row.message,
    href: gameDataHref(row.entity_type, names),
    createdAt: row.created_at,
    editor:
      row.created_by && row.users ? { id: row.created_by, nickname: row.users.nickname } : null,
  };
}

export function mergeRecentChangeRows(
  articleRows: ArticleChangeRow[],
  gameDataRows: GameDataChangeRow[],
  offset: number,
  limit: number
): RecentChange[] {
  return [...articleRows.map(mapArticleChange), ...gameDataRows.map(mapGameDataChange)]
    .sort((left, right) => {
      const timeDifference = Date.parse(right.createdAt) - Date.parse(left.createdAt);
      return timeDifference || right.id.localeCompare(left.id);
    })
    .slice(offset, offset + limit);
}

async function countArticleChanges(): Promise<number> {
  const { count, error } = await supabaseServerPublic
    .from('article_versions_public_view')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'approved');
  if (error) throw error;
  return count ?? 0;
}

async function countGameDataChanges(): Promise<number> {
  const { count, error } = await supabaseServerPublic
    .from('game_data_actions')
    .select('id', { count: 'exact', head: true })
    .eq('is_public', true)
    .in('status', ['approved', 'synced']);
  if (error) throw error;
  return count ?? 0;
}

async function queryArticleChanges(from: number, to: number): Promise<ArticleChangeRow[]> {
  const { data, error } = await supabaseServerPublic
    .from('article_versions_public_view')
    .select('id, article_id, commit_message, created_at, editor_id, articles(title)')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .range(from, to);
  if (error) throw error;
  return (data ?? []) as unknown as ArticleChangeRow[];
}

async function queryGameDataChanges(from: number, to: number): Promise<GameDataChangeRow[]> {
  const { data, error } = await supabaseServerPublic
    .from('game_data_actions')
    .select('id, entity_type, entry, message, created_at, created_by')
    .eq('is_public', true)
    .in('status', ['approved', 'synced'])
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .range(from, to);
  if (error) throw error;
  return (data ?? []) as unknown as GameDataChangeRow[];
}

async function attachPublicUserNames(
  articleRows: ArticleChangeRow[],
  gameDataRows: GameDataChangeRow[]
): Promise<void> {
  if (!hasSupabaseAdminConfig()) return;

  const userIds = [
    ...articleRows.map((row) => row.editor_id),
    ...gameDataRows.map((row) => row.created_by),
  ].filter((id): id is string => id !== null);
  const uniqueUserIds = [...new Set(userIds)];
  if (uniqueUserIds.length === 0) return;

  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, nickname')
    .in('id', uniqueUserIds);

  if (error) {
    console.error('Failed to load recent-change editors:', error);
    return;
  }

  const nicknames = new Map((data ?? []).map((user) => [user.id, user.nickname]));
  for (const row of articleRows) {
    const nickname = row.editor_id ? nicknames.get(row.editor_id) : undefined;
    row.users = nickname ? { nickname } : null;
  }
  for (const row of gameDataRows) {
    const nickname = row.created_by ? nicknames.get(row.created_by) : undefined;
    row.users = nickname ? { nickname } : null;
  }
}

async function loadRecentChanges(
  filter: RecentChangesFilter,
  requestedPage: number
): Promise<RecentChangesPage> {
  const includeArticles = filter !== 'game-data';
  const includeGameData = filter !== 'articles';
  const [articleTotal, gameDataTotal] = await Promise.all([
    includeArticles ? countArticleChanges() : Promise.resolve(0),
    includeGameData ? countGameDataChanges() : Promise.resolve(0),
  ]);
  const totalItems = Math.min(articleTotal + gameDataTotal, RECENT_CHANGES_MAX_ITEMS);
  const totalPages = Math.max(1, Math.ceil(totalItems / RECENT_CHANGES_PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);
  const offset = (currentPage - 1) * RECENT_CHANGES_PAGE_SIZE;

  // For a unified feed, either source can occupy any position in the requested
  // window, so fetch each source through the window end before merging.
  const sourceFrom = filter === 'all' ? 0 : offset;
  const sourceTo = Math.min(offset + RECENT_CHANGES_PAGE_SIZE - 1, RECENT_CHANGES_MAX_ITEMS - 1);
  const [articleRows, gameDataRows] = await Promise.all([
    includeArticles && articleTotal > 0
      ? queryArticleChanges(sourceFrom, sourceTo)
      : Promise.resolve([]),
    includeGameData && gameDataTotal > 0
      ? queryGameDataChanges(sourceFrom, sourceTo)
      : Promise.resolve([]),
  ]);
  await attachPublicUserNames(articleRows, gameDataRows);

  return {
    changes: mergeRecentChangeRows(
      articleRows,
      gameDataRows,
      filter === 'all' ? offset : 0,
      RECENT_CHANGES_PAGE_SIZE
    ),
    currentPage,
    totalItems,
    totalPages,
  };
}

export async function getRecentChanges(
  filter: RecentChangesFilter,
  page: number
): Promise<RecentChangesPage> {
  if (!hasSupabasePublicConfig()) {
    return { changes: [], currentPage: 1, totalItems: 0, totalPages: 1 };
  }

  try {
    return await cached(
      ['recent-changes-v3', filter, String(page)],
      () => loadRecentChanges(filter, page),
      {
        revalidate: 300,
        tags: [CACHE_TAGS.articles, PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG],
      }
    );
  } catch (error) {
    console.error('Failed to load recent changes:', error);
    return { changes: [], currentPage: 1, totalItems: 0, totalPages: 1 };
  }
}
