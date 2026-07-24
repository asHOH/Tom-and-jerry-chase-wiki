'use client';

import { useState } from 'react';

import { BLOCK_ACTIONS, type BlockAction, type BlockRestrictionInput } from '@/lib/blocks/types';
import { cn } from '@/lib/design';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { FormInput, FormSelect, FormTextarea } from '@/components/ui/FormControls';

type ResourceOption = { id: string; label: string };
type BlockUser = { id: string; nickname: string };
type BlockRow = {
  id: string;
  targetType: string;
  targetUserId: string | null;
  targetNickname: string | null;
  targetCidr: string | null;
  reason: string;
  expiresAt: string | null;
  revokedAt: string | null;
  isAutoblock: boolean;
  autoblockEnabled: boolean;
  hardBlock: boolean;
  active: boolean;
  restrictions: BlockRestrictionInput[];
};
type BlockLog = {
  id: string;
  blockId: string | null;
  eventType: string;
  actorId: string | null;
  actorNickname: string | null;
  reason: string | null;
  createdAt: string;
};

type Props = {
  blocks: BlockRow[];
  logs: BlockLog[];
  users: BlockUser[];
  resourceOptions: Record<string, ResourceOption[]>;
  canManage: boolean;
  mutateBlocks: () => Promise<unknown> | unknown;
};

const ACTION_LABELS: Record<BlockAction, string> = {
  edit: '编辑内容',
  upload: '上传图片',
  create_account: '创建账户',
  email: '邮件功能',
};

const formatExpiry = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat('zh-CN', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Asia/Shanghai',
      }).format(new Date(value))
    : '无限期';

