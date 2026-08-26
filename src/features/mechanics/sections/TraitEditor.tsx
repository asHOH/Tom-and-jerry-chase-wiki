'use client';

import { useEffect, useMemo, useState } from 'react';

import { useActiveEditRuntime } from '@/lib/edit/activeEditRuntime';
import { useToast } from '@/context/ToastContext';
import type { FactionId, SingleItemOrGroup, Trait, TraitGroup } from '@/data/types';
import Button from '@/components/ui/Button';
import { FormInput, FormSelect, FormTextarea } from '@/components/ui/FormControls';
import { PendingActionWarningBoundary } from '@/components/ui/PendingActionWarning';
import { PlusIcon, TrashIcon } from '@/components/icons/CommonIcons';

const ITEM_TYPE_OPTIONS = [
  ['character', '角色'],
  ['skill', '技能'],
  ['knowledgeCard', '知识卡'],
  ['specialSkill', '特技'],
  ['item', '道具'],
  ['entity', '衍生物'],
  ['buff', '状态'],
  ['map', '地图'],
  ['fixture', '地图组件'],
  ['mode', '游戏模式'],
  ['achievement', '对局成就'],
  ['itemGroup', '组合'],
] as const;

type MutableTraitGroupItem = TraitGroup[number];

function createEmptyItem(): SingleItemOrGroup {
  return { name: '', type: 'character' };
}

function generateTraitId(existingIds: readonly string[]): string {
  const date = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(new Date())
    .replaceAll('-', '');
  const existing = new Set(existingIds);
  for (let index = 1; index <= 99; index += 1) {
    const candidate = `${date}-${String(index).padStart(2, '0')}`;
    if (!existing.has(candidate)) return candidate;
  }
  return `${date}-${Date.now()}`;
}

