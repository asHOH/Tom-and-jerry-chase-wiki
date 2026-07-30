'use client';

import isEqual from 'lodash-es/isEqual';

import { cn } from '@/lib/design';
import type { Action } from '@/lib/edit/diffUtils';
import Card from '@/components/ui/Card';

type GameDataActionVisualDiffProps = {
  entry: unknown;
  className?: string;
  resolveOldValue?: ((action: Action) => unknown) | undefined;
};

type DiffKind = 'added' | 'removed' | 'changed';

const ITEM_KEY_CANDIDATES = ['id', 'name', 'tagName', 'key', 'title'] as const;

const DIFF_STYLES: Record<DiffKind, string> = {
  added:
    'border-green-300 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950/35 dark:text-green-100',
  removed:
    'border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/35 dark:text-red-100',
  changed:
    'border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-100',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isAction(value: unknown): value is Action {
  if (!isRecord(value)) return false;
  return (
    (value.op === 'set' || value.op === 'add' || value.op === 'delete') &&
    typeof value.path === 'string'
  );
}

function flattenActions(entry: unknown): Action[] {
  if (isAction(entry)) return [entry];
  if (!Array.isArray(entry)) return [];
  return entry.flatMap(flattenActions);
}

function getItemKey(value: unknown): string | null {
  if (!isRecord(value)) return null;
  for (const key of ITEM_KEY_CANDIDATES) {
    const candidate = value[key];
    if (typeof candidate === 'string' && candidate.trim()) return candidate;
    if (typeof candidate === 'number') return String(candidate);
  }
  return null;
}

function keyedArray(value: unknown[]): Map<string, unknown> | null {
  const result = new Map<string, unknown>();
  for (const item of value) {
    const key = getItemKey(item);
    if (!key || result.has(key)) return null;
    result.set(key, item);
  }
  return result;
}

function formatPrimitive(value: unknown): string {
  if (value === undefined) return '未设置';
  if (value === null) return 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'string') return value || '空字符串';
  return String(value);
}

function ValueTree({ value }: { value: unknown }) {
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className='opacity-70'>空数组</span>;
    return (
      <div className='space-y-1'>
        {value.map((item, index) => (
          <div key={getItemKey(item) ?? index} className='rounded border border-current/15 p-2'>
            <span className='mb-1 block text-[10px] font-semibold opacity-60'>
              {getItemKey(item) ?? `#${index + 1}`}
            </span>
            <ValueTree value={item} />
          </div>
        ))}
      </div>
    );
  }

  if (isRecord(value)) {
    const entries = Object.entries(value);
    if (entries.length === 0) return <span className='opacity-70'>空对象</span>;
    return (
      <dl className='grid gap-x-3 gap-y-1 sm:grid-cols-[max-content_minmax(0,1fr)]'>
        {entries.map(([key, item]) => (
          <div key={key} className='contents'>
            <dt className='font-medium opacity-65'>{key}</dt>
            <dd className='min-w-0 wrap-break-word'>
              <ValueTree value={item} />
            </dd>
          </div>
        ))}
      </dl>
    );
  }

  return <span className='wrap-break-word whitespace-pre-wrap'>{formatPrimitive(value)}</span>;
}

function ChangedPrimitive({ before, after }: { before: unknown; after: unknown }) {
  return (
    <div className='grid gap-2 sm:grid-cols-2'>
      <div className={cn('rounded border p-2', DIFF_STYLES.removed)}>
        <span className='mb-1 block text-[10px] font-semibold tracking-wide'>修改前</span>
        <ValueTree value={before} />
      </div>
      <div className={cn('rounded border p-2', DIFF_STYLES.added)}>
        <span className='mb-1 block text-[10px] font-semibold tracking-wide'>修改后</span>
        <ValueTree value={after} />
      </div>
    </div>
  );
}

function AddedOrRemovedValue({ kind, value }: { kind: 'added' | 'removed'; value: unknown }) {
  return (
    <div className={cn('rounded border p-2', DIFF_STYLES[kind])}>
      <span className='mb-1 block text-[10px] font-semibold tracking-wide'>
        {kind === 'added' ? '新增' : '移除'}
      </span>
      <ValueTree value={value} />
    </div>
  );
}

