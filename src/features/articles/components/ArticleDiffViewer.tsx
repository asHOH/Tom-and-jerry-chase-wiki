'use client';

import { useMemo, useState } from 'react';

import { formatArticleDate } from '@/lib/dateUtils';
import { cn } from '@/lib/design';
import Button from '@/components/ui/Button';
import ButtonLink from '@/components/ui/ButtonLink';
import Card from '@/components/ui/Card';
import RichTextDisplay from '@/components/ui/RichTextDisplay';

import {
  collapseArticleDiffRows,
  createArticleDiff,
  type ArticleDiffRow,
  type ArticleDiffSegment,
} from '../utils/articleDiff';

export type ComparableArticleVersion = {
  id: string;
  content: string | null;
  created_at: string | null;
  commit_message: string | null;
  users: { nickname: string | null } | null;
};

type ArticleDiffViewerProps = {
  articleId: string;
  oldVersion: ComparableArticleVersion;
  newVersion: ComparableArticleVersion;
  oldVersionNumber: number;
  newVersionNumber: number;
  olderComparisonHref?: string;
  newerComparisonHref?: string;
};

function VersionHeader({
  label,
  tone,
  version,
  versionNumber,
  articleId,
}: {
  label: string;
  tone: 'old' | 'new';
  version: ComparableArticleVersion;
  versionNumber: number;
  articleId: string;
}) {
  return (
    <div className='space-y-3 text-sm'>
      <div className='flex flex-wrap items-center gap-2'>
        <span
          className={cn(
            'inline-flex rounded-full px-2.5 py-1 text-xs font-bold tracking-wide',
            tone === 'old'
              ? 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200'
              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
          )}
        >
          {label}
        </span>
        <span className='text-base font-bold text-slate-900 dark:text-slate-100'>
          版本 #{versionNumber}
        </span>
      </div>
      <div className='flex flex-wrap gap-x-4 gap-y-1 font-normal text-slate-600 dark:text-slate-400'>
        <span>{version.created_at ? formatArticleDate(version.created_at) : '未知时间'}</span>
        <span>{version.users?.nickname || '未知用户'}</span>
      </div>
      {version.commit_message && (
        <div className='border-l-2 border-slate-300 pl-2 font-normal text-slate-700 italic dark:border-slate-600 dark:text-slate-300'>
          {version.commit_message}
        </div>
      )}
      <ButtonLink
        href={`/articles/${articleId}?version=${version.id}`}
        variant='ghost'
        size='sm'
        className='-ml-3'
      >
        查看此版本
      </ButtonLink>
    </div>
  );
}

function DiffSegments({ segments, side }: { segments: ArticleDiffSegment[]; side: 'old' | 'new' }) {
  return segments.map((segment, index) => {
    if (segment.kind === 'removed') {
      return (
        <del
          key={`${index}-${segment.value}`}
          className='rounded-sm bg-red-300 px-0.5 font-bold text-red-950 no-underline ring-1 ring-red-400/60 dark:bg-red-700 dark:text-red-50 dark:ring-red-600'
        >
          {segment.value}
        </del>
      );
    }
    if (segment.kind === 'added') {
      return (
        <ins
          key={`${index}-${segment.value}`}
          className='rounded-sm bg-emerald-300 px-0.5 font-bold text-emerald-950 no-underline ring-1 ring-emerald-400/60 dark:bg-emerald-700 dark:text-emerald-50 dark:ring-emerald-600'
        >
          {segment.value}
        </ins>
      );
    }
    return <span key={`${side}-${index}-${segment.value}`}>{segment.value}</span>;
  });
}

function DiffRow({ row }: { row: ArticleDiffRow }) {
  const oldChanged = row.kind === 'changed' || row.kind === 'removed';
  const newChanged = row.kind === 'changed' || row.kind === 'added';

  return (
    <tr
      className={cn(
        'transition-colors',
        row.kind === 'context' &&
          'bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/70'
      )}
    >
      <td className='border-b border-slate-200 bg-slate-50 px-1.5 py-3 text-right align-top font-mono text-xs text-slate-400 select-none dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-500'>
        {row.oldLineNumber}
      </td>
      <td
        className={cn(
          'border-b border-slate-200 px-1 py-3 text-center align-top font-bold select-none dark:border-slate-700',
          oldChanged
            ? 'bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-300'
            : 'bg-slate-50 text-slate-300 dark:bg-slate-950/60 dark:text-slate-700'
        )}
        aria-label={oldChanged ? '删除' : undefined}
      >
        {oldChanged ? '−' : ''}
      </td>
      <td
        className={cn(
          'border-b border-slate-200 px-4 py-3 align-top text-sm leading-6 whitespace-pre-wrap dark:border-slate-700',
          oldChanged
            ? 'border-l-4 border-l-red-400 bg-red-50/80 text-slate-900 dark:border-l-red-500 dark:bg-red-950/30 dark:text-slate-100'
            : 'text-slate-700 dark:text-slate-300'
        )}
      >
        <DiffSegments segments={row.oldSegments} side='old' />
      </td>
      <td className='border-b border-l-2 border-slate-200 bg-slate-50 px-1.5 py-3 text-right align-top font-mono text-xs text-slate-400 select-none dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-500'>
        {row.newLineNumber}
      </td>
      <td
        className={cn(
          'border-b border-slate-200 px-1 py-3 text-center align-top font-bold select-none dark:border-slate-700',
          newChanged
            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
            : 'bg-slate-50 text-slate-300 dark:bg-slate-950/60 dark:text-slate-700'
        )}
        aria-label={newChanged ? '新增' : undefined}
      >
        {newChanged ? '+' : ''}
      </td>
      <td
        className={cn(
          'border-b border-slate-200 px-4 py-3 align-top text-sm leading-6 whitespace-pre-wrap dark:border-slate-700',
          newChanged
            ? 'border-l-4 border-l-emerald-400 bg-emerald-50/80 text-slate-900 dark:border-l-emerald-500 dark:bg-emerald-950/30 dark:text-slate-100'
            : 'text-slate-700 dark:text-slate-300'
        )}
      >
        <DiffSegments segments={row.newSegments} side='new' />
      </td>
    </tr>
  );
}