const toLocalInput = (value: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

export default function BlockManagement({
  blocks,
  logs,
  users,
  resourceOptions,
  canManage,
  mutateBlocks,
}: Props) {
  const [targetType, setTargetType] = useState<'account' | 'ip' | 'range'>('account');
  const [targetUserId, setTargetUserId] = useState('');
  const [targetCidr, setTargetCidr] = useState('');
  const [scope, setScope] = useState<'sitewide' | 'partial'>('sitewide');
  const [actions, setActions] = useState<BlockAction[]>([...BLOCK_ACTIONS]);
  const [resourceType, setResourceType] = useState('articles');
  const [resourceId, setResourceId] = useState('');
  const [reason, setReason] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [hardBlock, setHardBlock] = useState(false);
  const [autoblock, setAutoblock] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const resourceIds = resourceOptions[resourceType] ?? [];
  const activeBlocks = blocks.filter((block) => block.active);
  const historyBlocks = blocks.filter((block) => !block.active);
  const eventLabels: Record<string, string> = {
    create: '创建',
    modify: '修改',
    autoblock: '自动封禁',
    unblock: '解除',
  };

  const reset = () => {
    setEditingId(null);
    setTargetType('account');
    setTargetUserId('');
    setTargetCidr('');
    setScope('sitewide');
    setActions([...BLOCK_ACTIONS]);
    setResourceType('articles');
    setResourceId('');
    setReason('');
    setExpiresAt('');
    setHardBlock(false);
    setAutoblock(true);
  };

  const startEdit = (block: BlockRow) => {
    setEditingId(block.id);
    setTargetType(block.targetType as 'account' | 'ip' | 'range');
    setTargetUserId(block.targetUserId ?? '');
    setTargetCidr(block.targetCidr ?? '');
    const hasResource = block.restrictions.some((restriction) => restriction.resourceType);
    setScope(hasResource ? 'partial' : 'sitewide');
    setActions([...new Set(block.restrictions.map((restriction) => restriction.action))]);
    const resource = block.restrictions.find((restriction) => restriction.resourceType);
    setResourceType(resource?.resourceType ?? 'articles');
    setResourceId(resource?.resourceId ?? '');
    setReason(block.reason);
    setExpiresAt(toLocalInput(block.expiresAt));
    setHardBlock(block.hardBlock);
    setAutoblock(block.autoblockEnabled);
  };

  const buildRestrictions = (): BlockRestrictionInput[] => {
    const selected = actions.filter((action) => action !== 'edit' || scope === 'sitewide');
    return selected.map((action) => ({
      action,
      resourceType: action === 'edit' && scope === 'partial' ? resourceType : null,
      resourceId: action === 'edit' && scope === 'partial' ? resourceId || null : null,
    }));
  };

  const toggleAction = (action: BlockAction) => {
    setActions((current) =>
      current.includes(action) ? current.filter((item) => item !== action) : [...current, action]
    );
  };

  const submit = async () => {
    if (!reason.trim() || actions.length === 0) {
      setMessage('请填写理由并至少选择一项限制。');
      return;
    }
    if (scope === 'partial' && (!resourceType || !resourceId)) {
      setMessage('部分编辑封禁需要选择资源。');
      return;
    }
    const body = {
      targetType,
      targetUserId: targetType === 'account' ? targetUserId : null,
      targetCidr: targetType === 'account' ? null : targetCidr,
      reason: reason.trim(),
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      hardBlock: targetType === 'account' ? false : hardBlock,
      autoblock: targetType === 'account' ? autoblock : false,
      restrictions: buildRestrictions(),
    };
    const response = await fetch(
      editingId ? `/api/admin/blocks/${editingId}` : '/api/admin/blocks',
      {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );
    const result = (await response.json().catch(() => null)) as { error?: string } | null;
    if (!response.ok) {
      setMessage(result?.error ?? '保存封禁失败');
      return;
    }
    setMessage(editingId ? '封禁已修改' : '封禁已创建');
    reset();
    await mutateBlocks();
  };

  const unblock = async (block: BlockRow) => {
    const unblockReason = window.prompt('请输入解除封禁理由', '误封或封禁期满')?.trim();
    if (!unblockReason) return;
    const response = await fetch(`/api/admin/blocks/${block.id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: unblockReason }),
    });
    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      setMessage(result?.error ?? '解除封禁失败');
      return;
    }
    setMessage('封禁已解除');
    await mutateBlocks();
  };

  return (
    <div className='grid gap-4 lg:grid-cols-[minmax(20rem,26rem)_minmax(0,1fr)]'>
      {canManage && (
        <Card className='h-fit dark:text-slate-200'>
          <div className='mb-4 flex items-center justify-between gap-3'>
            <h2 className='text-xl font-semibold'>{editingId ? '修改封禁' : '创建封禁'}</h2>
            {editingId && (
              <Button size='sm' variant='secondary' onClick={reset}>
                取消修改
              </Button>
            )}
          </div>
          <div className='space-y-3'>
            <FormSelect
              value={targetType}
              onChange={(event) => setTargetType(event.target.value as typeof targetType)}
            >
              <option value='account'>账号</option>
              <option value='ip'>IP 地址</option>
              <option value='range'>CIDR 网段</option>
            </FormSelect>
            {targetType === 'account' ? (
              <FormSelect
                value={targetUserId}
                onChange={(event) => setTargetUserId(event.target.value)}
              >
                <option value=''>选择账号</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.nickname}
                  </option>
                ))}
              </FormSelect>
            ) : (
              <FormInput
                value={targetCidr}
                onChange={(event) => setTargetCidr(event.target.value)}
                placeholder={targetType === 'ip' ? '例如 203.0.113.10' : '例如 203.0.113.0/24'}
              />
            )}
            <FormSelect
              value={scope}
              onChange={(event) => setScope(event.target.value as typeof scope)}
            >
              <option value='sitewide'>站点级</option>
              <option value='partial'>部分编辑资源</option>
            </FormSelect>
            <div className='grid grid-cols-2 gap-2 text-sm'>
              {BLOCK_ACTIONS.map((action) => (
                <label key={action} className='flex items-center gap-2'>
                  <input
                    type='checkbox'
                    checked={actions.includes(action)}
                    onChange={() => toggleAction(action)}
                  />
                  {ACTION_LABELS[action]}
                </label>
              ))}
            </div>
            {scope === 'partial' && (
              <>
                <FormSelect
                  value={resourceType}
                  onChange={(event) => {
                    setResourceType(event.target.value);
                    setResourceId('');
                  }}
                >
                  {Object.keys(resourceOptions).map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </FormSelect>
                <FormSelect
                  value={resourceId}
                  onChange={(event) => setResourceId(event.target.value)}
                >
                  <option value=''>选择资源</option>
                  {resourceIds.map((resource) => (
                    <option key={resource.id} value={resource.id}>
                      {resource.label}
                    </option>
                  ))}
                </FormSelect>
              </>
            )}
            {targetType !== 'account' && (
              <label className='flex items-center gap-2 text-sm'>
                <input
                  type='checkbox'
                  checked={hardBlock}
                  onChange={(event) => setHardBlock(event.target.checked)}
                />{' '}
                同时限制该 IP 上的已登录账号
              </label>
            )}
            {targetType === 'account' && (
              <label className='flex items-center gap-2 text-sm'>
                <input
                  type='checkbox'
                  checked={autoblock}
                  onChange={(event) => setAutoblock(event.target.checked)}
                />{' '}
                自动封禁最近及后续使用的 IP
              </label>
            )}
            <FormInput
              type='datetime-local'
              value={expiresAt}
              onChange={(event) => setExpiresAt(event.target.value)}
            />
            <FormTextarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder='封禁理由'
              rows={4}
            />
            <Button fullWidth onClick={() => void submit()}>
              {editingId ? '保存修改' : '创建封禁'}
            </Button>
            {message && <p className='text-sm text-amber-700 dark:text-amber-300'>{message}</p>}
          </div>
        </Card>
      )}
      <Card className='dark:text-slate-200'>
        <div className='mb-4 flex items-center justify-between'>
          <h2 className='text-xl font-semibold'>活动封禁</h2>
          <span className='text-sm text-slate-500'>{activeBlocks.length} 条</span>
        </div>
        <div className='space-y-3'>
          {activeBlocks.map((block) => (
            <div
              key={block.id}
              className={cn(
                'rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700',
                block.isAutoblock && 'border-orange-300 dark:border-orange-700'
              )}
            >
              <div className='flex flex-wrap items-center justify-between gap-2'>
                <strong>
                  {block.targetType === 'account'
                    ? (block.targetNickname ?? block.targetUserId)
                    : block.targetCidr}
                </strong>
                <span className='text-slate-500'>
                  {block.isAutoblock ? '自动封禁' : '手动封禁'}
                </span>
              </div>
              <p className='mt-1'>{block.reason}</p>
              <p className='mt-1 text-slate-500'>到期：{formatExpiry(block.expiresAt)}</p>
              <div className='mt-2 flex gap-2'>
                {canManage && !block.isAutoblock && (
                  <Button size='sm' variant='secondary' onClick={() => startEdit(block)}>
                    修改
                  </Button>
                )}
                {canManage && (
                  <Button size='sm' variant='secondary' onClick={() => void unblock(block)}>
                    解除
                  </Button>
                )}
              </div>
            </div>
          ))}
          {activeBlocks.length === 0 && (
            <p className='py-6 text-center text-slate-500'>暂无活动封禁</p>
          )}
        </div>
      </Card>
      <Card className='lg:col-span-2 dark:text-slate-200'>
        <h2 className='mb-4 text-xl font-semibold'>封禁历史</h2>
        <div className='divide-y divide-slate-200 dark:divide-slate-700'>
          {historyBlocks.slice(0, 100).map((block) => (
            <div
              key={block.id}
              className='flex flex-wrap items-center justify-between gap-2 py-3 text-sm'
            >
              <span>
                {block.targetType === 'account'
                  ? (block.targetNickname ?? block.targetUserId)
                  : block.targetCidr}
              </span>
              <span className='text-slate-500'>
                {block.revokedAt ? '已解除' : `已到期：${formatExpiry(block.expiresAt)}`}
              </span>
              <span className='max-w-md text-slate-600 dark:text-slate-300'>{block.reason}</span>
            </div>
          ))}
          {historyBlocks.length === 0 && (
            <p className='py-6 text-center text-slate-500'>暂无历史记录</p>
          )}
        </div>
        {logs.length > 0 && (
          <div className='mt-5 border-t border-slate-200 pt-4 dark:border-slate-700'>
            <h3 className='mb-2 font-semibold'>审计记录</h3>
            <div className='space-y-2 text-sm'>
              {logs.slice(0, 100).map((log) => (
                <div key={log.id} className='flex flex-wrap gap-x-3 gap-y-1 text-slate-500'>
                  <span>{eventLabels[log.eventType] ?? log.eventType}</span>
                  <span>{formatExpiry(log.createdAt)}</span>
                  <span>{log.actorNickname ?? log.actorId ?? '系统'}</span>
                  {log.reason && <span>{log.reason}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
