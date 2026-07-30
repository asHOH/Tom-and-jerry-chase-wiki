'use client';

import { useEffect, useState } from 'react';
import { useSWRConfig } from 'swr';

import type { PermissionResourceOption } from '@/lib/auth/permissionResources';
import {
  normalizePermissionGrants,
  type PermissionGrant,
  type PermissionScope,
} from '@/lib/auth/permissions';
import { SCOPABLE_RESOURCE_TYPES } from '@/lib/auth/resourceContexts';
import { cn } from '@/lib/design';
import { USER_API_KEY } from '@/hooks/useUser';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { FormInput, FormSelect, FormTextarea } from '@/components/ui/FormControls';
import {
  CheckCircleIcon,
  ChevronRightIcon,
  PlusIcon,
  TrashIcon,
  UserCircleIcon,
} from '@/components/icons/CommonIcons';

import {
  getDescendantGroupIds,
  isGrantCovered,
  removeCoveredDirectGrants,
} from '../utils/groupInheritance';

export type PermissionCatalogEntry = {
  key: string;
  category: string;
  label_zh: string;
  global_only: boolean;
  sort_order: number;
};

export type PermissionGroup = {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  isProtected: boolean;
  parentGroupId: string | null;
  memberCount: number;
  grants: PermissionGrant[];
  inheritedGrants: InheritedPermissionGrant[];
};

export type InheritedPermissionGrant = PermissionGrant & {
  sourceGroupId: string;
  sourceGroupName: string;
};

type Props = {
  groups: PermissionGroup[];
  catalog: PermissionCatalogEntry[];
  resourceOptions: Record<string, PermissionResourceOption[]>;
  canManage: boolean;
  mutateGroups: () => Promise<unknown> | unknown;
};

const emptyGrant = (permission: string): PermissionGrant => ({
  permission: permission as PermissionGrant['permission'],
  scope: 'global',
  resourceType: null,
  resourceId: null,
});

const withoutSource = ({
  sourceGroupId: _sourceGroupId,
  sourceGroupName: _sourceGroupName,
  ...grant
}: InheritedPermissionGrant): PermissionGrant => grant;

const scopeLabel = (grant: PermissionGrant) => {
  if (grant.scope === 'global') return '全局';
  if (grant.scope === 'resource_type') return `资源类型: ${grant.resourceType}`;
  return `指定资源: ${grant.resourceType} / ${grant.resourceId}`;
};