function TraitItemEditor({ item, onRemove }: { item: SingleItemOrGroup; onRemove: () => void }) {
  return (
    <div className='border-border bg-surface-raised grid gap-2 rounded-lg border p-2 sm:grid-cols-[minmax(0,1fr)_10rem_7rem_auto]'>
      <FormInput
        size='sm'
        aria-label='成员名称'
        placeholder='成员名称'
        value={item.name}
        invalid={!item.name.trim()}
        onChange={(event) => {
          item.name = event.target.value;
        }}
      />
      <FormSelect
        size='sm'
        aria-label='成员类型'
        value={item.type}
        onChange={(event) => {
          item.type = event.target.value as SingleItemOrGroup['type'];
          if (item.type === 'itemGroup') delete (item as { factionId?: FactionId }).factionId;
        }}
      >
        {ITEM_TYPE_OPTIONS.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </FormSelect>
      <FormSelect
        size='sm'
        aria-label='成员阵营'
        value={'factionId' in item ? (item.factionId ?? '') : ''}
        disabled={item.type === 'itemGroup'}
        onChange={(event) => {
          if (item.type === 'itemGroup') return;
          if (event.target.value === 'cat' || event.target.value === 'mouse') {
            item.factionId = event.target.value;
          } else {
            delete item.factionId;
          }
        }}
      >
        <option value=''>通用</option>
        <option value='cat'>猫阵营</option>
        <option value='mouse'>鼠阵营</option>
      </FormSelect>
      <Button variant='danger' size='sm' onClick={onRemove} aria-label='删除成员' className='px-2'>
        <TrashIcon className='h-4 w-4' />
      </Button>
    </div>
  );
}

function TraitGroupEditor({ group }: { group: TraitGroup }) {
  const removeItem = (groupIndex: number, alternativeIndex: number) => {
    const groupItem = group[groupIndex];
    if (!Array.isArray(groupItem)) {
      group.splice(groupIndex, 1);
      return;
    }

    groupItem.splice(alternativeIndex, 1);
    if (groupItem.length === 0) group.splice(groupIndex, 1);
    else if (groupItem.length === 1) group[groupIndex] = groupItem[0]!;
  };

  const addAlternative = (groupIndex: number) => {
    const groupItem = group[groupIndex];
    if (!groupItem) return;
    if (Array.isArray(groupItem)) groupItem.push(createEmptyItem());
    else group[groupIndex] = [groupItem, createEmptyItem()];
  };

  return (
    <div className='space-y-3'>
      {group.map((groupItem, groupIndex) => {
        const alternatives = Array.isArray(groupItem) ? groupItem : [groupItem];
        return (
          <div key={groupIndex} className='border-border bg-surface rounded-xl border p-3'>
            <div className='mb-2 flex items-center justify-between gap-2'>
              <span className='text-muted-foreground text-xs font-medium'>
                关联组 {groupIndex + 1}
                {alternatives.length > 1 ? ' (任一成员)' : ''}
              </span>
              <Button variant='secondary' size='sm' onClick={() => addAlternative(groupIndex)}>
                添加或选项
              </Button>
            </div>
            <div className='space-y-2'>
              {alternatives.map((item, alternativeIndex) => (
                <TraitItemEditor
                  key={alternativeIndex}
                  item={item}
                  onRemove={() => removeItem(groupIndex, alternativeIndex)}
                />
              ))}
            </div>
          </div>
        );
      })}
      <Button
        variant='secondary'
        size='sm'
        leadingIcon={<PlusIcon className='h-4 w-4' />}
        onClick={() => group.push(createEmptyItem() as MutableTraitGroupItem)}
      >
        添加关联组
      </Button>
    </div>
  );
}

function TraitCard({
  traitId,
  trait,
  traits,
}: {
  traitId: string;
  trait: Trait;
  traits: Record<string, Trait>;
}) {
  const { error, info } = useToast();
  const [draftId, setDraftId] = useState(traitId);

  useEffect(() => setDraftId(traitId), [traitId]);

  const commitRename = () => {
    const nextId = draftId.trim();
    if (!nextId) {
      setDraftId(traitId);
      error('特性编号不能为空');
      return;
    }
    if (nextId === traitId) return;
    if (traits[nextId]) {
      setDraftId(traitId);
      error(`特性编号 ${nextId} 已存在`);
      return;
    }
    traits[nextId] = trait;
    delete traits[traitId];
    info(`已将特性重命名为 ${nextId}`);
  };

  return (
    <PendingActionWarningBoundary descriptors={[{ op: 'set', path: traitId, hasNewValue: true }]}>
      <details className='border-border bg-surface-raised group rounded-xl border shadow-sm'>
        <summary className='flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 select-none'>
          <span className='min-w-0 truncate font-semibold'>{traitId}</span>
          <span className='text-muted-foreground line-clamp-1 min-w-0 flex-1 text-right text-sm'>
            {trait.description || '尚未填写描述'}
          </span>
        </summary>
        <div className='border-border space-y-5 border-t p-4'>
          <div className='grid gap-4 md:grid-cols-[minmax(0,1fr)_12rem_auto]'>
            <label className='space-y-1 text-sm font-medium'>
              <span>特性编号</span>
              <FormInput
                value={draftId}
                invalid={!draftId.trim()}
                onChange={(event) => setDraftId(event.target.value)}
                onBlur={commitRename}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') event.currentTarget.blur();
                }}
              />
            </label>
            <label className='space-y-1 text-sm font-medium'>
              <span>拆解时排除阵营</span>
              <FormSelect
                value={trait.excludeFactionId ?? ''}
                onChange={(event) => {
                  const value = event.target.value;
                  if (value === 'cat' || value === 'mouse') trait.excludeFactionId = value;
                  else delete trait.excludeFactionId;
                }}
              >
                <option value=''>不排除</option>
                <option value='cat'>猫阵营</option>
                <option value='mouse'>鼠阵营</option>
              </FormSelect>
            </label>
            <Button
              variant='danger'
              size='sm'
              className='self-end'
              leadingIcon={<TrashIcon className='h-4 w-4' />}
              onClick={() => {
                if (window.confirm(`确认删除特性 ${traitId} 吗?`)) delete traits[traitId];
              }}
            >
              删除特性
            </Button>
          </div>

          <label className='block space-y-1 text-sm font-medium'>
            <span>描述</span>
            <FormTextarea
              rows={4}
              value={trait.description}
              invalid={!trait.description.trim()}
              onChange={(event) => {
                trait.description = event.target.value;
              }}
            />
          </label>

          <section className='space-y-2'>
            <h3 className='font-semibold'>关联成员</h3>
            <TraitGroupEditor group={trait.group} />
          </section>

          <section className='space-y-3'>
            <div className='flex items-center justify-between gap-3'>
              <h3 className='font-semibold'>特殊情况</h3>
              <Button
                variant='secondary'
                size='sm'
                leadingIcon={<PlusIcon className='h-4 w-4' />}
                onClick={() => {
                  trait.spacialCase ??= [];
                  trait.spacialCase.push({ description: '', group: [] });
                }}
              >
                添加特殊情况
              </Button>
            </div>
            {trait.spacialCase?.map((specialCase, specialCaseIndex) => (
              <div
                key={specialCaseIndex}
                className='border-border bg-surface space-y-3 rounded-xl border p-3'
              >
                <div className='flex items-center justify-between gap-3'>
                  <span className='text-sm font-medium'>特殊情况 {specialCaseIndex + 1}</span>
                  <Button
                    variant='danger'
                    size='sm'
                    onClick={() => {
                      trait.spacialCase?.splice(specialCaseIndex, 1);
                      if (trait.spacialCase?.length === 0) delete trait.spacialCase;
                    }}
                  >
                    删除
                  </Button>
                </div>
                <FormTextarea
                  rows={3}
                  aria-label={`特殊情况 ${specialCaseIndex + 1} 描述`}
                  placeholder='特殊情况描述'
                  value={specialCase.description}
                  invalid={!specialCase.description.trim()}
                  onChange={(event) => {
                    specialCase.description = event.target.value;
                  }}
                />
                <TraitGroupEditor group={specialCase.group} />
              </div>
            ))}
            {!trait.spacialCase?.length ? (
              <p className='text-muted-foreground text-sm'>暂无特殊情况。</p>
            ) : null}
          </section>
        </div>
      </details>
    </PendingActionWarningBoundary>
  );
}

