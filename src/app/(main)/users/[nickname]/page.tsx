import { cache } from 'react';
import type { Metadata, Route } from 'next';
import { notFound } from 'next/navigation';

import type { PermissionKey } from '@/lib/auth/permissions';
import { loadPermissionGrants } from '@/lib/auth/requirePermission';
import { generatePageMetadata, getCanonicalUrl } from '@/lib/metadataUtils';
import { createClient } from '@/lib/supabase/server';
import {
  calculateContributionMetrics,
  getContributionDateRange,
  getPublicContributionActivity,
  getPublicContributionBreakdown,
  getPublicContributionCalendar,
  normalizeContributionFilter,
  normalizeContributionPage,
  type ContributionActivityFilter,
  type ContributionActivityPage,
  type ContributionBreakdown,
  type ContributionCalendar,
  type ContributionMetrics,
} from '@/lib/users/contributionActivity';
import { getGameDataActionApprovalRate, getPublicUserProfile } from '@/lib/users/publicProfile';
import { contributors, RoleType } from '@/data/contributors';
import {
  ContributionActivityHistory,
  ContributionAnalytics,
  ContributionCalendar as ContributionCalendarView,
} from '@/features/users/components';
import Card from '@/components/ui/Card';
import { InlineExternalLink } from '@/components/ui/InlineExternalLink';
import PageShell from '@/components/ui/PageShell';

export const dynamic = 'force-dynamic';

const getProfile = cache(getPublicUserProfile);
const USER_MANAGEMENT_PERMISSIONS = new Set<PermissionKey>([
  'user.read',
  'user.update',
  'group.assign',
]);

const approvalRateFormatter = new Intl.NumberFormat('zh-CN', {
  style: 'percent',
  maximumFractionDigits: 1,
});

function decodeNickname(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

const compoundPublicSuffixes = new Set(['ac', 'co', 'com', 'edu', 'gov', 'net', 'org']);

function getWebsiteName(url: string): string {
  try {
    const hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
    const hostnameParts = hostname.split('.');
    const topLevelDomain = hostnameParts.at(-1);
    const secondLevelDomain = hostnameParts.at(-2);
    const websitePart =
      topLevelDomain?.length === 2 &&
      secondLevelDomain &&
      compoundPublicSuffixes.has(secondLevelDomain)
        ? hostnameParts.at(-3)
        : secondLevelDomain;

    if (!websitePart) return '外部网站';

    return websitePart
      .split(/[-_]/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  } catch {
    return '外部网站';
  }
}

const registrationDateFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'Asia/Shanghai',
});

type PublicUserPageProps = {
  params: Promise<{ nickname: string }>;
  searchParams: Promise<{ type?: string; page?: string }>;
};

function getCharacterContributionCount(
  contributor: (typeof contributors)[number] | undefined
): number {
  if (!contributor) return 0;

  return new Set(
    contributor.roles
      .filter((role) => role.type === RoleType.ContentWriter)
      .flatMap((role) => role.characters ?? [])
  ).size;
}

function getContributorRoleLabels(
  contributor: (typeof contributors)[number] | undefined
): string[] {
  if (!contributor) return [];

  return [...new Set(contributor.roles.map(({ type }) => type))];
}

function getContributionStatsGridClassName(statCount: number): string {
  if (statCount <= 1) return 'grid grid-cols-1 gap-3 sm:grid-cols-1';
  if (statCount === 2) return 'grid grid-cols-2 gap-3 sm:grid-cols-2';
  if (statCount === 3) return 'grid grid-cols-3 gap-3 sm:grid-cols-3';
  if (statCount === 4) return 'grid grid-cols-2 gap-3 sm:grid-cols-4';
  return 'grid grid-cols-2 gap-3 sm:grid-cols-5';
}

