import { Fragment } from 'react';

import type { TraitRelationKind } from '@/data/types';
import {
  diffGameActionIdArray,
  hasVisibleIdArrayDiff,
  shouldShowGameActionValueTransition,
  summarizeGameActionValue,
} from '@/features/admin/utils/gameActionPreview';
import { getCharacterRelation } from '@/features/characters/utils/relationReadModel';

type PreviewAction = {
  op?: string;
  path?: string;
  oldValue?: unknown;
  newValue?: unknown;
};

type GameDataActionPreviewListProps = {
  entry: unknown;
  entityType: string;
};

type GameDataActionRawPreviewProps = {
  entry: unknown;
};

const JSON_QUOTE_CLASS = 'text-gray-400 dark:text-slate-500';
const JSON_FIRST_LEVEL_KEY_CLASS =
  'text-amber-700 md:text-gray-800 dark:text-amber-300 md:dark:text-slate-100';
const JSON_NESTED_KEY_CLASS = 'text-blue-700 dark:text-blue-300';
const JSON_STRING_CLASS = 'text-green-700 dark:text-green-300';
const JSON_LITERAL_CLASS = 'text-purple-700 dark:text-purple-300';
const JSON_NULL_CLASS = 'text-gray-500 dark:text-slate-400';
const JSON_INDENT = '  ';

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

function getProjectedCharacterRelationPreviewOldValue(path: string | undefined): unknown {
  const parts = path?.split('.') ?? [];
  if (parts.length !== 2) return undefined;

  const [characterId, relationKind] = parts;
  if (!characterId || !CHARACTER_RELATION_KIND_SET.has(relationKind as TraitRelationKind)) {
    return undefined;
  }

  return getCharacterRelation(characterId)[relationKind as TraitRelationKind];
}

function getPreviewOldValue(entityType: string, action: PreviewAction): unknown {
  if (action.oldValue !== null && action.oldValue !== undefined) return action.oldValue;
  if (entityType !== 'characters') return action.oldValue;

  return getProjectedCharacterRelationPreviewOldValue(action.path) ?? action.oldValue;
}

function isPreviewAction(entry: unknown): entry is PreviewAction {
  return entry !== null && typeof entry === 'object';
}

function shouldShowPreviewEntry(entityType: string, entry: unknown): boolean {
  if (!isPreviewAction(entry)) return true;

  const previewOldValue = getPreviewOldValue(entityType, entry);
  const noOld = previewOldValue === null || previewOldValue === undefined;
  const newIsEmptyArray = Array.isArray(entry.newValue) && entry.newValue.length === 0;

  return !(noOld && newIsEmptyArray);
}

const InvalidPreviewEntry = ({ index }: { index: number }) => (
  <li
    key={index}
    className='rounded bg-white/60 px-2 py-1 text-gray-700 ring-1 ring-gray-100 dark:bg-slate-800/60 dark:text-slate-100 dark:ring-slate-700'
  >
    非法记录
  </li>
);

type GameDataActionPreviewItemProps = {
  action: PreviewAction;
  entityType: string;
};

const GameDataActionPreviewItem = ({ action, entityType }: GameDataActionPreviewItemProps) => {
  const op = action.op ?? 'set';
  const path = action.path ?? '<无路径>';
  const previewOldValue = getPreviewOldValue(entityType, action);
  const oldSummary = summarizeGameActionValue(previewOldValue);
  const newSummary = summarizeGameActionValue(action.newValue);
  const idDiff = diffGameActionIdArray(previewOldValue, action.newValue);
  const showValueTransition = shouldShowGameActionValueTransition(oldSummary, newSummary, idDiff);
  const showIdDiff = hasVisibleIdArrayDiff(idDiff);

  return (
    <li className='rounded bg-white/80 px-2 py-1 text-gray-800 shadow-sm ring-1 ring-amber-100 dark:bg-slate-800/60 dark:text-slate-100 dark:ring-amber-900/50'>
      <div className='flex flex-wrap items-center gap-2'>
        {op !== 'set' && (
          <span className='rounded bg-amber-600 px-1.5 py-0.5 text-[11px] font-semibold text-white'>
            {op.toUpperCase()}
          </span>
        )}
        <span className='font-medium'>{path}</span>
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
};

function getRawActionMetadata(action: PreviewAction): Record<string, unknown> {
  const metadata: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(action)) {
    if (key === 'path' || key === 'oldValue' || key === 'newValue') continue;
    if (key === 'op' && (value === undefined || value === 'set')) continue;
    metadata[key] = value;
  }

  return metadata;
}

const JsonQuote = () => <span className={JSON_QUOTE_CLASS}>{'"'}</span>;

