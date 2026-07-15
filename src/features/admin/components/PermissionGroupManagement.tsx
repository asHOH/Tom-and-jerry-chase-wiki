'use client';

import { useEffect, useState } from 'react';
import { useSWRConfig } from 'swr';

import type { PermissionResourceOption } from '@/lib/auth/permissionResources';
import type { PermissionGrant, PermissionScope } from '@/lib/auth/permissions';
import { SCOPABLE_RESOURCE_TYPES } from '@/lib/auth/resourceContexts';
import { USER_API_KEY } from '@/hooks/useUser';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { FormInput, FormSelect, FormTextarea } from '@/components/ui/FormControls';

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
  memberCount: number;
  grants: PermissionGrant[];
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
  const [grants, setGrants] = useState<PermissionGrant[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!selected) return;
    setSelectedId(selected.id);
    setName(selected.name);
    setDescription(selected.description);
    setIsDefault(selected.isDefault);
    setGrants(selected.grants);
  }, [selected]);

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
        name: '新权限组',
        description: '',
        isDefault: false,
        grants: [],
      });
      setMessage('权限组已创建');
      await mutateGroups();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '创建失败');
    }
  };

  const save = async () => {
    if (!selected) return;
    try {
      await request(`/api/admin/groups/${selected.id}`, 'PATCH', {
        name,
        description,
        isDefault,
        grants,
      });
      setMessage('权限组已保存');
      await Promise.all([mutateGroups(), mutateCache(USER_API_KEY)]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '保存失败');
    }
  };

  const deleteGroup = async () => {
    if (!selected || !window.confirm(`确认删除权限组“${selected.name}”？`)) return;
    try {
      await request(`/api/admin/groups/${selected.id}`, 'DELETE');
      setSelectedId('');
      setMessage('权限组已删除');
      await Promise.all([mutateGroups(), mutateCache(USER_API_KEY)]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '删除失败');
    }
  };

  const updateGrant = (index: number, patch: Partial<PermissionGrant>) => {
    setGrants((current) =>
      current.map((grant, grantIndex) => {
        if (grantIndex !== index) return grant;
        const next = { ...grant, ...patch };
        if (next.scope === 'global') return { ...next, resourceType: null, resourceId: null };
        if (next.scope === 'resource_type') return { ...next, resourceId: null };
        return next;
      })
    );
  };

  return (
    <div className='grid gap-4 lg:grid-cols-[18rem_1fr]'>
      <Card className='p-4'>
        <div className='mb-3 flex items-center justify-between'>
          <h2 className='text-lg font-semibold'>权限组</h2>
          {canManage && <Button onClick={createGroup}>新建</Button>}
        </div>
        <div className='space-y-2'>
          {groups.map((group) => (
            <button
              key={group.id}
              type='button'
              onClick={() => setSelectedId(group.id)}
              className={`w-full rounded-lg border p-3 text-left ${selected?.id === group.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' : 'border-gray-200 dark:border-slate-700'}`}
            >
              <span className='block font-medium'>{group.name}</span>
              <span className='text-xs text-gray-500'>
                {group.memberCount} 名成员{group.isDefault ? ' · 注册默认' : ''}
              </span>
            </button>
          ))}
        </div>
      </Card>

      <Card className='p-4'>
        {!selected ? (
          <p className='text-gray-500'>暂无权限组</p>
        ) : (
          <div className='space-y-5'>
            <div className='grid gap-3 sm:grid-cols-2'>
              <label>
                <span className='mb-1 block text-sm'>名称</span>
                <FormInput
                  value={name}
                  disabled={!canManage}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <label className='flex items-center gap-2 self-end pb-2'>
                <input
                  type='checkbox'
                  checked={isDefault}
                  disabled={!canManage}
                  onChange={(e) => setIsDefault(e.target.checked)}
                />
                设为注册默认权限组
              </label>
            </div>
            <label>
              <span className='mb-1 block text-sm'>说明</span>
              <FormTextarea
                value={description}
                disabled={!canManage}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>

            <div>
              <div className='mb-2 flex items-center justify-between'>
                <h3 className='font-semibold'>权限授权</h3>
                {canManage && catalog[0] && (
                  <Button
                    onClick={() =>
                      setGrants((current) => [...current, emptyGrant(catalog[0]!.key)])
                    }
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
                      className='rounded-lg border border-gray-200 p-3 dark:border-slate-700'
                    >
                      <div className='grid gap-2 md:grid-cols-2 xl:grid-cols-4'>
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
                        {grant.scope !== 'global' && (
                          <FormInput
                            list='permission-resource-types'
                            value={grant.resourceType ?? ''}
                            disabled={!canManage}
                            placeholder='资源类型，如 characters'
                            onChange={(e) => updateGrant(index, { resourceType: e.target.value })}
                          />
                        )}
                        {grant.scope === 'resource' && (
                          <>
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
                          </>
                        )}
                      </div>
                      {canManage && (
                        <button
                          type='button'
                          className='mt-2 text-sm text-red-600'
                          onClick={() =>
                            setGrants((current) => current.filter((_, i) => i !== index))
                          }
                        >
                          移除授权
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {message && <p className='text-sm text-blue-600 dark:text-blue-300'>{message}</p>}
            <datalist id='permission-resource-types'>
              {SCOPABLE_RESOURCE_TYPES.map((type) => (
                <option key={type} value={type} />
              ))}
              {SCOPABLE_RESOURCE_TYPES.map((type) => (
                <option key={`comments/${type}`} value={`comments/${type}`} />
              ))}
            </datalist>
            {canManage && (
              <div className='flex flex-wrap justify-end gap-2'>
                <Button
                  variant='danger'
                  disabled={selected.isDefault || selected.memberCount > 0}
                  onClick={deleteGroup}
                >
                  删除
                </Button>
                <Button onClick={save}>保存</Button>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