async function canViewGameDataActionApprovalRate(): Promise<boolean> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims.sub) return false;

  const grants = await loadPermissionGrants(supabase);

  return grants.some(
    (grant) => grant.scope === 'global' && USER_MANAGEMENT_PERMISSIONS.has(grant.permission)
  );
}
function getUserActivityHref(
  nickname: string,
  filter: ContributionActivityFilter,
  page = 1
): Route {
  const searchParams = new URLSearchParams();
  if (filter !== 'all') searchParams.set('type', filter);
  if (page > 1) searchParams.set('page', String(page));
  const query = searchParams.toString();
  const pathname = `/users/${encodeURIComponent(nickname)}`;

  return (query ? `${pathname}?${query}` : pathname) as Route;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ nickname: string }>;
}): Promise<Metadata> {
  const { nickname: encodedNickname } = await params;
  const nickname = decodeNickname(encodedNickname);

  try {
    const profile = await getProfile(nickname);
    if (!profile) return {};

    return generatePageMetadata({
      title: `${profile.nickname}的用户页`,
      description: `查看${profile.nickname}在猫和老鼠手游wiki的公开贡献。`,
      canonicalUrl: getCanonicalUrl(`/users/${encodeURIComponent(nickname)}`),
    });
  } catch (error) {
    console.error('Failed to generate public user metadata:', error);
    return {};
  }
}

