import 'server-only';

import {
  getAffectedGameDataNames,
  getGameDataDetailHref,
} from '@/lib/gameData/contributionDisplay';
import {
  getOptionalSupabaseAdminClient,
  requireSupabaseAdminClient,
} from '@/lib/supabase/adminClient';
import type { Database } from '@/data/database.types';

const SHANGHAI_TIME_ZONE = 'Asia/Shanghai';
const CALENDAR_DAYS = 365;
const MAX_DATE_RANGE_DAYS = 366;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const MAX_POSTGRES_INTEGER = 2_147_483_647;

export const CONTRIBUTION_ACTIVITY_PAGE_SIZE = 20;

export type ContributionFilter = 'all' | 'articles' | 'game-data';
export type ContributionActivityFilter = ContributionFilter;

export type ContributionDateRange = {
  startDate: string;
  endDate: string;
};

export type ContributionDateRangeInput =
  | ContributionDateRange
  | {
      from: string;
      to: string;
    };

export type ContributionCalendarDay = {
  date: string;
  total: number;
  articles: number;
  gameData: number;
  count?: number;
  articleCount?: number;
  gameDataCount?: number;
};

export type ContributionCalendar = ContributionCalendarDay[];

export type ContributionCategory = {
  key: string;
  label: string;
  count: number;
};

export type ContributionBreakdownItem = {
  category: string;
  label: string;
  count: number;
};

export type ContributionBreakdown = ContributionBreakdownItem[];

export type ContributionMonth = {
  key: string;
  label: string;
  count: number;
  articleCount: number;
  gameDataCount: number;
};

export type ContributionMonthlyBucket = {
  month: string;
  count: number;
  articleCount: number;
  gameDataCount: number;
};

export type ContributionActivityKind = 'article' | 'gameData';

export type ContributionActivityItem = {
  id: string;
  kind: ContributionActivityKind;
  title: string;
  description: string | null;
  href: string | null;
  createdAt: string;
};

export type ContributionBusiestDay = {
  date: string;
  count: number;
};

export type ContributionMetrics = {
  total: number;
  activeDays: number;
  currentStreak: number;
  longestStreak: number;
  averagePerActiveDay: number;
  busiestDay: ContributionBusiestDay | null;
  monthlyBuckets: ContributionMonthlyBucket[];
};

export type ContributionActivityPage = {
  items: ContributionActivityItem[];
  currentPage: number;
  totalItems: number;
  totalPages: number;
};

type ContributionCalendarRpcRow =
  Database['public']['Functions']['get_public_contribution_calendar']['Returns'][number];
type ContributionBreakdownRpcRow =
  Database['public']['Functions']['get_public_contribution_breakdown']['Returns'][number];
type ContributionActivityRpcRow =
  Database['public']['Functions']['get_public_contribution_activity']['Returns'][number];

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
  traits: '特性',
};

const CONTRIBUTION_CATEGORY_LABELS: Record<string, string> = {
  article: '文章',
  ...GAME_DATA_LABELS,
};

function getShanghaiDate(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: SHANGHAI_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  if (!year || !month || !day) {
    throw new Error('Unable to determine the Shanghai calendar date');
  }

  return `${year}-${month}-${day}`;
}

function dateOnlyToEpoch(date: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;

  const epoch = Date.parse(`${date}T00:00:00.000Z`);
  if (!Number.isFinite(epoch)) return null;

  const parsed = new Date(epoch);
  const normalized = [
    parsed.getUTCFullYear().toString().padStart(4, '0'),
    (parsed.getUTCMonth() + 1).toString().padStart(2, '0'),
    parsed.getUTCDate().toString().padStart(2, '0'),
  ].join('-');

  return normalized === date ? epoch : null;
}

function epochToDateOnly(epoch: number): string {
  const date = new Date(epoch);
  return [
    date.getUTCFullYear().toString().padStart(4, '0'),
    (date.getUTCMonth() + 1).toString().padStart(2, '0'),
    date.getUTCDate().toString().padStart(2, '0'),
  ].join('-');
}

