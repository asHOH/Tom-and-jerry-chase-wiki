'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  articleSubmissionMessage,
  type ArticleMutationResult,
} from '@/lib/articles/mutationResult';
import { useClearArticleClientCache } from '@/hooks/useClearArticleClientCache';
import { useContributionSubmissionFeedback } from '@/hooks/useContributionSubmissionFeedback';
import { useToast } from '@/context/ToastContext';

type ArticleDraft = {
  title: string;
  category: string;
  content: string;
  characterId?: string | null | undefined;
};

type ArticleSubmission = { draft: ArticleDraft } & (
  { kind: 'create' } | { kind: 'edit'; articleId: string; commitMessage: string }
);

export function useArticleSubmission() {
  const router = useRouter();
  const { error: showError, warning } = useToast();
  const showSubmissionFeedback = useContributionSubmissionFeedback();
  const clearArticleClientCache = useClearArticleClientCache();
  const pending = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (submission: ArticleSubmission) => {
    if (pending.current) return;
    pending.current = true;
    setIsSubmitting(true);

    let committed = false;
    try {
      const { draft } = submission;
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
            character_id: draft.characterId,
            ...(submission.kind === 'edit' && {
              commit_message: submission.commitMessage.trim(),
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

  return { submit, isSubmitting };
}