export default async function PublicUserPage({ params, searchParams }: PublicUserPageProps) {
  const { nickname: encodedNickname } = await params;
  const resolvedSearchParams = await searchParams;
  const nickname = decodeNickname(encodedNickname);
  const contributionFilter = normalizeContributionFilter(resolvedSearchParams.type);
  const requestedContributionPage = normalizeContributionPage(resolvedSearchParams.page);
  let profile;

  try {
    profile = await getProfile(nickname);
  } catch (error) {
    console.error('Failed to load public user profile:', error);
    notFound();
  }

  if (!profile) notFound();

  const contributionDateRange = getContributionDateRange();
  let contributionCalendar: ContributionCalendar = [];
  let contributionBreakdown: ContributionBreakdown = [];
  let contributionMetrics: ContributionMetrics | null = null;
  let contributionActivityPage: ContributionActivityPage | null = null;
  let calendarError = false;
  let breakdownError = false;
  let activityError = false;
  let gameDataActionApprovalRate: number | null = null;

  const [calendarResult, breakdownResult, activityResult, approvalRateResult] =
    await Promise.allSettled([
      getPublicContributionCalendar(profile.id, contributionDateRange),
      getPublicContributionBreakdown(profile.id, contributionDateRange),
      getPublicContributionActivity(profile.id, contributionFilter, requestedContributionPage),
      (async () => {
        if (!(await canViewGameDataActionApprovalRate())) return null;
        return getGameDataActionApprovalRate(profile.id);
      })(),
    ]);

  if (calendarResult.status === 'fulfilled') {
    contributionCalendar = calendarResult.value;
    contributionMetrics = calculateContributionMetrics(contributionCalendar);
  } else {
    calendarError = true;
    console.error('Failed to load public contribution calendar:', calendarResult.reason);
  }

  if (breakdownResult.status === 'fulfilled') {
    contributionBreakdown = breakdownResult.value;
  } else {
    breakdownError = true;
    console.error('Failed to load public contribution breakdown:', breakdownResult.reason);
  }

  if (activityResult.status === 'fulfilled') {
    contributionActivityPage = activityResult.value;
  } else {
    activityError = true;
    console.error('Failed to load public contribution activity:', activityResult.reason);
  }

  if (approvalRateResult.status === 'fulfilled') {
    gameDataActionApprovalRate = approvalRateResult.value;
  } else {
    console.error('Failed to load game data action approval rate:', approvalRateResult.reason);
  }

  const contributionFilterHrefs: Readonly<Record<ContributionActivityFilter, Route>> = {
    all: getUserActivityHref(profile.nickname, 'all'),
    articles: getUserActivityHref(profile.nickname, 'articles'),
    'game-data': getUserActivityHref(profile.nickname, 'game-data'),
  };
  const contributionPageHref = (page: number): Route =>
    getUserActivityHref(profile.nickname, contributionFilter, page);

  const contributor = contributors.find(({ nickname }) => nickname === profile.nickname);
  const externalWebsiteName = contributor?.url ? getWebsiteName(contributor.url) : null;
  const characterContributionCount = getCharacterContributionCount(contributor);
  const contributorRoleLabels = getContributorRoleLabels(contributor);
  const contributionStats: Array<{ label: string; value: number | string }> = [
    { label: '角色文案撰写', value: characterContributionCount },
    { label: '文章编辑', value: profile.contributionTotals.articles },
    { label: '游戏数据编辑', value: profile.contributionTotals.gameData },
    { label: '审核', value: profile.reviewCount },
  ].filter((stat) => stat.value > 0);
  if (gameDataActionApprovalRate !== null) {
    contributionStats.push({
      label: '游戏数据改动通过率',
      value: approvalRateFormatter.format(gameDataActionApprovalRate),
    });
  }

  return (
    <PageShell width='standard' className='space-y-6 py-8 text-gray-900 dark:text-gray-100'>
      <Card as='header' bordered className='p-6 sm:p-8'>
        <div className='flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between'>
          <div className='min-w-0'>
            <p className='text-sm font-medium text-blue-600 dark:text-blue-400'>Wiki 用户</p>
            <h1 className='mt-1 truncate text-3xl font-bold tracking-tight'>{profile.nickname}</h1>
            {contributor?.name && contributor.name !== profile.nickname ? (
              <p className='mt-1 text-base text-gray-600 dark:text-gray-300'>{contributor.name}</p>
            ) : null}
            {contributor?.description ? (
              <p className='mt-3 max-w-3xl text-sm leading-6 text-gray-600 dark:text-gray-300'>
                {contributor.description}
              </p>
            ) : null}
            <p className='mt-2 text-sm text-gray-500 dark:text-gray-400'>
              {registrationDateFormatter.format(new Date(profile.registeredAt))}注册
            </p>
          </div>
          <div className='rounded-xl bg-blue-50 px-6 py-4 text-center dark:bg-blue-950/40'>
            <div className='text-3xl font-bold text-blue-700 dark:text-blue-300'>
              {profile.contributionTotals.all}
            </div>
            <div className='mt-1 text-sm text-blue-700/80 dark:text-blue-300/80'>公开贡献</div>
          </div>
        </div>

        <div className='mt-6 space-y-3'>
          <div className='flex flex-wrap items-center gap-2' aria-label='用户组'>
            <span className='mr-1 text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400'>
              用户组
            </span>
            {profile.groups.length > 0 ? (
              profile.groups.map((group) => (
                <span
                  key={group}
                  className='rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200'
                >
                  {group}
                </span>
              ))
            ) : (
              <span className='text-sm text-gray-500 dark:text-gray-400'>暂无用户组</span>
            )}
          </div>
          {contributorRoleLabels.length > 0 ? (
            <div className='flex flex-wrap items-center gap-2' aria-label='贡献者身份'>
              <span className='mr-1 text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400'>
                贡献者身份
              </span>
              {contributorRoleLabels.map((role) => (
                <span
                  key={role}
                  className='rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                >
                  {role}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {contributor?.url && externalWebsiteName ? (
          <div className='mt-6 border-t border-gray-200 pt-4 dark:border-gray-700'>
            <InlineExternalLink
              href={contributor.url}
              ariaLabel={`访问${externalWebsiteName}主页（在新标签页打开）`}
              className='group inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2.5 font-medium no-underline shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/40 dark:hover:border-blue-700 dark:hover:bg-blue-900/60'
            >
              <svg
                className='h-4 w-4 shrink-0'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
                aria-hidden='true'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={1.8}
                  d='M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V16.5M14.25 3H21m0 0v6.75M21 3l-9.75 9.75'
                />
              </svg>
              <span>访问{externalWebsiteName}主页</span>
            </InlineExternalLink>
          </div>
        ) : null}
      </Card>

      {contributionStats.length > 0 ? (
        <section aria-labelledby='contribution-totals-heading'>
          <h2 id='contribution-totals-heading' className='mb-3 text-xl font-semibold'>
            贡献统计
          </h2>
          <div className={getContributionStatsGridClassName(contributionStats.length)}>
            {contributionStats.map((stat) => (
              <Card
                key={stat.label}
                className='border border-gray-200 text-center dark:border-gray-700'
              >
                <div className='text-2xl font-bold'>{stat.value}</div>
                <div className='mt-1 text-sm text-gray-500 dark:text-gray-400'>{stat.label}</div>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      <ContributionCalendarView
        days={contributionCalendar}
        asOf={contributionDateRange.endDate}
        hasError={calendarError}
      />
      <ContributionAnalytics
        metrics={contributionMetrics}
        months={contributionMetrics?.monthlyBuckets ?? []}
        categories={contributionBreakdown}
        hasMetricsError={calendarError}
        hasBreakdownError={breakdownError}
      />
      <ContributionActivityHistory
        page={contributionActivityPage}
        filter={contributionFilter}
        filterHrefs={contributionFilterHrefs}
        pageHref={contributionPageHref}
        hasError={activityError}
      />
    </PageShell>
  );
}