function shiftDateOnly(date: string, days: number): string {
  const epoch = dateOnlyToEpoch(date);
  if (epoch === null) throw new RangeError(`Invalid calendar date: ${date}`);

  const shifted = new Date(epoch);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return epochToDateOnly(shifted.getTime());
}

function resolveDateRange(range: ContributionDateRangeInput): ContributionDateRange {
  const startDate = 'startDate' in range ? range.startDate : range.from;
  const endDate = 'startDate' in range ? range.endDate : range.to;
  const startEpoch = dateOnlyToEpoch(startDate);
  const endEpoch = dateOnlyToEpoch(endDate);

  if (startEpoch === null || endEpoch === null) {
    throw new RangeError('Contribution dates must use the YYYY-MM-DD format');
  }

  const dayDifference = (endEpoch - startEpoch) / MILLISECONDS_PER_DAY;
  if (dayDifference < 0 || dayDifference >= MAX_DATE_RANGE_DAYS) {
    throw new RangeError('Contribution date range must contain at most 366 calendar days');
  }

  return { startDate, endDate };
}

function getDateSequence(range: ContributionDateRange): string[] {
  const startEpoch = dateOnlyToEpoch(range.startDate);
  const endEpoch = dateOnlyToEpoch(range.endDate);
  if (startEpoch === null || endEpoch === null) {
    throw new RangeError('Contribution dates must use the YYYY-MM-DD format');
  }

  const dates: string[] = [];
  for (
    let currentEpoch = startEpoch;
    currentEpoch <= endEpoch;
    currentEpoch += MILLISECONDS_PER_DAY
  ) {
    dates.push(epochToDateOnly(currentEpoch));
  }
  return dates;
}

function toCount(value: number | string | null | undefined): number {
  const count = typeof value === 'number' ? value : Number(value ?? 0);
  return Number.isFinite(count) ? Math.max(0, Math.trunc(count)) : 0;
}

function emptyContributionActivityPage(): ContributionActivityPage {
  return {
    items: [],
    currentPage: 1,
    totalItems: 0,
    totalPages: 1,
  };
}

function getCategoryLabel(category: string): string {
  return CONTRIBUTION_CATEGORY_LABELS[category] ?? '游戏数据';
}

function mapCalendarRow(row: ContributionCalendarRpcRow): ContributionCalendarDay {
  const articleCount = toCount(row.article_count);
  const gameDataCount = toCount(row.game_data_count);
  const rowTotal = toCount(row.total_count);

  return {
    date: row.activity_date,
    total: articleCount + gameDataCount || rowTotal,
    articles: articleCount,
    gameData: gameDataCount,
  };
}

function mapArticleActivity(row: ContributionActivityRpcRow): ContributionActivityItem {
  return {
    id: row.id,
    kind: 'article',
    title: `编辑《${row.article_title ?? '未知文章'}》`,
    description: row.description,
    href: row.article_id ? `/articles/${encodeURIComponent(row.article_id)}/history` : null,
    createdAt: row.created_at,
  };
}

function mapGameDataActivity(row: ContributionActivityRpcRow): ContributionActivityItem {
  const entityType = row.entity_type ?? '';
  const names = getAffectedGameDataNames(entityType, row.entry);
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
    title: `更新${GAME_DATA_LABELS[entityType] ?? '游戏数据'}${namesLabel}${overflowLabel}`,
    description: row.description,
    href: getGameDataDetailHref(entityType, names[0]),
    createdAt: row.created_at,
  };
}

function mapActivityRow(row: ContributionActivityRpcRow): ContributionActivityItem {
  return row.kind === 'article' ? mapArticleActivity(row) : mapGameDataActivity(row);
}

function normalizeMetricDays(days: readonly ContributionCalendarDay[]): ContributionCalendarDay[] {
  return days
    .filter((day) => dateOnlyToEpoch(day.date) !== null)
    .map((day) => {
      const articles = toCount(day.articles ?? day.articleCount);
      const gameData = toCount(day.gameData ?? day.gameDataCount);
      const total = toCount(day.total ?? day.count) || articles + gameData;

      return { date: day.date, articles, gameData, total };
    })
    .sort((left, right) => left.date.localeCompare(right.date));
}

