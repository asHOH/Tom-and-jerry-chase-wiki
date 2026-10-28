'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  resolveEditFormState,
  type ArticleEditInfoResponse,
  type EditFormState,
  type EditSourceKey,
} from '@/lib/articles/editSources';
import {
  articleSubmissionMessage,
  type ArticleMutationResult,
} from '@/lib/articles/mutationResult';
import { normalizeHeadingLevels } from '@/lib/richTextUtils';
import { useClearArticleClientCache } from '@/hooks/useClearArticleClientCache';
import { useContributionSubmissionFeedback } from '@/hooks/useContributionSubmissionFeedback';
import { useToast } from '@/context/ToastContext';
import { ARTICLE_EDITOR_PLACEHOLDER } from '@/constants/articles';

type ArticleDraft = EditFormState & { commitMessage: string };
type AuthoringOptions = {
  categories: readonly { id: string; requires_character: boolean }[];
  isLoadingCategories: boolean;
} & (
  | { kind: 'create' }
  | { kind: 'edit'; articleId: string; info: ArticleEditInfoResponse | undefined }
);

const emptyDraft: ArticleDraft = {
  title: '',
  category: '',
  content: '',
  characterId: null,
  commitMessage: '',
};

export function useArticleAuthoring(options: AuthoringOptions) {
  const router = useRouter();
  const { error: showError, warning } = useToast();
  const showSubmissionFeedback = useContributionSubmissionFeedback();
  const clearArticleClientCache = useClearArticleClientCache();
  const pending = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [draft, setDraft] = useState(emptyDraft);
  const [original, setOriginal] = useState<ArticleDraft | null>(null);
  const [selectedSource, setSelectedSource] = useState<EditSourceKey>('approved');
  const [sourceChange, setSourceChange] = useState<EditSourceKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const info = options.kind === 'edit' ? options.info : undefined;
  const showCharacterSelector =
    options.categories.find((category) => category.id === draft.category)?.requires_character ??
    false;

  const applySource = (source: EditSourceKey) => {
    if (!info) return;
    const values = resolveEditFormState(info, source);
    if (!values) return;
    const next = {
      ...values,
      content: normalizeHeadingLevels(values.content),
      commitMessage: '',
    };
    setDraft(next);
    setOriginal(next);
    setSelectedSource(
      info.edit_sources[source] ? source : source === 'approved' ? 'pending_mine' : 'approved'
    );
    setError(null);
  };

  useEffect(() => {
    if (info && !original) applySource(info.policy.default_source);
  });

  const updateDraft = (patch: Partial<ArticleDraft>, origin?: 'sync') => {
    if (origin === 'sync' && patch.content !== undefined) {
      const content = patch.content;
      setOriginal((baseline) =>
        baseline && baseline.content === draft.content ? { ...baseline, content } : baseline
      );
    }
    setDraft((current) => ({
      ...current,
      ...patch,
      ...(patch.category !== undefined &&
      !options.categories.find((category) => category.id === patch.category)?.requires_character
        ? { characterId: null }
        : {}),
    }));
  };

  const selectSource = (source: EditSourceKey) => {
    if (pending.current || source === selectedSource) return;
    if (
      original &&
      Object.keys(original).some(
        (key) => draft[key as keyof ArticleDraft] !== original[key as keyof ArticleDraft]
      )
    ) {
      setSourceChange(source);
    } else {
      applySource(source);
    }
  };

  const resolveSourceChange = (discard: boolean) => {
    if (pending.current) return;
    if (discard && sourceChange) applySource(sourceChange);
    setSourceChange(null);
  };

  const validateDraft = (): string | null => {
    if (options.kind === 'edit' && !original) return '无法加载文章，请刷新页面重试';
    if (options.categories.length === 0) return '无法加载分类信息，请刷新页面重试';
    if (draft.category && !options.categories.some((category) => category.id === draft.category))
      return '未能匹配到所选分类，请刷新页面后重试';
    if (!draft.title.trim()) return '请输入文章标题';
    if (!draft.category) return '请选择文章分类';
    if (showCharacterSelector && !draft.characterId) return '角色攻略文章需要选择一个关联角色';
    const strippedContent = draft.content
      .replace(/<br\s*\/?>(?=\s*<\/p>|\s*$)/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;|\s+/g, '')
      .trim();
    if (!strippedContent || strippedContent === ARTICLE_EDITOR_PLACEHOLDER.replace(/\s+/g, ''))
      return '请输入文章内容';
    if (options.kind === 'edit' && !draft.commitMessage.trim()) return '请填写提交说明';
    return null;
  };

  const submit = async () => {
    if (pending.current || options.isLoadingCategories || sourceChange) return;
    const validationError = validateDraft();
    setError(validationError);
    if (validationError) return;
    const submission = options;
    pending.current = true;
    setIsSubmitting(true);

    let committed = false;
    try {
      const response = await fetch(
        submission.kind === 'create'
          ? '/api/articles/submit'
          : `/api/articles/${submission.articleId}/edit`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: draft.title.trim(),
            category: draft.category,
            content: draft.content,
            character_id: showCharacterSelector ? draft.characterId : undefined,
            ...(submission.kind === 'edit' && {
              commit_message: draft.commitMessage.trim(),
            }),
          }),
        }
      );

      if (response.ok) {
        committed = true;
        const result = (await response.json().catch(() => null)) as ArticleMutationResult | null;
        const refreshWarning = await clearArticleClientCache(
          result?.article_id ?? (submission.kind === 'edit' ? submission.articleId : undefined)
        );
        const message = [articleSubmissionMessage(result), refreshWarning]
          .filter(Boolean)
          .join('\n');
        if (result?.status === 'approved' && result.article_id) {
          // A document navigation also drops previously visited Router Cache entries.
          window.alert(message);
          window.location.assign(`/articles/${encodeURIComponent(result.article_id)}/`);
        } else {
          showSubmissionFeedback(message);
          router.push('/articles');
        }
      } else {
        const errorData = await response.json();
        showError(
          errorData.error ||
            errorData.message ||
            (submission.kind === 'create' ? '提交文章失败' : '更新文章失败')
        );
      }
    } catch (error) {
      if (committed) {
        console.error('Article saved but feedback/navigation failed:', error);
        warning('提交已成功，页面跳转失败。请刷新页面或查看我的贡献，请勿重复提交。', 8000);
      } else {
        console.error(
          submission.kind === 'create' ? 'Error submitting article:' : 'Error updating article:',
          error
        );
        showError(
          submission.kind === 'create'
            ? '提交文章时发生错误，请稍后重试'
            : '更新文章时发生错误，请稍后重试'
        );
      }
    } finally {
      pending.current = false;
      setIsSubmitting(false);
    }
  };

  return {
    draft,
    updateDraft,
    error,
    showCharacterSelector,
    selectedSource,
    sourceChange,
    selectSource,
    resolveSourceChange,
    submit,
    isSubmitting,
  };
}
