'use client';

import { useMemo, useState, type ReactNode } from 'react';

import { cn } from '@/lib/design';
import type { Action } from '@/lib/edit/diffUtils';
import { decodeStoredActionRow } from '@/lib/gameData/actionRowDecoder';
import { characters } from '@/data/static';
import type { TraitRelationKind } from '@/data/types';
import {
  collapseGameActionSplitRows,
  createGameActionDiff,
  createGameActionUnifiedHunks,
  formatGameActionNormalDiff,
  formatGameActionUnifiedDiff,
  type GameActionDiffModel,
  type GameActionDiffSegment,
  type GameActionDiffView,
  type GameActionNormalGroup,
  type GameActionSplitRow,
  type GameActionUnifiedLine,
} from '@/features/admin/utils/gameActionDiff';
import {
  diffGameActionIdArray,
  hasVisibleIdArrayDiff,
  shouldShowGameActionValueTransition,
  summarizeGameActionValue,
} from '@/features/admin/utils/gameActionPreview';
import { getCharacterRelation } from '@/features/characters/utils/relationReadModel';
import Button from '@/components/ui/Button';

type PreviewAction = Readonly<Action>;

type NormalizedPreviewAction = {
  action: PreviewAction;
  metadata: Record<string, unknown>;
};

type NormalizedPreviewEntry =
  { success: true; actions: NormalizedPreviewAction[] } | { success: false; rawEntry: unknown };

type GameDataActionPreviewListProps = {
  entry: unknown;
  entityType: string;
};

type GameDataActionChangeViewerProps = {
  entry: unknown;
  entityType: string;
  view: GameActionDiffView;
  showAllContext: boolean;
  onCopyText: (text: string) => Promise<void> | void;
};

const CHARACTER_RELATION_KINDS = [
  'counters',
  'counteredBy',
  'counterEachOther',
  'collaborators',
  'countersKnowledgeCards',
  'counteredByKnowledgeCards',
  'countersSpecialSkills',
  'counteredBySpecialSkills',
  'advantageMaps',
  'advantageModes',
  'disadvantageMaps',
  'disadvantageModes',
] as const satisfies readonly TraitRelationKind[];

const CHARACTER_RELATION_KIND_SET = new Set<TraitRelationKind>(CHARACTER_RELATION_KINDS);

function getProjectedCharacterRelationPreviewOldValue(path: string): unknown {
  const parts = path.split('.');
  if (parts.length !== 2) return undefined;

  const [characterId, relationKind] = parts;
  if (!characterId || !CHARACTER_RELATION_KIND_SET.has(relationKind as TraitRelationKind)) {
    return undefined;
  }

  return getCharacterRelation(characters, characterId)[relationKind as TraitRelationKind];
}