function calculateLongestStreak(days: readonly ContributionCalendarDay[]): number {
  let longestStreak = 0;
  let currentStreak = 0;
  let previousDate: string | null = null;

  for (const day of days) {
    const isConsecutive =
      previousDate !== null &&
      dateOnlyToEpoch(day.date)! - dateOnlyToEpoch(previousDate)! === MILLISECONDS_PER_DAY;

    if (day.total > 0 && isConsecutive) {
      currentStreak += 1;
    } else if (day.total > 0) {
      currentStreak = 1;
    } else {
      currentStreak = 0;
    }

    longestStreak = Math.max(longestStreak, currentStreak);
    previousDate = day.date;
  }

  return longestStreak;
}

function calculateCurrentStreak(days: readonly ContributionCalendarDay[]): number {
  const lastDay = days.at(-1);
  if (!lastDay) return 0;

  const daysByDate = new Map(days.map((day) => [day.date, day]));
  const anchorDate = lastDay.total > 0 ? lastDay.date : shiftDateOnly(lastDay.date, -1);
  let currentDate = anchorDate;
  let streak = 0;

  while (daysByDate.get(currentDate)?.total) {
    streak += 1;
    currentDate = shiftDateOnly(currentDate, -1);
  }

  return streak;
}

function getMonthStart(month: string): string {
  return `${month}-01`;
}

function shiftMonth(monthStart: string, months: number): string {
  const epoch = dateOnlyToEpoch(monthStart);
  if (epoch === null) throw new RangeError(`Invalid month start: ${monthStart}`);

  const date = new Date(epoch);
  date.setUTCMonth(date.getUTCMonth() + months);
  return epochToDateOnly(date.getTime()).slice(0, 7);
}

function calculateMonthlyBuckets(
  days: readonly ContributionCalendarDay[]
): ContributionMonthlyBucket[] {
  const firstDay = days[0];
  const lastDay = days.at(-1);
  if (!firstDay || !lastDay) return [];

  const buckets = new Map<string, ContributionMonthlyBucket>();
  let month = firstDay.date.slice(0, 7);
  const lastMonth = lastDay.date.slice(0, 7);

  while (month <= lastMonth) {
    buckets.set(month, {
      month,
      count: 0,
      articleCount: 0,
      gameDataCount: 0,
    });
    if (month === lastMonth) break;
    month = shiftMonth(getMonthStart(month), 1);
  }

  for (const day of days) {
    const bucket = buckets.get(day.date.slice(0, 7));
    if (!bucket) continue;
    bucket.articleCount += day.articles;
    bucket.gameDataCount += day.gameData;
    bucket.count += day.total;
  }

  return [...buckets.values()];
}

export function normalizeContributionFilter(value: string | null | undefined): ContributionFilter {
  return value === 'articles' || value === 'game-data' ? value : 'all';
}

