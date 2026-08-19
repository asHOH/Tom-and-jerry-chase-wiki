'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTheme } from 'next-themes';

import { cn } from '@/lib/design';
import { useAppContext } from '@/context/AppContext';
import { useToast } from '@/context/ToastContext';
import type { MapPointCategory } from '@/data/types';
import {
  ALWAYS_VISIBLE_CATEGORIES,
  MAP_CATEGORY_LABELS,
} from '@/features/maps/interactive-map/mapUtils';
import {
  LOCAL_PREFERENCE_DEFAULTS,
  resetLocalPreferences,
  useLocalPreference,
  type KnowledgeCardViewMode,
  type PositioningTagViewMode,
  type ThemeMode,
} from '@/features/settings/localPreferences';
import {
  clearAllLocalEditDrafts,
  resetGuidanceAndAnnouncements,
  resetMiniGameProgress,
} from '@/features/settings/resetLocalData';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import SectionHeader from '@/components/ui/SectionHeader';

import PreferenceChoice from './PreferenceChoice';

const THEME_OPTIONS = [
  { value: 'system', label: '跟随系统', description: '随设备外观自动切换' },
  { value: 'light', label: '浅色', description: '始终使用浅色界面' },
  { value: 'dark', label: '深色', description: '始终使用深色界面' },
] as const satisfies ReadonlyArray<{ value: ThemeMode; label: string; description: string }>;

const KNOWLEDGE_CARD_OPTIONS = [
  { value: 'tree', label: '图片视图' },
  { value: 'hybrid', label: '混合视图', description: '不支持时自动使用图片视图' },
  { value: 'compact', label: '紧凑视图' },
] as const satisfies ReadonlyArray<{
  value: KnowledgeCardViewMode;
  label: string;
  description?: string;
}>;

const POSITIONING_OPTIONS = [
  { value: 'text', label: '文本' },
  { value: 'bar', label: '柱状图' },
  { value: 'radar', label: '雷达图' },
] as const satisfies ReadonlyArray<{ value: PositioningTagViewMode; label: string }>;

