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
import { ARTICLE_VERSION_CONFLICT_MESSAGE } from '@/lib/articles/versionConflict';
import { fetchJson } from '@/lib/fetchJson';
import {
  clearPublishOperation,
  getOrCreatePublishOperationId,
  hasPublishOperation,
  PublishOperationConflictError,
  readPublishOperation,
} from '@/lib/gameData/publishOperation';
import { normalizeHeadingLevels } from '@/lib/richTextUtils';
import {
  getOptionalSupabaseBrowserClient,
  requireSupabaseBrowserClient,
} from '@/lib/supabase/browserClient';
import { useClearArticleClientCache } from '@/hooks/useClearArticleClientCache';
import { useContributionSubmissionFeedback } from '@/hooks/useContributionSubmissionFeedback';
import { useToast } from '@/context/ToastContext';
import { ARTICLE_EDITOR_PLACEHOLDER } from '@/constants/articles';
import type { ArticleRecovery } from '@/features/articles/components/ArticleSubmissionRecovery';

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
  baseVersionId: null,
  baseVersionKnown: true,
  pendingVersionId: null,
  pendingRevision: null,
  sourcePendingVersionId: null,
};

export function useArticleAuthoring(options: AuthoringOptions) {
  const router = useRouter();
  const { error: showError, warning } = useToast();
  const showSubmissionFeedback = useContributionSubmissionFeedback();
  const clearArticleClientCache = useClearArticleClientCache();
  const pending = useRef(false);
  const completed = useRef(false);
  const attempt = useRef<{
    scope: string;
    operationId: string;
    body: string;
    uncertain: boolean;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [draft, setDraft] = useState(emptyDraft);
  const [original, setOriginal] = useState<ArticleDraft | null>(null);
  const [selectedSource, setSelectedSource] = useState<EditSourceKey>('approved');
  const [sourceChange, setSourceChange] = useState<EditSourceKey | null>(null);
  const [recovery, setRecovery] = useState<ArticleRecovery | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasConflict, setHasConflict] = useState(false);
  const [reconciliation, setReconciliation] = useState<ArticleEditInfoResponse | null>(null);
  const info = options.kind === 'edit' ? options.info : undefined;
  const showCharacterSelector =
    options.categories.find((category) => category.id === draft.category)?.requires_character ??
    false;

  const articleId = options.kind === 'edit' ? options.articleId : null;
  useEffect(() => {
    let active = true;
    const client = getOptionalSupabaseBrowserClient();
    if (!client) return;
    void client.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!active || !session) return;
        const scope = articleId
          ? 'article:edit:' + session.user.id + ':' + articleId
          : 'article:create:' + session.user.id;
        const saved = readPublishOperation(scope);
        if (saved && !attempt.current && !completed.current) {
          attempt.current = {
            scope,
            operationId: saved.operationId,
            body: saved.fingerprint,
            uncertain: true,
          };
          setRecovery({ status: 'pending' });
        }
      })
      .catch((error) => console.error('Failed to check article submission recovery:', error));
    return () => {
      active = false;
    };
  }, [articleId]);

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
    setHasConflict(false);
    setReconciliation(null);
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
    if (options.kind === 'edit' && (!draft.baseVersionKnown || hasConflict))
      return ARTICLE_VERSION_CONFLICT_MESSAGE;
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

  const submit = async (recoverOriginal = false) => {
    if (
      pending.current ||
      completed.current ||
      sourceChange ||
      (!recoverOriginal && options.isLoadingCategories)
    )
      return;
    const validationError = recoverOriginal ? null : validateDraft();
    setError(validationError);
    if (validationError) return;
    const submission = options;
    pending.current = true;
    setIsSubmitting(true);

    let committed = false;
    try {
      const {
        data: { session },
      } = await requireSupabaseBrowserClient().auth.getSession();
      if (!session) {
        showError('请登录后再提交文章。');
        return;
      }
      const scope =
        submission.kind === 'create'
          ? 'article:create:' + session.user.id
          : 'article:edit:' + session.user.id + ':' + submission.articleId;
      const body = JSON.stringify({
        title: draft.title.trim(),
        category: draft.category,
        content: draft.content,
        character_id: showCharacterSelector ? draft.characterId : undefined,
        ...(submission.kind === 'edit' && {
          commit_message: draft.commitMessage.trim(),
          base_version_id: draft.baseVersionId,
          pending_version_id: draft.pendingVersionId,
          pending_revision: draft.pendingRevision,
          source_pending_version_id: draft.sourcePendingVersionId,
        }),
      });
      if (
        attempt.current &&
        (attempt.current.scope !== scope || (!recoverOriginal && attempt.current.body !== body))
      )
        throw new PublishOperationConflictError();
      if (recoverOriginal && !attempt.current) return;
      const existingOperation = hasPublishOperation(scope);
      attempt.current ??= {
        scope,
        body,
        operationId: getOrCreatePublishOperationId(scope, body),
        uncertain: existingOperation,
      };
      const response = await fetch(
        submission.kind === 'create'
          ? '/api/articles/submit'
          : '/api/articles/' + submission.articleId + '/edit',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': attempt.current.operationId,
          },
          body: attempt.current.body,
        }
      );

      if (response.ok) {
        committed = true;
        completed.current = true;
        const result = (await response.json().catch(() => null)) as ArticleMutationResult | null;
        if (!result?.article_id || !result.version_id) {
          completed.current = false;
          attempt.current.uncertain = true;
          setRecovery({ status: 'pending' });
          showSubmissionFeedback(articleSubmissionMessage(result));
          return;
        }
        clearPublishOperation(scope);
        const refreshWarning = await clearArticleClientCache(
          result?.article_id ?? (submission.kind === 'edit' ? submission.articleId : undefined)
        );
        const message = [articleSubmissionMessage(result), refreshWarning]
          .filter(Boolean)
          .join('\n');
        if (recoverOriginal) {
          setRecovery({ status: 'confirmed', articleId: result.article_id });
          showSubmissionFeedback(message);
          return;
        }
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
        if (
          response.status >= 400 &&
          response.status < 500 &&
          response.status !== 408 &&
          (!attempt.current.uncertain ||
            errorData.code === 'invalid_article_body' ||
            errorData.code === 'article_edit_conflict')
        ) {
          clearPublishOperation(scope);
          attempt.current = null;
          setRecovery(null);
        } else if (attempt.current) {
          attempt.current.uncertain = true;
          setRecovery({ status: 'pending' });
        }
        if (errorData.code === 'article_edit_conflict') {
          setHasConflict(true);
          setReconciliation(null);
          setError(ARTICLE_VERSION_CONFLICT_MESSAGE);
        }
        showError(
          errorData.error ||
            errorData.message ||
            (submission.kind === 'create' ? '提交文章失败' : '更新文章失败')
        );
      }
    } catch (error) {
      if (error instanceof PublishOperationConflictError) {
        setRecovery({ status: 'pending' });
        showError('上次提交结果尚未确认，请使用“重试原始提交”确认结果。当前修改已保留。');
        return;
      }
      if (attempt.current && !committed) {
        attempt.current.uncertain = true;
        setRecovery({ status: 'pending' });
      }
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
    submit: () => submit(false),
    recoverSubmission: () => submit(true),
    recovery,
    needsReconciliation: hasConflict || (original !== null && !draft.baseVersionKnown),
    reconciliation,
    loadReconciliation: async () => {
      if (options.kind !== 'edit' || pending.current || attempt.current) return;
      pending.current = true;
      setIsSubmitting(true);
      try {
        const latest = await fetchJson<ArticleEditInfoResponse>(
          '/api/articles/' + options.articleId + '/info'
        );
        setReconciliation(latest);
      } catch (error) {
        console.error('Failed to load article for reconciliation:', error);
        showError('无法获取最新版本，请稍后重试。当前草稿已保留。');
      } finally {
        pending.current = false;
        setIsSubmitting(false);
      }
    },
    confirmReconciliation: () => {
      if (!reconciliation || pending.current || attempt.current) return;
      // Adopt only the exact snapshot shown for review, even if publication changed again.
      setDraft((current) => ({
        ...current,
        baseVersionId: reconciliation.edit_sources.approved?.version_id ?? null,
        baseVersionKnown: true,
        pendingVersionId: reconciliation.edit_sources.pending_mine?.version_id ?? null,
        pendingRevision: reconciliation.edit_sources.pending_mine?.draft_revision ?? null,
        sourcePendingVersionId: null,
      }));
      setHasConflict(false);
      setReconciliation(null);
      setError(null);
    },
    releaseSubmission: () => {
      if (pending.current || !attempt.current || completed.current) return;
      clearPublishOperation(attempt.current.scope);
      attempt.current = null;
      setRecovery(null);
    },
    isSubmitting,
  };
}