export function normalizeContributionPage(value: string | number | null | undefined): number {
  const page = typeof value === 'number' ? value : Number.parseInt(value ?? '', 10);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

export function getContributionDateRange(now = new Date()): ContributionDateRange {
  const endDate = getShanghaiDate(now);
  return {
    startDate: shiftDateOnly(endDate, -(CALENDAR_DAYS - 1)),
    endDate,
  };
}

export async function getPublicContributionCalendar(
  userId: string,
  range: ContributionDateRangeInput
): Promise<ContributionCalendar> {
  const resolvedRange = resolveDateRange(range);
  const supabaseAdmin = getOptionalSupabaseAdminClient();
  if (!supabaseAdmin) return [];

  const { data, error } = await supabaseAdmin.rpc('get_public_contribution_calendar', {
    p_end_date: resolvedRange.endDate,
    p_start_date: resolvedRange.startDate,
    p_user_id: userId,
  });
  if (error) throw error;

  const rowsByDate = new Map((data ?? []).map((row) => [row.activity_date, mapCalendarRow(row)]));
  return getDateSequence(resolvedRange).map(
    (date) =>
      rowsByDate.get(date) ?? {
        date,
        total: 0,
        articles: 0,
        gameData: 0,
      }
  );
}

export async function getPublicContributionBreakdown(
  userId: string,
  range: ContributionDateRangeInput
): Promise<ContributionBreakdown> {
  const resolvedRange = resolveDateRange(range);
  const supabaseAdmin = getOptionalSupabaseAdminClient();
  if (!supabaseAdmin) return [];

  const { data, error } = await supabaseAdmin.rpc('get_public_contribution_breakdown', {
    p_end_date: resolvedRange.endDate,
    p_start_date: resolvedRange.startDate,
    p_user_id: userId,
  });
  if (error) throw error;

  return (data ?? []).map((row: ContributionBreakdownRpcRow) => ({
    category: row.category,
    label: getCategoryLabel(row.category),
    count: toCount(row.contribution_count),
  }));
}

function getActivityOffset(page: number): number {
  const offset = (page - 1) * CONTRIBUTION_ACTIVITY_PAGE_SIZE;
  return Number.isSafeInteger(offset)
    ? Math.min(offset, MAX_POSTGRES_INTEGER)
    : MAX_POSTGRES_INTEGER;
}

async function queryContributionActivity(
  userId: string,
  filter: ContributionFilter,
  limit: number,
  offset: number
): Promise<ContributionActivityRpcRow[]> {
  const { data, error } = await requireSupabaseAdminClient().rpc(
    'get_public_contribution_activity',
    {
      p_filter: filter,
      p_limit: limit,
      p_offset: offset,
      p_user_id: userId,
    }
  );
  if (error) throw error;
  return data ?? [];
}

export async function getPublicContributionActivity(
  userId: string,
  filter: ContributionFilter | string | null | undefined,
  requestedPage: string | number | null | undefined
): Promise<ContributionActivityPage> {
  if (!getOptionalSupabaseAdminClient()) return emptyContributionActivityPage();

  const normalizedFilter = normalizeContributionFilter(filter);
  const requestedPageNumber = normalizeContributionPage(requestedPage);
  let rows = await queryContributionActivity(
    userId,
    normalizedFilter,
    CONTRIBUTION_ACTIVITY_PAGE_SIZE,
    getActivityOffset(requestedPageNumber)
  );
  let totalItems = toCount(rows[0]?.total_count);
  let currentPage = requestedPageNumber;

  if (rows.length === 0 && requestedPageNumber > 1) {
    const firstPageRows = await queryContributionActivity(userId, normalizedFilter, 1, 0);
    totalItems = toCount(firstPageRows[0]?.total_count);
  }

  const totalPages = totalItems > 0 ? Math.ceil(totalItems / CONTRIBUTION_ACTIVITY_PAGE_SIZE) : 1;
  currentPage = Math.min(requestedPageNumber, totalPages);

  if (currentPage !== requestedPageNumber) {
    rows = await queryContributionActivity(
      userId,
      normalizedFilter,
      CONTRIBUTION_ACTIVITY_PAGE_SIZE,
      getActivityOffset(currentPage)
    );
  }

  return {
    items: rows.map(mapActivityRow),
    currentPage,
    totalItems,
    totalPages,
  };
}

export function calculateContributionMetrics(
  days: readonly ContributionCalendarDay[]
): ContributionMetrics {
  const normalizedDays = normalizeMetricDays(days);
  if (normalizedDays.length === 0) {
    return {
      total: 0,
      activeDays: 0,
      currentStreak: 0,
      longestStreak: 0,
      averagePerActiveDay: 0,
      busiestDay: null,
      monthlyBuckets: [],
    };
  }

  const total = normalizedDays.reduce((sum, day) => sum + day.total, 0);
  const activeDays = normalizedDays.filter((day) => day.total > 0).length;
  let busiestDay: ContributionBusiestDay | null = null;

  for (const day of normalizedDays) {
    if (
      day.total > 0 &&
      (busiestDay === null ||
        day.total > busiestDay.count ||
        (day.total === busiestDay.count && day.date > busiestDay.date))
    ) {
      busiestDay = { date: day.date, count: day.total };
    }
  }

  return {
    total,
    activeDays,
    currentStreak: calculateCurrentStreak(normalizedDays),
    longestStreak: calculateLongestStreak(normalizedDays),
    averagePerActiveDay: activeDays > 0 ? total / activeDays : 0,
    busiestDay,
    monthlyBuckets: calculateMonthlyBuckets(normalizedDays),
  };
}