export default function ArticleDiffViewer({
  articleId,
  oldVersion,
  newVersion,
  oldVersionNumber,
  newVersionNumber,
  olderComparisonHref,
  newerComparisonHref,
}: ArticleDiffViewerProps) {
  const [expandedGaps, setExpandedGaps] = useState<Set<string>>(() => new Set());
  const diff = useMemo(
    () => createArticleDiff(oldVersion.content, newVersion.content),
    [oldVersion.content, newVersion.content]
  );
  const displayItems = useMemo(
    () => collapseArticleDiffRows(diff.rows, expandedGaps),
    [diff.rows, expandedGaps]
  );

  return (
    <div className='space-y-8'>
      <Card
        bordered
        className='bg-surface/80 dark:bg-background/70 flex flex-wrap items-center justify-between gap-3 rounded-xl p-3 shadow-sm backdrop-blur'
      >
        <ButtonLink href={`/articles/${articleId}/history`} variant='secondary' size='sm'>
          返回版本历史
        </ButtonLink>
        <div className='flex flex-wrap gap-2'>
          {olderComparisonHref && (
            <ButtonLink href={olderComparisonHref} variant='ghost' size='sm'>
              ← 更早的编辑
            </ButtonLink>
          )}
          {newerComparisonHref && (
            <ButtonLink href={newerComparisonHref} variant='ghost' size='sm'>
              更新的编辑 →
            </ButtonLink>
          )}
        </div>
      </Card>

      <div className='flex flex-wrap items-center gap-x-5 gap-y-2 px-1 text-sm text-slate-600 dark:text-slate-400'>
        <span className='font-semibold text-slate-800 dark:text-slate-200'>差异标记</span>
        <span className='inline-flex items-center gap-2'>
          <span className='size-2.5 rounded-full bg-red-400 ring-4 ring-red-100 dark:ring-red-950' />
          删除内容
        </span>
        <span className='inline-flex items-center gap-2'>
          <span className='size-2.5 rounded-full bg-emerald-400 ring-4 ring-emerald-100 dark:ring-emerald-950' />
          新增内容
        </span>
        <span className='text-xs text-slate-500 dark:text-slate-500'>仅显示可见文字变化</span>
      </div>

      <Card bordered className='overflow-hidden p-0'>
        <div className='overflow-x-auto' data-testid='article-diff-table-scroll'>
          <table className='w-full min-w-200 table-fixed border-collapse'>
            <colgroup>
              <col className='w-9' />
              <col className='w-6' />
              <col />
              <col className='w-9' />
              <col className='w-6' />
              <col />
            </colgroup>
            <thead>
              <tr>
                <th
                  colSpan={3}
                  className='border-b border-slate-200 bg-linear-to-br from-red-50 to-white p-5 text-left align-top dark:border-slate-700 dark:from-red-950/40 dark:to-slate-900'
                >
                  <VersionHeader
                    label='旧版本'
                    tone='old'
                    version={oldVersion}
                    versionNumber={oldVersionNumber}
                    articleId={articleId}
                  />
                </th>
                <th
                  colSpan={3}
                  className='border-b border-l-2 border-slate-200 bg-linear-to-br from-emerald-50 to-white p-5 text-left align-top dark:border-slate-700 dark:from-emerald-950/40 dark:to-slate-900'
                >
                  <VersionHeader
                    label='新版本'
                    tone='new'
                    version={newVersion}
                    versionNumber={newVersionNumber}
                    articleId={articleId}
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {diff.identical ? (
                <tr>
                  <td
                    colSpan={6}
                    className='px-4 py-16 text-center text-slate-500 dark:text-slate-400'
                  >
                    <div className='mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-emerald-100 text-lg text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'>
                      ✓
                    </div>
                    <p className='font-semibold text-slate-700 dark:text-slate-200'>
                      没有可见内容差异
                    </p>
                  </td>
                </tr>
              ) : (
                displayItems.map((item) =>
                  item.type === 'gap' ? (
                    <tr key={item.id}>
                      <td
                        colSpan={6}
                        className='border-b border-slate-200 bg-slate-100/80 p-2 text-center dark:border-slate-700 dark:bg-slate-950/70'
                      >
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() =>
                            setExpandedGaps((current) => new Set(current).add(item.id))
                          }
                        >
                          展开 {item.hiddenCount} 行未更改内容
                        </Button>
                      </td>
                    </tr>
                  ) : (
                    <DiffRow key={item.rowIndex} row={item.row} />
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {diff.simplified && (
        <Card className='border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-900 dark:border-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-200'>
          文章差异过大，已显示简化的完整前后版本比较。
        </Card>
      )}

      <section aria-labelledby='newer-version-content'>
        <div className='mb-4 flex items-center gap-3'>
          <span className='h-7 w-1 rounded-full bg-emerald-500' aria-hidden='true' />
          <div>
            <h2
              id='newer-version-content'
              className='text-2xl font-bold text-slate-900 dark:text-slate-100'
            >
              新版本完整内容
            </h2>
            <p className='mt-1 text-sm text-slate-500 dark:text-slate-400'>
              版本 #{newVersionNumber} 的发布内容
            </p>
          </div>
        </div>
        <Card bordered className='p-6 md:p-8'>
          <RichTextDisplay content={newVersion.content} />
        </Card>
      </section>
    </div>
  );
}