function ArrayDiff({ before, after }: { before: unknown[]; after: unknown[] }) {
  const beforeMap = keyedArray(before);
  const afterMap = keyedArray(after);

  if (beforeMap && afterMap) {
    const keys = Array.from(new Set([...beforeMap.keys(), ...afterMap.keys()]));
    return (
      <div className='space-y-2'>
        {keys.map((key) => {
          const hasBefore = beforeMap.has(key);
          const hasAfter = afterMap.has(key);
          const oldItem = beforeMap.get(key);
          const newItem = afterMap.get(key);
          if (hasBefore && hasAfter && isEqual(oldItem, newItem)) return null;

          return (
            <section
              key={key}
              className={cn(
                'rounded-lg border p-2',
                !hasBefore
                  ? DIFF_STYLES.added
                  : !hasAfter
                    ? DIFF_STYLES.removed
                    : DIFF_STYLES.changed
              )}
            >
              <h5 className='mb-2 font-semibold'>{key}</h5>
              {!hasBefore ? (
                <ValueTree value={newItem} />
              ) : !hasAfter ? (
                <ValueTree value={oldItem} />
              ) : (
                <ValueDiff before={oldItem} after={newItem} />
              )}
            </section>
          );
        })}
      </div>
    );
  }

  const length = Math.max(before.length, after.length);
  return (
    <div className='space-y-2'>
      {Array.from({ length }, (_, index) => {
        const hasBefore = index < before.length;
        const hasAfter = index < after.length;
        if (hasBefore && hasAfter && isEqual(before[index], after[index])) return null;
        return (
          <section
            key={index}
            className='rounded-lg border border-gray-200 p-2 dark:border-slate-700'
          >
            <h5 className='mb-2 text-xs font-semibold text-gray-500 dark:text-slate-400'>
              第 {index + 1} 项
            </h5>
            {!hasBefore ? (
              <AddedOrRemovedValue kind='added' value={after[index]} />
            ) : !hasAfter ? (
              <AddedOrRemovedValue kind='removed' value={before[index]} />
            ) : (
              <ValueDiff before={before[index]} after={after[index]} />
            )}
          </section>
        );
      })}
    </div>
  );
}

function ValueDiff({ before, after }: { before: unknown; after: unknown }) {
  if (isEqual(before, after)) return null;
  if (before === undefined) return <AddedOrRemovedValue kind='added' value={after} />;
  if (after === undefined) return <AddedOrRemovedValue kind='removed' value={before} />;

  if (Array.isArray(before) && Array.isArray(after)) {
    return <ArrayDiff before={before} after={after} />;
  }

  if (isRecord(before) && isRecord(after)) {
    const keys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]));
    return (
      <div className='space-y-2'>
        {keys.map((key) => {
          if (isEqual(before[key], after[key])) return null;
          return (
            <section
              key={key}
              className='rounded-lg border border-amber-200 p-2 dark:border-amber-900/60'
            >
              <h5 className='mb-2 text-xs font-semibold text-amber-800 dark:text-amber-200'>
                {key}
              </h5>
              <ValueDiff before={before[key]} after={after[key]} />
            </section>
          );
        })}
      </div>
    );
  }

  return <ChangedPrimitive before={before} after={after} />;
}

function ActionDiff({ action }: { action: Action }) {
  return (
    <Card
      as='article'
      bordered
      className='bg-surface/80 dark:bg-background/60 rounded-xl p-3 shadow-sm'
    >
      <header className='mb-3 flex flex-wrap items-center gap-2'>
        <span
          className={cn(
            'rounded px-1.5 py-0.5 text-[10px] font-bold text-white',
            action.op === 'add'
              ? 'bg-green-600'
              : action.op === 'delete'
                ? 'bg-red-600'
                : 'bg-amber-600'
          )}
        >
          {action.op.toUpperCase()}
        </span>
        <code className='min-w-0 text-xs font-semibold wrap-break-word text-gray-700 dark:text-slate-200'>
          字段：{action.path}
        </code>
      </header>
      <ValueDiff before={action.oldValue} after={action.newValue} />
    </Card>
  );
}

export default function GameDataActionVisualDiff({
  entry,
  className,
  resolveOldValue,
}: GameDataActionVisualDiffProps) {
  const actions = flattenActions(entry)
    .map((action) => (resolveOldValue ? { ...action, oldValue: resolveOldValue(action) } : action))
    .filter((action) => !isEqual(action.oldValue, action.newValue));

  if (actions.length === 0) {
    return (
      <div
        className={cn(
          'rounded-lg bg-gray-50 p-3 text-sm text-gray-500 dark:bg-slate-900/40',
          className
        )}
      >
        没有可显示的字段变化
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className='flex flex-wrap gap-2 text-xs'>
        <span className={cn('rounded border px-2 py-1', DIFF_STYLES.added)}>绿色：新增</span>
        <span className={cn('rounded border px-2 py-1', DIFF_STYLES.removed)}>红色：移除</span>
        <span className={cn('rounded border px-2 py-1', DIFF_STYLES.changed)}>黄色：字段变化</span>
      </div>
      {actions.map((action, index) => (
        <ActionDiff key={`${action.op}:${action.path}:${index}`} action={action} />
      ))}
    </div>
  );
}

export { flattenActions };