export default function LocalSettings() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { isDetailedView, setDetailedView } = useAppContext();
  const { success, error } = useToast();
  const [articleAutoNumbering, setArticleAutoNumbering] =
    useLocalPreference('articleAutoNumbering');
  const [knowledgeCardViewMode, setKnowledgeCardViewMode] =
    useLocalPreference('knowledgeCardViewMode');
  const [positioningTagViewMode, setPositioningTagViewMode] =
    useLocalPreference('positioningTagViewMode');
  const [visibleMapCategories, setVisibleMapCategories] = useLocalPreference(
    'interactiveMapVisibleCategories'
  );
  const visibleCategorySet = useMemo(() => new Set(visibleMapCategories), [visibleMapCategories]);

  useEffect(() => setMounted(true), []);

  const reportSave = (saved: boolean) => {
    if (!saved) error('设置保存失败，请检查浏览器存储权限。');
  };

  const resetDisplayPreferences = () => {
    const reset = resetLocalPreferences();
    setTheme('system');
    setDetailedView(LOCAL_PREFERENCE_DEFAULTS.detailedView);
    if (reset) success('显示设置已恢复默认值。');
    else error('部分显示设置无法重置。');
  };

  const resetWithFeedback = (reset: () => boolean, successMessage: string) => {
    if (reset()) success(successMessage);
    else error('部分本地数据无法清除。');
  };

  const clearDrafts = () => {
    if (!window.confirm('确认删除此浏览器中的全部编辑草稿？此操作无法撤销。')) return;
    resetWithFeedback(clearAllLocalEditDrafts, '本地编辑草稿已删除。');
  };

  return (
    <div className='space-y-8'>
      <Card as='section' bordered className='space-y-6'>
        <SectionHeader id='display' title='显示设置' variant='compact' />

        {mounted ? (
          <PreferenceChoice
            label='主题'
            value={(theme === 'light' || theme === 'dark' ? theme : 'system') as ThemeMode}
            options={THEME_OPTIONS}
            onChange={setTheme}
          />
        ) : null}

        <PreferenceChoice
          label='描述详细程度'
          value={isDetailedView ? 'detailed' : 'concise'}
          options={[
            { value: 'concise', label: '简明描述' },
            { value: 'detailed', label: '详细描述' },
          ]}
          onChange={(value) => setDetailedView(value === 'detailed')}
        />

        <label className='flex items-start gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700'>
          <input
            type='checkbox'
            checked={articleAutoNumbering}
            onChange={(event) => reportSave(setArticleAutoNumbering(event.target.checked))}
            className='bg-surface-sunken mt-1 size-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600'
          />
          <span>
            <span className='block text-sm font-medium text-gray-900 dark:text-gray-100'>
              文章标题自动编号
            </span>
            <span className='mt-1 block text-xs text-gray-500 dark:text-gray-400'>
              在文章目录和正文标题前显示层级编号。
            </span>
          </span>
        </label>

        <PreferenceChoice
          label='推荐知识卡组视图'
          value={knowledgeCardViewMode}
          options={KNOWLEDGE_CARD_OPTIONS}
          onChange={(value) => reportSave(setKnowledgeCardViewMode(value))}
        />

        <PreferenceChoice
          label='角色定位视图'
          value={positioningTagViewMode}
          options={POSITIONING_OPTIONS}
          onChange={(value) => reportSave(setPositioningTagViewMode(value))}
        />

        <fieldset>
          <legend className='mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100'>
            互动地图默认点位
          </legend>
          <div className='grid gap-2 sm:grid-cols-2'>
            {(Object.keys(MAP_CATEGORY_LABELS) as MapPointCategory[]).map((category) => {
              const alwaysVisible = ALWAYS_VISIBLE_CATEGORIES.has(category);
              const checked = alwaysVisible || visibleCategorySet.has(category);
              return (
                <label
                  key={category}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2.5 dark:border-gray-700',
                    alwaysVisible && 'opacity-70'
                  )}
                >
                  <input
                    type='checkbox'
                    checked={checked}
                    disabled={alwaysVisible}
                    onChange={() => {
                      const next = new Set(visibleCategorySet);
                      if (next.has(category)) next.delete(category);
                      else next.add(category);
                      reportSave(setVisibleMapCategories([...next]));
                    }}
                    className='bg-surface-sunken size-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600'
                  />
                  <span className='text-sm text-gray-800 dark:text-gray-200'>
                    {MAP_CATEGORY_LABELS[category]}
                  </span>
                  {alwaysVisible ? (
                    <span className='ml-auto text-xs text-gray-500'>常驻</span>
                  ) : null}
                </label>
              );
            })}
          </div>
        </fieldset>

        <Button variant='secondary' onClick={resetDisplayPreferences}>
          恢复显示设置默认值
        </Button>
      </Card>

      <Card as='section' bordered>
        <SectionHeader id='local-data' title='本地数据' variant='compact' />
        <p className='mb-4 text-sm leading-6 text-gray-600 dark:text-gray-300'>
          这些数据仅保存在当前浏览器中，不会影响账号或已提交的内容。
        </p>
        <div className='grid gap-3 sm:grid-cols-2'>
          <Button
            variant='secondary'
            onClick={() =>
              resetWithFeedback(resetGuidanceAndAnnouncements, '教程、功能提示和已关闭公告已重置。')
            }
          >
            重置教程、提示和公告
          </Button>
          <Button
            variant='secondary'
            onClick={() => resetWithFeedback(resetMiniGameProgress, '小游戏记录已清除。')}
          >
            清除小游戏记录
          </Button>
        </div>
        <div className='mt-5 border-t border-red-200 pt-5 dark:border-red-900/60'>
          <h3 className='text-sm font-semibold text-red-700 dark:text-red-300'>危险操作</h3>
          <p className='mt-1 mb-3 text-xs leading-5 text-gray-600 dark:text-gray-400'>
            删除当前浏览器中的所有未发布编辑草稿和操作历史，且无法恢复。
          </p>
          <Button variant='danger' onClick={clearDrafts}>
            删除全部本地编辑草稿
          </Button>
        </div>
      </Card>
    </div>
  );
}
