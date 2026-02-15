'use client';

import { useEffect, useMemo, useState } from 'react';

import { useToast } from '@/context/ToastContext';

interface ApprovedAction {
  action_id: string;
  entity_type: string;
  created_at: string;
  created_by_nickname: string;
  entry: unknown;
  is_public: boolean;
}

interface SyncPRPanelProps {
  actions: ApprovedAction[];
  onRefresh: () => void;
}

interface SyncResult {
  success: boolean;
  prUrl?: string;
  prNumber?: number;
  branch?: string;
  commits?: Array<{ actionId: string; commitSha: string; message: string }>;
  failedActions?: Array<{ actionId: string; reason: string }>;
  error?: string;
}

const SyncPRPanel: React.FC<SyncPRPanelProps> = ({ actions, onRefresh }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const { success, error } = useToast();

  const approvedActions = useMemo(() => actions.filter((a) => a.is_public), [actions]);

  // Drop selections that are no longer present after a data refresh.
  useEffect(() => {
    const validIds = new Set(approvedActions.map((a) => a.action_id));
    setSelectedIds((prev) => {
      const next = new Set<string>();
      for (const id of prev) {
        if (validIds.has(id)) next.add(id);
      }
      return next.size === prev.size ? prev : next;
    });
  }, [approvedActions]);

  const entityTypes = useMemo(() => {
    const set = new Set<string>();
    for (const a of approvedActions) set.add(a.entity_type);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [approvedActions]);

  const filteredActions = useMemo(() => {
    if (entityFilter === 'all') return approvedActions;
    return approvedActions.filter((a) => a.entity_type === entityFilter);
  }, [approvedActions, entityFilter]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredActions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredActions.map((a) => a.action_id)));
    }
  };

  const createPR = async () => {
    if (selectedIds.size === 0) return;
    if (syncing) return;

    const confirmed = window.confirm(
      `确认将选中的 ${selectedIds.size} 条已批准改动同步到 GitHub 仓库？\n将创建一个新分支和 Pull Request。`
    );
    if (!confirmed) return;

    setSyncing(true);
    setResult(null);

    try {
      const res = await fetch('/api/admin/sync-pr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionIds: Array.from(selectedIds) }),
      });

      const rawText = await res.text();
      let data: SyncResult | null = null;
      try {
        data = JSON.parse(rawText) as SyncResult;
      } catch {
        // ignore parse errors; fall back to text
      }

      if (!res.ok || !data) {
        const message = (data && data.error) || rawText || `创建 PR 失败（${res.status}）`;
        throw new Error(message);
      }

      setResult(data);
      success(`PR 已创建：#${data.prNumber}`);
      setSelectedIds(new Set());
    } catch (e) {
      const msg = e instanceof Error ? e.message : '创建 PR 失败';
      error(msg);
      setResult({ success: false, error: msg });
    } finally {
      setSyncing(false);
    }
  };

  const formatEntry = (entry: unknown): string => {
    if (!entry) return '(空)';
    try {
      return JSON.stringify(entry, null, 2);
    } catch {
      return String(entry);
    }
  };

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h2 className='text-xl font-semibold text-gray-900 dark:text-gray-100'>
          改动审核（含数据同步）
        </h2>
        <div className='text-sm text-gray-500 dark:text-gray-400'>
          共 {approvedActions.length} 条已批准改动
        </div>
      </div>

      <div className='rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-900/50 dark:bg-blue-900/30 dark:text-blue-200'>
        选择已批准的改动，批量创建 Pull Request 同步到 GitHub 仓库的 develop 分支。
        每条改动将生成一个独立的 commit。
      </div>

      {/* Filters and controls */}
      <div className='flex flex-col gap-3 rounded-md border border-gray-200 bg-white p-4 md:flex-row md:items-center md:justify-between dark:border-slate-700 dark:bg-slate-800'>
        <div className='flex flex-wrap items-center gap-2'>
          <label className='text-sm text-gray-600 dark:text-slate-300'>实体类型</label>
          <select
            value={entityFilter}
            onChange={(e) => {
              setEntityFilter(e.target.value);
              setSelectedIds(new Set());
            }}
            className='rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-800 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100'
          >
            <option value='all'>全部</option>
            {entityTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <div className='text-sm text-gray-500 dark:text-gray-400'>
            显示 {filteredActions.length} / {approvedActions.length}
          </div>
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          <button
            type='button'
            onClick={onRefresh}
            disabled={syncing}
            className={`rounded px-3 py-1 text-sm text-white ${
              syncing ? 'bg-gray-400 opacity-60' : 'bg-gray-700 hover:bg-gray-800'
            }`}
          >
            刷新
          </button>
          <button
            type='button'
            onClick={toggleSelectAll}
            disabled={syncing || filteredActions.length === 0}
            className={`rounded px-3 py-1 text-sm text-white ${
              syncing || filteredActions.length === 0
                ? 'bg-blue-400 opacity-60'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {selectedIds.size === filteredActions.length && filteredActions.length > 0
              ? '取消全选'
              : '全选'}
          </button>
          <button
            type='button'
            onClick={() => void createPR()}
            disabled={syncing || selectedIds.size === 0}
            className={`rounded px-3 py-1 text-sm text-white ${
              syncing || selectedIds.size === 0
                ? 'bg-purple-400 opacity-60'
                : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            {syncing ? '创建中...' : `创建 PR (${selectedIds.size})`}
          </button>
        </div>
      </div>

      {/* Result display */}
      {result && (
        <div
          className={`rounded-md border p-4 ${
            result.success
              ? 'border-green-200 bg-green-50 text-green-800 dark:border-green-900/50 dark:bg-green-900/30 dark:text-green-200'
              : 'border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-900/30 dark:text-red-200'
          }`}
        >
          {result.success ? (
            <div className='space-y-2'>
              <div className='font-semibold'>PR 创建成功</div>
              {result.prUrl && (
                <div>
                  <a
                    href={result.prUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='underline hover:no-underline'
                  >
                    查看 Pull Request #{result.prNumber}
                  </a>
                </div>
              )}
              <div className='text-sm'>
                分支：{result.branch} | 提交数：{result.commits?.length ?? 0}
              </div>
              {result.commits && result.commits.length > 0 && (
                <details className='mt-2'>
                  <summary className='cursor-pointer text-sm'>查看提交详情</summary>
                  <ul className='mt-1 list-inside list-disc text-xs'>
                    {result.commits.map((c) => (
                      <li key={c.commitSha}>
                        <code>{c.commitSha.slice(0, 7)}</code> {c.message}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
              {result.failedActions && result.failedActions.length > 0 && (
                <details className='mt-2'>
                  <summary className='cursor-pointer text-sm text-orange-700 dark:text-orange-300'>
                    {result.failedActions.length} 条改动未能同步
                  </summary>
                  <ul className='mt-1 list-inside list-disc text-xs'>
                    {result.failedActions.map((f) => (
                      <li key={f.actionId}>
                        {f.actionId}: {f.reason}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          ) : (
            <div>
              <span className='font-semibold'>失败：</span>
              {result.error}
            </div>
          )}
          <button type='button' onClick={() => setResult(null)} className='mt-2 text-sm underline'>
            关闭
          </button>
        </div>
      )}

      {/* Action list */}
      {filteredActions.length === 0 ? (
        <div className='rounded-md border border-gray-200 bg-white p-4 text-gray-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'>
          暂无已批准的改动可供同步
        </div>
      ) : (
        <div className='space-y-2'>
          {filteredActions.map((action) => (
            <div
              key={action.action_id}
              className={`cursor-pointer rounded-md border p-3 transition-colors ${
                selectedIds.has(action.action_id)
                  ? 'border-purple-300 bg-purple-50 dark:border-purple-700 dark:bg-purple-900/20'
                  : 'border-gray-200 bg-white hover:border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600'
              }`}
              onClick={() => !syncing && toggleSelect(action.action_id)}
            >
              <div className='flex items-center gap-3'>
                <input
                  type='checkbox'
                  checked={selectedIds.has(action.action_id)}
                  onChange={() => toggleSelect(action.action_id)}
                  onClick={(e) => e.stopPropagation()}
                  disabled={syncing}
                  className='h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500'
                />
                <div className='min-w-0 flex-1'>
                  <div className='flex flex-wrap items-center gap-2 text-sm'>
                    <span className='font-medium text-gray-800 dark:text-slate-200'>
                      {action.entity_type}
                    </span>
                    <span className='text-gray-300 dark:text-slate-600'>|</span>
                    <span className='text-gray-500 dark:text-slate-400'>
                      {action.created_by_nickname || '匿名'}
                    </span>
                    <span className='text-gray-300 dark:text-slate-600'>|</span>
                    <span className='text-gray-500 dark:text-slate-400'>
                      {new Date(action.created_at).toLocaleString()}
                    </span>
                  </div>
                  <pre className='mt-1 max-h-20 overflow-auto text-xs text-gray-600 dark:text-slate-400'>
                    {formatEntry(action.entry)}
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SyncPRPanel;