export default function TraitEditor({ traitsSnapshot }: { traitsSnapshot: Record<string, Trait> }) {
  const editRuntime = useActiveEditRuntime();
  const traits = editRuntime?.stores.traits;
  const [query, setQuery] = useState('');

  const filteredEntries = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('zh-CN');
    return Object.entries(traitsSnapshot).filter(([id, trait]) => {
      if (!normalizedQuery) return true;
      const memberNames = [
        ...trait.group.flatMap((item) => (Array.isArray(item) ? item : [item])),
        ...(trait.spacialCase ?? []).flatMap((specialCase) =>
          specialCase.group.flatMap((item) => (Array.isArray(item) ? item : [item]))
        ),
      ]
        .map((item) => item.name)
        .join(' ');
      return `${id} ${trait.description} ${memberNames}`
        .toLocaleLowerCase('zh-CN')
        .includes(normalizedQuery);
    });
  }, [query, traitsSnapshot]);

  if (!traits) {
    return <p className='text-muted-foreground py-8 text-center'>正在加载特性编辑器...</p>;
  }

  return (
    <div className='mx-auto max-w-5xl space-y-4 px-2 py-4 sm:px-4'>
      <div className='border-border bg-surface-raised sticky top-2 z-20 flex flex-col gap-3 rounded-xl border p-3 shadow-md sm:flex-row'>
        <FormInput
          type='search'
          placeholder='搜索编号、描述或成员'
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Button
          className='shrink-0'
          leadingIcon={<PlusIcon className='h-4 w-4' />}
          onClick={() => {
            const id = generateTraitId(Object.keys(traits));
            traits[id] = { description: '', group: [] };
            setQuery(id);
          }}
        >
          新建特性
        </Button>
      </div>
      <p className='text-muted-foreground text-sm'>
        共 {Object.keys(traitsSnapshot).length} 条特性，当前显示 {filteredEntries.length}{' '}
        条。修改会自动保存为本地草稿，并可通过底部工具栏提交在线版本。
      </p>
      <div className='space-y-3'>
        {filteredEntries.map(([traitId, trait]) => (
          <TraitCard
            key={traitId}
            traitId={traitId}
            trait={traits[traitId] ?? trait}
            traits={traits}
          />
        ))}
      </div>
    </div>
  );
}