function getPreviewOldValue(entityType: string, action: PreviewAction): unknown {
  if (action.oldValue !== null && action.oldValue !== undefined) return action.oldValue;
  if (entityType !== 'characters') return action.oldValue;

  return getProjectedCharacterRelationPreviewOldValue(action.path) ?? action.oldValue;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function flattenRawActionCandidates(entry: unknown): unknown[] {
  if (!Array.isArray(entry)) return [entry];
  return entry.flatMap((item) => (Array.isArray(item) ? item : [item]));
}

function getRawActionMetadata(value: unknown): Record<string, unknown> {
  if (!isPlainRecord(value)) return {};

  return Object.fromEntries(
    Object.entries(value).filter(([key, item]) => {
      if (key === 'path' || key === 'oldValue' || key === 'newValue') return false;
      return !(key === 'op' && (item === undefined || item === 'set'));
    })
  );
}

function normalizePreviewEntry(entry: unknown): NormalizedPreviewEntry {
  const decoded = decodeStoredActionRow({
    id: 'admin-preview',
    entry,
  });
  if (!decoded.success) return { success: false, rawEntry: entry };

  const rawCandidates = flattenRawActionCandidates(decoded.value.rawEntry);
  return {
    success: true,
    actions: decoded.value.actions.map((action, index) => ({
      action,
      metadata: getRawActionMetadata(rawCandidates[index]),
    })),
  };
}

function shouldShowPreviewAction(entityType: string, action: PreviewAction): boolean {
  const previewOldValue = getPreviewOldValue(entityType, action);
  const noOld = previewOldValue === null || previewOldValue === undefined;
  const newIsEmptyArray = Array.isArray(action.newValue) && action.newValue.length === 0;
  return !(noOld && newIsEmptyArray);
}

type GameDataActionPreviewItemProps = {
  action: PreviewAction;
  entityType: string;
};

function GameDataActionPreviewItem({ action, entityType }: GameDataActionPreviewItemProps) {
  const previewOldValue = getPreviewOldValue(entityType, action);
  const oldSummary = summarizeGameActionValue(previewOldValue);
  const newSummary = summarizeGameActionValue(action.newValue);
  const idDiff = diffGameActionIdArray(previewOldValue, action.newValue);
  const showValueTransition = shouldShowGameActionValueTransition(oldSummary, newSummary, idDiff);
  const showIdDiff = hasVisibleIdArrayDiff(idDiff);

  return (
    <li className='bg-surface/80 dark:bg-surface/60 rounded px-2 py-1 text-gray-800 shadow-sm ring-1 ring-amber-100 dark:text-slate-100 dark:ring-amber-900/50'>
      <div className='flex flex-wrap items-center gap-2'>
        {action.op !== 'set' && (
          <span className='rounded bg-amber-600 px-1.5 py-0.5 text-[11px] font-semibold text-white'>
            {action.op.toUpperCase()}
          </span>
        )}
        <span className='font-medium'>{action.path}</span>
      </div>
      {showValueTransition && (
        <div className='mt-1 grid grid-cols-[1fr_auto_1fr] items-center gap-1 text-[11px] text-gray-800 dark:text-slate-100'>
          <div className='truncate text-gray-700 dark:text-slate-200'>{oldSummary}</div>
          <span className='text-gray-500 dark:text-slate-400'>→</span>
          <div className='truncate text-green-700 dark:text-green-200'>{newSummary}</div>
        </div>
      )}
      {showIdDiff && (
        <div className='mt-1 space-y-1 text-[11px]'>
          <div className='flex flex-wrap gap-2'>
            {idDiff.added.length > 0 && (
              <span className='rounded bg-green-100 px-1.5 py-0.5 text-green-700 dark:bg-green-900/40 dark:text-green-200'>
                新增ID：{idDiff.added.join('、')}
              </span>
            )}
            {idDiff.removed.length > 0 && (
              <span className='rounded bg-red-100 px-1.5 py-0.5 text-red-700 dark:bg-red-900/40 dark:text-red-200'>
                移除ID：{idDiff.removed.join('、')}
              </span>
            )}
          </div>
          {idDiff.changed.length > 0 && (
            <div className='rounded bg-blue-50 px-2 py-1 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'>
              <div className='font-medium'>变更字段：</div>
              <ul className='mt-1 space-y-0.5'>
                {idDiff.changed.map((change) => (
                  <li key={change.id} className='wrap-break-word'>
                    <span className='font-medium'>{change.id}</span>：{change.fields.join('、')}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

function DiffSegments({
  segments,
  side,
}: {
  segments: GameActionDiffSegment[];
  side: 'old' | 'new';
}) {
  return segments.map((segment, index) => {
    const emphasized =
      (side === 'old' && segment.kind === 'removed') ||
      (side === 'new' && segment.kind === 'added');

    return (
      <span
        key={`${index}-${segment.kind}-${segment.value}`}
        className={
          emphasized
            ? side === 'old'
              ? 'rounded-sm bg-red-300/80 text-red-950 dark:bg-red-700 dark:text-red-50'
              : 'rounded-sm bg-emerald-300/80 text-emerald-950 dark:bg-emerald-700 dark:text-emerald-50'
            : undefined
        }
      >
        <JsonLineText value={segment.value} />
      </span>
    );
  });
}

function JsonLineText({ value }: { value: string }) {
  const parts: ReactNode[] = [];
  const stringTokenPattern = /"(?:\\.|[^"\\])*"/g;
  let cursor = 0;

  for (const match of value.matchAll(stringTokenPattern)) {
    const matchIndex = match.index;
    const encoded = match[0];
    if (matchIndex > cursor) parts.push(value.slice(cursor, matchIndex));
    parts.push(
      <span key={`${matchIndex}-${encoded}`} className='text-green-700 dark:text-green-300'>
        <span className='text-gray-400 dark:text-slate-500'>&quot;</span>
        <span>{encoded.slice(1, -1)}</span>
        <span className='text-gray-400 dark:text-slate-500'>&quot;</span>
      </span>
    );
    cursor = matchIndex + encoded.length;
  }

  if (cursor < value.length) parts.push(value.slice(cursor));
  return parts.length > 0 ? parts : value;
}

function EmptyDiffState() {
  return (
    <div className='bg-surface-sunken rounded px-4 py-8 text-center text-sm text-gray-500 dark:text-slate-400'>
      规范化后没有差异
    </div>
  );
}

function UnifiedLine({ line }: { line: GameActionUnifiedLine }) {
  const prefix = line.kind === 'removed' ? '-' : line.kind === 'added' ? '+' : ' ';
  const side = line.kind === 'removed' ? 'old' : 'new';

  return (
    <div
      className={cn(
        'grid min-w-max grid-cols-[3rem_3rem_1.5rem_minmax(30rem,1fr)] font-mono text-xs leading-6',
        line.kind === 'removed' && 'bg-red-50 text-red-950 dark:bg-red-950/40 dark:text-red-100',
        line.kind === 'added' &&
          'bg-emerald-50 text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-100',
        line.kind === 'context' && 'text-slate-700 dark:text-slate-300'
      )}
    >
      <span className='border-r border-slate-200 px-2 text-right text-slate-400 select-none dark:border-slate-700 dark:text-slate-500'>
        {line.oldLineNumber}
      </span>
      <span className='border-r border-slate-200 px-2 text-right text-slate-400 select-none dark:border-slate-700 dark:text-slate-500'>
        {line.newLineNumber}
      </span>
      <span className='text-center font-bold select-none'>{prefix}</span>
      <span className='pr-3 whitespace-pre'>
        <DiffSegments segments={line.segments} side={side} />
      </span>
    </div>
  );
}

function UnifiedDiffView({
  model,
  fileName,
  showAllContext,
}: {
  model: GameActionDiffModel;
  fileName: string;
  showAllContext: boolean;
}) {
  const hunks = createGameActionUnifiedHunks(model, showAllContext);
  if (hunks.length === 0) return <EmptyDiffState />;

  return (
    <div className='border-border bg-surface-sunken overflow-auto rounded border'>
      <div className='min-w-max border-b border-slate-200 bg-red-50 px-3 py-1 font-mono text-xs text-red-800 dark:border-slate-700 dark:bg-red-950/40 dark:text-red-200'>
        --- {fileName}.old.json
      </div>
      <div className='min-w-max border-b border-slate-200 bg-emerald-50 px-3 py-1 font-mono text-xs text-emerald-800 dark:border-slate-700 dark:bg-emerald-950/40 dark:text-emerald-200'>
        +++ {fileName}.new.json
      </div>
      {hunks.map((hunk, hunkIndex) => (
        <div key={`${hunkIndex}-${hunk.header}`}>
          <div className='min-w-max border-y border-blue-200 bg-blue-50 px-3 py-1 font-mono text-xs text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300'>
            {hunk.header}
          </div>
          {hunk.lines.map((line, lineIndex) => (
            <UnifiedLine
              key={`${hunkIndex}-${lineIndex}-${line.kind}-${line.oldLineNumber}-${line.newLineNumber}`}
              line={line}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function NormalGroup({ group }: { group: GameActionNormalGroup }) {
  return (
    <div className='min-w-max font-mono text-xs leading-6'>
      <div className='bg-blue-50 px-3 font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'>
        {group.command}
      </div>
      {group.oldLines.map((line) => (
        <div
          key={`old-${line.lineNumber}`}
          className='grid grid-cols-[2rem_minmax(30rem,1fr)] bg-red-50 px-2 text-red-950 dark:bg-red-950/40 dark:text-red-100'
        >
          <span className='font-bold select-none'>&lt;</span>
          <span className='whitespace-pre'>
            <DiffSegments segments={line.segments} side='old' />
          </span>
        </div>
      ))}
      {group.oldLines.length > 0 && group.newLines.length > 0 && (
        <div className='bg-slate-50 px-3 text-slate-500 dark:bg-slate-900 dark:text-slate-400'>
          ---
        </div>
      )}
      {group.newLines.map((line) => (
        <div
          key={`new-${line.lineNumber}`}
          className='grid grid-cols-[2rem_minmax(30rem,1fr)] bg-emerald-50 px-2 text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-100'
        >
          <span className='font-bold select-none'>&gt;</span>
          <span className='whitespace-pre'>
            <DiffSegments segments={line.segments} side='new' />
          </span>
        </div>
      ))}
    </div>
  );
}

function NormalDiffView({ model }: { model: GameActionDiffModel }) {
  if (model.normalGroups.length === 0) return <EmptyDiffState />;

  return (
    <div className='border-border bg-surface-sunken max-h-160 space-y-1 overflow-auto rounded border'>
      {model.normalGroups.map((group, index) => (
        <NormalGroup key={`${index}-${group.command}`} group={group} />
      ))}
    </div>
  );
}

function SplitRow({ row }: { row: GameActionSplitRow }) {
  const oldChanged = row.kind === 'changed' || row.kind === 'removed';
  const newChanged = row.kind === 'changed' || row.kind === 'added';

  return (
    <div className='grid min-w-192 grid-cols-[3rem_1.5rem_minmax(18rem,1fr)_3rem_1.5rem_minmax(18rem,1fr)] font-mono text-xs leading-6'>
      <span className='border-r border-b border-slate-200 bg-slate-50 px-2 text-right text-slate-400 select-none dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-500'>
        {row.oldLineNumber}
      </span>
      <span
        className={cn(
          'border-r border-b border-slate-200 text-center font-bold select-none dark:border-slate-700',
          oldChanged
            ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
            : 'bg-slate-50 dark:bg-slate-950/60'
        )}
      >
        {oldChanged ? '-' : ''}
      </span>
      <span
        className={cn(
          'border-r border-b border-slate-200 px-3 whitespace-pre dark:border-slate-700',
          oldChanged
            ? 'bg-red-50 text-red-950 dark:bg-red-950/30 dark:text-red-100'
            : 'text-slate-700 dark:text-slate-300'
        )}
      >
        <DiffSegments segments={row.oldSegments} side='old' />
      </span>
      <span className='border-r border-b border-slate-200 bg-slate-50 px-2 text-right text-slate-400 select-none dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-500'>
        {row.newLineNumber}
      </span>
      <span
        className={cn(
          'border-r border-b border-slate-200 text-center font-bold select-none dark:border-slate-700',
          newChanged
            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
            : 'bg-slate-50 dark:bg-slate-950/60'
        )}
      >
        {newChanged ? '+' : ''}
      </span>
      <span
        className={cn(
          'border-b border-slate-200 px-3 whitespace-pre dark:border-slate-700',
          newChanged
            ? 'bg-emerald-50 text-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-100'
            : 'text-slate-700 dark:text-slate-300'
        )}
      >
        <DiffSegments segments={row.newSegments} side='new' />
      </span>
    </div>
  );
}

function SplitDiffView({
  model,
  showAllContext,
}: {
  model: GameActionDiffModel;
  showAllContext: boolean;
}) {
  const [expandedGapIds, setExpandedGapIds] = useState<Set<string>>(() => new Set());
  const displayItems = useMemo(
    () => collapseGameActionSplitRows(model.splitRows, expandedGapIds, showAllContext),
    [expandedGapIds, model.splitRows, showAllContext]
  );

  if (model.identical) return <EmptyDiffState />;

  return (
    <div className='border-border bg-surface-sunken overflow-auto rounded border'>
      <div className='grid min-w-192 grid-cols-2 border-b border-slate-200 text-xs font-semibold dark:border-slate-700'>
        <div className='border-r border-slate-200 bg-red-50 px-3 py-2 text-red-800 dark:border-slate-700 dark:bg-red-950/40 dark:text-red-200'>
          旧值
        </div>
        <div className='bg-emerald-50 px-3 py-2 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'>
          新值
        </div>
      </div>
      {displayItems.map((item) =>
        item.type === 'gap' ? (
          <div
            key={item.id}
            className='min-w-192 border-b border-slate-200 bg-slate-100/80 p-1 text-center dark:border-slate-700 dark:bg-slate-950/70'
          >
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setExpandedGapIds((current) => new Set(current).add(item.id))}
            >
              展开 {item.hiddenCount} 行未更改内容
            </Button>
          </div>
        ) : (
          <SplitRow key={item.rowIndex} row={item.row} />
        )
      )}
    </div>
  );
}

function formatRawEntry(entry: unknown): string {
  return JSON.stringify(entry, null, 2) ?? String(entry);
}

function MalformedEntry({ entry }: { entry: unknown }) {
  return (
    <div className='space-y-2'>
      <div className='rounded border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-900 dark:border-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-200'>
        该历史记录无法解析，以下显示原始 JSON。
      </div>
      <pre className='bg-surface-sunken max-h-96 overflow-auto rounded p-3 text-xs whitespace-pre-wrap text-gray-800 dark:text-slate-100'>
        {formatRawEntry(entry)}
      </pre>
    </div>
  );
}

function ActionDiffCard({
  preview,
  entityType,
  view,
  showAllContext,
  onCopyText,
}: {
  preview: NormalizedPreviewAction;
  entityType: string;
  view: GameActionDiffView;
  showAllContext: boolean;
  onCopyText: (text: string) => Promise<void> | void;
}) {
  const oldValue = getPreviewOldValue(entityType, preview.action);
  const model = useMemo(
    () => createGameActionDiff(oldValue, preview.action.newValue),
    [oldValue, preview.action.newValue]
  );
  const fileName = `${entityType}/${preview.action.path}`;
  const metadataEntries = Object.entries(preview.metadata);

  const copyDiff = () => {
    const text =
      view === 'normal'
        ? formatGameActionNormalDiff(model)
        : formatGameActionUnifiedDiff(model, fileName, showAllContext);
    return onCopyText(text);
  };

  return (
    <section className='space-y-2 rounded border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-700 dark:bg-slate-900/25'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <div className='flex min-w-0 flex-wrap items-center gap-2 text-xs'>
          <span
            className={cn(
              'rounded px-1.5 py-0.5 font-semibold',
              preview.action.op === 'delete'
                ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200'
                : preview.action.op === 'add'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'
                  : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200'
            )}
          >
            {preview.action.op.toUpperCase()}
          </span>
          <span className='font-mono font-medium wrap-break-word text-slate-800 dark:text-slate-100'>
            路径：{preview.action.path}
          </span>
          <span className='text-red-600 dark:text-red-300'>-{model.removedLines}</span>
          <span className='text-emerald-600 dark:text-emerald-300'>+{model.addedLines}</span>
        </div>
        <div className='flex flex-wrap items-center gap-1'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => void onCopyText(model.oldText)}
            title='复制规范化后的旧值'
          >
            复制旧值
          </Button>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => void onCopyText(model.newText)}
            title='复制规范化后的新值'
          >
            复制新值
          </Button>
          <Button
            variant='secondary'
            size='sm'
            disabled={model.identical}
            onClick={() => void copyDiff()}
          >
            复制差异
          </Button>
        </div>
      </div>

      {metadataEntries.length > 0 && (
        <pre className='overflow-auto rounded bg-slate-100 px-2 py-1 text-[11px] text-slate-600 dark:bg-slate-950/60 dark:text-slate-300'>
          {formatRawEntry(preview.metadata)}
        </pre>
      )}

      {view === 'unified' ? (
        <UnifiedDiffView model={model} fileName={fileName} showAllContext={showAllContext} />
      ) : view === 'normal' ? (
        <NormalDiffView model={model} />
      ) : (
        <SplitDiffView model={model} showAllContext={showAllContext} />
      )}

      {model.simplified && (
        <div className='rounded border border-yellow-300 bg-yellow-50 p-2 text-xs text-yellow-900 dark:border-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-200'>
          差异过大或计算超时，已简化为完整旧值和新值比较。
        </div>
      )}
    </section>
  );
}

export function GameDataActionChangeViewer({
  entry,
  entityType,
  view,
  showAllContext,
  onCopyText,
}: GameDataActionChangeViewerProps) {
  const normalized = useMemo(() => normalizePreviewEntry(entry), [entry]);

  if (!normalized.success) return <MalformedEntry entry={normalized.rawEntry} />;

  return (
    <div className='space-y-3'>
      {normalized.actions.map((preview, index) => (
        <ActionDiffCard
          key={`${index}-${preview.action.op}-${preview.action.path}`}
          preview={preview}
          entityType={entityType}
          view={view}
          showAllContext={showAllContext}
          onCopyText={onCopyText}
        />
      ))}
    </div>
  );
}

export default function GameDataActionPreviewList({
  entry,
  entityType,
}: GameDataActionPreviewListProps) {
  const normalized = useMemo(() => normalizePreviewEntry(entry), [entry]);

  if (!normalized.success) {
    return (
      <ul className='space-y-1 text-xs'>
        <li className='bg-surface/60 rounded px-2 py-1 text-gray-700 ring-1 ring-gray-100 dark:text-slate-100 dark:ring-slate-700'>
          非法记录
        </li>
      </ul>
    );
  }

  return (
    <ul className='space-y-1 text-xs'>
      {normalized.actions
        .filter(({ action }) => shouldShowPreviewAction(entityType, action))
        .map(({ action }, index) => (
          <GameDataActionPreviewItem
            key={`${index}-${action.op}-${action.path}`}
            action={action}
            entityType={entityType}
          />
        ))}
    </ul>
  );
}
