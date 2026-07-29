import { cache } from 'react';
import type { Metadata, Route } from 'next';
import { notFound } from 'next/navigation';

import { formatCompactDateTime } from '@/lib/dateUtils';
import { generatePageMetadata, getCanonicalUrl } from '@/lib/metadataUtils';
import { getPublicUserProfile, type PublicContribution } from '@/lib/users/publicProfile';
import { contributors } from '@/data/contributors';
import Card from '@/components/ui/Card';
import { InlineExternalLink } from '@/components/ui/InlineExternalLink';
import Link from '@/components/Link';

const getProfile = cache(getPublicUserProfile);

function decodeNickname(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

const registrationDateFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'Asia/Shanghai',
});

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

export default async function PublicUserPage({
  params,
}: {
  params: Promise<{ nickname: string }>;
}) {
  const { nickname: encodedNickname } = await params;
  const nickname = decodeNickname(encodedNickname);
  let profile;

  try {
    profile = await getProfile(nickname);
  } catch (error) {
    console.error('Failed to load public user profile:', error);
    notFound();
  }

  if (!profile) notFound();

  const contributor = contributors.find(({ nickname }) => nickname === profile.nickname);

  return (
    <main className='mx-auto w-full max-w-5xl space-y-6 px-4 py-8 text-gray-900 sm:px-6 dark:text-gray-100'>
      <Card as='header' className='border border-gray-200 p-6 sm:p-8 dark:border-gray-700'>
        <div className='flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between'>
          <div className='min-w-0'>
            <p className='text-sm font-medium text-blue-600 dark:text-blue-400'>Wiki 用户</p>
            <h1 className='mt-1 truncate text-3xl font-bold tracking-tight'>{profile.nickname}</h1>
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

        <div className='mt-6 flex flex-wrap gap-2' aria-label='用户组'>
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

        {contributor?.url ? (
          <div className='mt-4'>
            <InlineExternalLink
              href={contributor.url}
              ariaLabel={`${contributor.name}的外部主页（在新标签页打开）`}
            >
              外部主页
            </InlineExternalLink>
          </div>
        ) : null}
      </Card>

      <section aria-labelledby='contribution-totals-heading'>
        <h2 id='contribution-totals-heading' className='mb-3 text-xl font-semibold'>
          贡献统计
        </h2>
        <div
          className={
            profile.reviewCount > 0
              ? 'grid grid-cols-2 gap-3 sm:grid-cols-3'
              : 'grid grid-cols-2 gap-3'
          }
        >
          <Card className='border border-gray-200 text-center dark:border-gray-700'>
            <div className='text-2xl font-bold'>{profile.contributionTotals.articles}</div>
            <div className='mt-1 text-sm text-gray-500 dark:text-gray-400'>文章编辑</div>
          </Card>
          <Card className='border border-gray-200 text-center dark:border-gray-700'>
            <div className='text-2xl font-bold'>{profile.contributionTotals.gameData}</div>
            <div className='mt-1 text-sm text-gray-500 dark:text-gray-400'>游戏数据编辑</div>
          </Card>
          {profile.reviewCount > 0 && (
            <Card className='col-span-2 border border-gray-200 text-center sm:col-span-1 dark:border-gray-700'>
              <div className='text-2xl font-bold'>{profile.reviewCount}</div>
              <div className='mt-1 text-sm text-gray-500 dark:text-gray-400'>审核</div>
            </Card>
          )}
        </div>
      </section>

      <Card
        as='section'
        className='overflow-hidden border border-gray-200 p-0 dark:border-gray-700'
        aria-labelledby='recent-contributions-heading'
      >
        <div className='border-b border-gray-200 px-4 py-4 sm:px-5 dark:border-gray-700'>
          <h2 id='recent-contributions-heading' className='text-xl font-semibold'>
            最近贡献
          </h2>
        </div>

        {profile.recentContributions.length > 0 ? (
          <ol className='divide-y divide-gray-100 dark:divide-gray-700'>
            {profile.recentContributions.map((contribution) => (
              <li key={`${contribution.kind}-${contribution.id}`}>
                {contribution.href ? (
                  <Link
                    href={contribution.href as Route}
                    className='block px-4 py-4 transition-colors hover:bg-gray-50 sm:px-5 dark:hover:bg-gray-700/50'
                  >
                    <ContributionContent contribution={contribution} />
                  </Link>
                ) : (
                  <div className='px-4 py-4 sm:px-5'>
                    <ContributionContent contribution={contribution} />
                  </div>
                )}
              </li>
            ))}
          </ol>
        ) : (
          <p className='px-5 py-12 text-center text-gray-500 dark:text-gray-400'>暂无公开贡献</p>
        )}
      </Card>
    </main>
  );
}

function ContributionContent({ contribution }: { contribution: PublicContribution }) {
  return (
    <div className='flex items-start justify-between gap-4'>
      <div className='min-w-0'>
        <div className='flex flex-wrap items-center gap-2'>
          <span className='font-medium'>{contribution.title}</span>
          <span className='rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500 dark:bg-gray-700 dark:text-gray-300'>
            {contribution.kind === 'article' ? '文章' : '游戏数据'}
          </span>
        </div>
        {contribution.description && (
          <p className='mt-1 line-clamp-2 text-sm text-gray-600 dark:text-gray-300'>
            {contribution.description}
          </p>
        )}
      </div>
      <time
        dateTime={contribution.createdAt}
        className='shrink-0 text-xs text-gray-500 dark:text-gray-400'
      >
        {formatCompactDateTime(contribution.createdAt)}
      </time>
    </div>
  );
}