export default function PermissionGroupManagement({
  groups,
  catalog,
  resourceOptions,
  canManage,
  mutateGroups,
}: Props) {
  const { mutate: mutateCache } = useSWRConfig();
  const [selectedId, setSelectedId] = useState<string>('');
  const selected = groups.find((group) => group.id === selectedId) ?? groups[0];
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [parentGroupId, setParentGroupId] = useState<string | null>(null);
  const [grants, setGrants] = useState<PermissionGrant[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!selected) return;
    setSelectedId(selected.id);
    setName(selected.name);
    setDescription(selected.description);
    setIsDefault(selected.isDefault);
    setParentGroupId(selected.parentGroupId);
    setGrants(selected.grants);
  }, [selected]);

  const descendantIds = selected ? getDescendantGroupIds(groups, selected.id) : new Set<string>();
  const parentGroup = groups.find((group) => group.id === parentGroupId);
  const inheritedGrants: InheritedPermissionGrant[] = parentGroup
    ? [
        ...parentGroup.grants.map((grant) => ({
          ...grant,
          sourceGroupId: parentGroup.id,
          sourceGroupName: parentGroup.name,
        })),
        ...parentGroup.inheritedGrants,
      ]
    : [];
  const inheritedPermissionGrants = inheritedGrants.map(withoutSource);
  const effectiveGrantCount = normalizePermissionGrants([
    ...grants,
    ...inheritedPermissionGrants,
  ]).length;
  const childGroups = selected ? groups.filter((group) => group.parentGroupId === selected.id) : [];

  const request = async (url: string, method: string, body?: unknown) => {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const result = (await response.json().catch(() => null)) as { error?: string } | null;
    if (!response.ok) throw new Error(result?.error ?? '操作失败');
  };

  const createGroup = async () => {
    try {
      await request('/api/admin/groups', 'POST', {
        name: '新用户组',
        description: '',
        isDefault: false,
        grants: [],
        parentGroupId: null,
      });
      setMessage('用户组已创建');
      await mutateGroups();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '创建失败');
    }
  };

  const save = async () => {
    if (!selected) return;
    setIsSaving(true);
    try {
      const directGrants = removeCoveredDirectGrants(grants, inheritedPermissionGrants);
      await request(`/api/admin/groups/${selected.id}`, 'PATCH', {
        name,
        description,
        isDefault,
        grants: directGrants,
        parentGroupId,
      });
      setMessage('用户组已保存');
      await Promise.all([mutateGroups(), mutateCache(USER_API_KEY)]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteGroup = async () => {
    if (!selected || !window.confirm(`确认删除用户组“${selected.name}”？`)) return;
    try {
      await request(`/api/admin/groups/${selected.id}`, 'DELETE');
      setSelectedId('');
      setMessage('用户组已删除');
      await Promise.all([mutateGroups(), mutateCache(USER_API_KEY)]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '删除失败');
    }
  };

  const updateGrant = (index: number, patch: Partial<PermissionGrant>) => {
    setGrants((current) => {
      const updated = current.map((grant, grantIndex) => {
        if (grantIndex !== index) return grant;
        const next = { ...grant, ...patch };
        if (next.scope === 'global') return { ...next, resourceType: null, resourceId: null };
        if (next.scope === 'resource_type') return { ...next, resourceId: null };
        return next;
      });
      return removeCoveredDirectGrants(updated, inheritedPermissionGrants);
    });
  };

  const updateParent = (nextParentGroupId: string | null) => {
    const nextParent = groups.find((group) => group.id === nextParentGroupId);
    const nextInherited = nextParent
      ? [...nextParent.grants, ...nextParent.inheritedGrants.map(withoutSource)]
      : [];
    setParentGroupId(nextParentGroupId);
    setGrants((current) => removeCoveredDirectGrants(current, nextInherited));
  };

  return (
    <div className='grid gap-4 lg:grid-cols-[19rem_minmax(0,1fr)]'>
      <Card className='h-fit overflow-hidden p-0 lg:sticky lg:top-4'>
        <div className='border-b border-slate-200 bg-gradient-to-br from-indigo-50 to-blue-50 p-4 dark:border-slate-700 dark:from-indigo-950/30 dark:to-blue-950/20'>
          <div className='flex items-center justify-between gap-3'>
            <div>
              <h2 className='font-bold text-slate-900 dark:text-white'>用户组</h2>
              <p className='mt-0.5 text-xs text-slate-500 dark:text-slate-400'>
                {groups.length} 个组 · {groups.reduce((sum, group) => sum + group.memberCount, 0)}{' '}
                次分配
              </p>
            </div>
            {canManage && (
              <Button size='sm' onClick={createGroup} leadingIcon={<PlusIcon size={16} />}>
                新建
              </Button>
            )}
          </div>
        </div>
        <div className='flex gap-2 overflow-x-auto p-3 lg:flex-col lg:overflow-visible'>
          {groups.map((group) => (
            <Button
              variant='unstyled'
              key={group.id}
              type='button'
              onClick={() => setSelectedId(group.id)}
              className={cn(
                'group min-w-56 rounded-xl border p-3 text-left transition-all lg:w-full lg:min-w-0',
                selected?.id === group.id
                  ? 'border-blue-300 bg-blue-50 shadow-sm ring-1 ring-blue-100 dark:border-blue-700 dark:bg-blue-950/40 dark:ring-blue-900/50'
                  : 'border-transparent bg-slate-50 hover:border-slate-200 hover:bg-white hover:shadow-sm dark:bg-slate-900/40 dark:hover:border-slate-700 dark:hover:bg-slate-800'
              )}
            >
              <span className='flex items-center justify-between gap-2'>
                <span className='min-w-0'>
                  <span className='block truncate font-semibold text-slate-800 dark:text-slate-100'>
                    {group.name}
                  </span>
                  <span className='mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400'>
                    <UserCircleIcon size={14} />
                    {group.memberCount} 名成员
                    <span aria-hidden='true'>·</span>
                    {group.grants.length} 项授权
                  </span>
                </span>
                <ChevronRightIcon
                  size={16}
                  className={cn(
                    'shrink-0 text-slate-300 transition-transform lg:group-hover:translate-x-0.5 dark:text-slate-600',
                    selected?.id === group.id && 'text-blue-500 dark:text-blue-400'
                  )}
                />
              </span>
              {group.isDefault && (
                <span className='mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'>
                  <CheckCircleIcon size={12} />
                  注册默认
                </span>
              )}
            </Button>
          ))}
          {groups.length === 0 && (
            <div className='w-full rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400'>
              暂无用户组
            </div>
          )}
        </div>
      </Card>

      <Card className='overflow-hidden p-0'>
        {!selected ? (
          <div className='flex min-h-72 flex-col items-center justify-center p-8 text-center'>
            <span className='mb-3 flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500'>
              <UserCircleIcon size={30} />
            </span>
            <p className='font-medium text-slate-700 dark:text-slate-200'>暂无用户组</p>
            <p className='mt-1 text-sm text-slate-500 dark:text-slate-400'>
              新建用户组后即可配置授权
            </p>
          </div>
        ) : (
          <div>
            <div className='border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50/70 p-4 sm:p-6 dark:border-slate-700 dark:from-slate-800 dark:to-blue-950/20'>
              <div className='flex flex-wrap items-start justify-between gap-3'>
                <div>
                  <p className='text-xs font-semibold tracking-wider text-blue-600 uppercase dark:text-blue-400'>
                    用户组配置
                  </p>
                  <h2 className='mt-1 text-xl font-bold text-slate-900 dark:text-white'>
                    {selected.name}
                  </h2>
                  <p className='mt-1 text-sm text-slate-500 dark:text-slate-400'>
                    {selected.memberCount} 名成员 · {grants.length} 项直接授权 ·{' '}
                    {effectiveGrantCount} 项有效授权
                  </p>
                </div>
                {selected.isDefault && (
                  <span className='inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'>
                    <CheckCircleIcon size={14} />
                    注册默认组
                  </span>
                )}
              </div>
            </div>

            <div className='space-y-7 p-4 sm:p-6'>
              <section>
                <div className='mb-4'>
                  <h3 className='font-semibold text-slate-900 dark:text-white'>基本信息</h3>
                  <p className='mt-0.5 text-sm text-slate-500 dark:text-slate-400'>
                    设置用户组名称和用途说明
                  </p>
                </div>
                <div className='grid gap-4 sm:grid-cols-2'>
                  <label>
                    <span className='mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200'>
                      名称
                    </span>
                    <FormInput
                      value={name}
                      disabled={!canManage}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </label>
                  <label className='flex min-h-11 cursor-pointer items-center gap-3 self-end rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900/40'>
                    <input
                      type='checkbox'
                      checked={isDefault}
                      disabled={!canManage}
                      onChange={(e) => setIsDefault(e.target.checked)}
                      className='size-4 accent-blue-600'
                    />
                    <span>
                      <span className='block text-sm font-medium text-slate-700 dark:text-slate-200'>
                        注册默认用户组
                      </span>
                      <span className='block text-xs text-slate-500 dark:text-slate-400'>
                        新用户注册后将自动加入
                      </span>
                    </span>
                  </label>
                </div>
                <label className='mt-4 block'>
                  <span className='mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200'>
                    说明
                  </span>
                  <FormTextarea
                    value={description}
                    disabled={!canManage}
                    rows={3}
                    placeholder='简要说明该用户组的用途'
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </label>
                <label className='mt-4 block'>
                  <span className='mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200'>
                    扩展用户组
                  </span>
                  <FormSelect
                    aria-label='扩展用户组'
                    value={parentGroupId ?? ''}
                    disabled={!canManage}
                    onChange={(event) => updateParent(event.target.value || null)}
                  >
                    <option value=''>不扩展其他用户组</option>
                    {groups
                      .filter((group) => group.id !== selected.id && !descendantIds.has(group.id))
                      .map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                  </FormSelect>
                  <span className='mt-1.5 block text-xs text-slate-500 dark:text-slate-400'>
                    此用户组会立即继承父组的全部权限；父组权限变化也会同步生效。
                  </span>
                </label>
              </section>

              <section className='border-t border-slate-200 pt-6 dark:border-slate-700'>
                <div className='mb-4'>
                  <h3 className='font-semibold text-slate-900 dark:text-white'>继承权限</h3>
                  <p className='mt-0.5 text-sm text-slate-500 dark:text-slate-400'>
                    继承权限为只读，请在来源用户组中修改
                  </p>
                </div>
                {inheritedGrants.length > 0 ? (
                  <div className='space-y-2'>
                    {inheritedGrants.map((grant, index) => {
                      const definition = catalog.find((entry) => entry.key === grant.permission);
                      return (
                        <div
                          key={`${grant.sourceGroupId}-${grant.permission}-${grant.scope}-${grant.resourceType}-${grant.resourceId}-${index}`}
                          className='flex flex-wrap items-center justify-between gap-2 rounded-lg border border-indigo-100 bg-indigo-50/60 px-3 py-2.5 text-sm dark:border-indigo-900/50 dark:bg-indigo-950/20'
                        >
                          <span className='font-medium text-slate-700 dark:text-slate-200'>
                            {definition?.category} · {definition?.label_zh ?? grant.permission}
                          </span>
                          <span className='text-xs text-slate-500 dark:text-slate-400'>
                            {scopeLabel(grant)} · 来自 {grant.sourceGroupName}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className='rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400'>
                    未继承任何权限
                  </div>
                )}
              </section>

              <section className='border-t border-slate-200 pt-6 dark:border-slate-700'>
                <div className='mb-4 flex flex-wrap items-end justify-between gap-3'>
                  <div>
                    <h3 className='font-semibold text-slate-900 dark:text-white'>权限授权</h3>
                    <p className='mt-0.5 text-sm text-slate-500 dark:text-slate-400'>
                      控制此组可执行的操作与生效范围
                    </p>
                  </div>
                  {canManage && catalog[0] && (
                    <Button
                      size='sm'
                      variant='secondary'
                      leadingIcon={<PlusIcon size={16} />}
                      onClick={() => {
                        const definition =
                          catalog.find(
                            (entry) =>
                              !isGrantCovered(emptyGrant(entry.key), inheritedPermissionGrants)
                          ) ?? catalog[0]!;
                        const nextGrant = emptyGrant(definition.key);
                        if (!isGrantCovered(nextGrant, inheritedPermissionGrants)) {
                          setGrants((current) => [...current, nextGrant]);
                        }
                      }}
                    >
                      添加授权
                    </Button>
                  )}
                </div>

                <div className='space-y-3'>
                  {grants.map((grant, index) => {
                    const definition = catalog.find((entry) => entry.key === grant.permission);
                    return (
                      <div
                        key={`${grant.permission}-${index}`}
                        className='rounded-xl border border-slate-200 bg-slate-50/70 p-3 sm:p-4 dark:border-slate-700 dark:bg-slate-900/30'
                      >
                        <div className='mb-3 flex items-center justify-between gap-3'>
                          <span className='inline-flex size-7 items-center justify-center rounded-lg bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'>
                            {index + 1}
                          </span>
                          {canManage && (
                            <Button
                              variant='unstyled'
                              type='button'
                              className='inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30'
                              onClick={() =>
                                setGrants((current) => current.filter((_, i) => i !== index))
                              }
                            >
                              <TrashIcon size={15} />
                              移除
                            </Button>
                          )}
                        </div>
                        <div className='grid gap-3 md:grid-cols-2 xl:grid-cols-4'>
                          <label className='xl:col-span-2'>
                            <span className='mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400'>
                              权限
                            </span>
                            <FormSelect
                              value={grant.permission}
                              disabled={!canManage}
                              onChange={(e) =>
                                updateGrant(index, {
                                  permission: e.target.value as PermissionGrant['permission'],
                                })
                              }
                            >
                              {catalog.map((entry) => (
                                <option key={entry.key} value={entry.key}>
                                  {entry.category} · {entry.label_zh}
                                </option>
                              ))}
                            </FormSelect>
                          </label>
                          <label>
                            <span className='mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400'>
                              生效范围
                            </span>
                            <FormSelect
                              value={grant.scope}
                              disabled={!canManage || definition?.global_only}
                              onChange={(e) =>
                                updateGrant(index, { scope: e.target.value as PermissionScope })
                              }
                            >
                              <option value='global'>全局</option>
                              <option value='resource_type'>资源类型</option>
                              <option value='resource'>指定资源</option>
                            </FormSelect>
                          </label>
                          {grant.scope !== 'global' && (
                            <label>
                              <span className='mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400'>
                                资源类型
                              </span>
                              <FormInput
                                list='permission-resource-types'
                                value={grant.resourceType ?? ''}
                                disabled={!canManage}
                                placeholder='如 characters'
                                onChange={(e) =>
                                  updateGrant(index, { resourceType: e.target.value })
                                }
                              />
                            </label>
                          )}
                          {grant.scope === 'resource' && (
                            <label className='md:col-span-2 xl:col-span-4'>
                              <span className='mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400'>
                                指定资源
                              </span>
                              <FormInput
                                list={`permission-resource-ids-${index}`}
                                value={grant.resourceId ?? ''}
                                disabled={!canManage}
                                placeholder='搜索或输入稳定资源 ID'
                                onChange={(e) => updateGrant(index, { resourceId: e.target.value })}
                              />
                              <datalist id={`permission-resource-ids-${index}`}>
                                {(resourceOptions[grant.resourceType ?? ''] ?? []).map((option) => (
                                  <option key={option.id} value={option.id} label={option.label} />
                                ))}
                              </datalist>
                            </label>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {grants.length === 0 && (
                    <div className='rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center dark:border-slate-700'>
                      <p className='font-medium text-slate-700 dark:text-slate-200'>暂无授权</p>
                      <p className='mt-1 text-sm text-slate-500 dark:text-slate-400'>
                        此用户组目前不包含任何操作权限
                      </p>
                    </div>
                  )}
                </div>
              </section>

              {message && (
                <p
                  role='status'
                  className='rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300'
                >
                  {message}
                </p>
              )}
              <datalist id='permission-resource-types'>
                {SCOPABLE_RESOURCE_TYPES.map((type) => (
                  <option key={type} value={type} />
                ))}
                {SCOPABLE_RESOURCE_TYPES.map((type) => (
                  <option key={`comments/${type}`} value={`comments/${type}`} />
                ))}
              </datalist>
              {canManage && (
                <div className='flex flex-col-reverse gap-2 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end dark:border-slate-700'>
                  <Button
                    variant='danger'
                    disabled={
                      selected.isProtected ||
                      selected.isDefault ||
                      selected.memberCount > 0 ||
                      childGroups.length > 0
                    }
                    onClick={deleteGroup}
                    leadingIcon={<TrashIcon size={16} />}
                  >
                    删除用户组
                  </Button>
                  <Button loading={isSaving} onClick={save}>
                    保存更改
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