const JsonKey = ({ name, depth }: { name: string; depth: number }) => (
  <>
    <JsonQuote />
    <span className={depth === 0 ? JSON_FIRST_LEVEL_KEY_CLASS : JSON_NESTED_KEY_CLASS}>{name}</span>
    <JsonQuote />
  </>
);

const JsonString = ({ value }: { value: string }) => {
  const encoded = JSON.stringify(value);
  return (
    <>
      <JsonQuote />
      <span className={JSON_STRING_CLASS}>{encoded.slice(1, -1)}</span>
      <JsonQuote />
    </>
  );
};

const JsonValue = ({
  value,
  keyDepth = 0,
  indent = 0,
}: {
  value: unknown;
  keyDepth?: number;
  indent?: number;
}) => {
  if (typeof value === 'string') return <JsonString value={value} />;
  if (typeof value === 'number' || typeof value === 'boolean') {
    return <span className={JSON_LITERAL_CLASS}>{String(value)}</span>;
  }
  if (value === null) return <span className={JSON_NULL_CLASS}>null</span>;
  if (value === undefined) return <span className={JSON_NULL_CLASS}>undefined</span>;

  if (Array.isArray(value)) {
    if (value.length === 0) return <>[]</>;

    return (
      <>
        [
        {value.map((item, index) => (
          <Fragment key={index}>
            {'\n'}
            {JSON_INDENT.repeat(indent + 1)}
            <JsonValue value={item} keyDepth={keyDepth} indent={indent + 1} />
            {index < value.length - 1 && ','}
          </Fragment>
        ))}
        {'\n'}
        {JSON_INDENT.repeat(indent)}]
      </>
    );
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) return <>{'{}'}</>;

    return (
      <>
        {'{'}
        {entries.map(([key, item], index) => (
          <Fragment key={key}>
            {'\n'}
            {JSON_INDENT.repeat(indent + 1)}
            <JsonKey name={key} depth={keyDepth} />:{' '}
            <JsonValue value={item} keyDepth={keyDepth + 1} indent={indent + 1} />
            {index < entries.length - 1 && ','}
          </Fragment>
        ))}
        {'\n'}
        {JSON_INDENT.repeat(indent)}
        {'}'}
      </>
    );
  }

  return <>{String(value)}</>;
};

const RawValueBox = ({
  value,
  label,
  keyDepth = 0,
}: {
  value: unknown;
  label?: string;
  keyDepth?: number;
}) => (
  <pre className='max-h-64 min-h-12 overflow-auto rounded bg-gray-50 p-3 text-xs whitespace-pre-wrap text-gray-800 dark:bg-slate-900/40 dark:text-slate-100'>
    {label && (
      <span className='md:hidden'>
        <JsonKey name={label} depth={0} />:{' '}
      </span>
    )}
    <JsonValue value={value} keyDepth={keyDepth} />
  </pre>
);

const RawPreviewAction = ({ action }: { action: PreviewAction }) => {
  const metadata = getRawActionMetadata(action);
  const hasMetadata = Object.keys(metadata).length > 0;
  const hasValueDiff = 'oldValue' in action || 'newValue' in action;

  if (!hasValueDiff) {
    return <RawValueBox value={metadata} />;
  }

  return (
    <div className='space-y-1'>
      {hasMetadata && <RawValueBox value={metadata} />}
      <div className='grid gap-1 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-center'>
        <RawValueBox value={action.oldValue} label='oldValue' keyDepth={1} />
        <span className='flex justify-center text-sm text-gray-500 dark:text-slate-400'>→</span>
        <RawValueBox value={action.newValue} label='newValue' keyDepth={1} />
      </div>
    </div>
  );
};

const RawPreviewEntry = ({ entry }: { entry: unknown }) =>
  isPreviewAction(entry) ? <RawPreviewAction action={entry} /> : <RawValueBox value={entry} />;

export function GameDataActionRawPreview({ entry }: GameDataActionRawPreviewProps) {
  const entries = Array.isArray(entry) ? entry : [entry];

  return (
    <div className='space-y-2'>
      {entries.map((item, index) => (
        <RawPreviewEntry key={index} entry={item} />
      ))}
    </div>
  );
}

export default function GameDataActionPreviewList({
  entry,
  entityType,
}: GameDataActionPreviewListProps) {
  const entries = Array.isArray(entry) ? entry : [entry];

  return (
    <ul className='space-y-1 text-xs'>
      {entries
        .filter((item) => shouldShowPreviewEntry(entityType, item))
        .map((item, index) =>
          isPreviewAction(item) ? (
            <GameDataActionPreviewItem key={index} action={item} entityType={entityType} />
          ) : (
            <InvalidPreviewEntry key={index} index={index} />
          )
        )}
    </ul>
  );
}
