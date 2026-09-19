import 'server-only';

import { notifyArticleVersionSubscribers, publishNotification } from '@/lib/notificationUtils';
import { getPublicUserSubmissionHref } from '@/lib/users/publicProfile';
import type { Database } from '@/data/database.generated';

type ArticleOutcome = {
  articleId: string;
  versionId: string;
  userId: string;
  title: string;
  status: Database['public']['Enums']['version_status'];
} & (
  | { source: 'create' | 'edit'; categoryId: string }
  | { source: 'moderation'; feedback: string | null }
);

/** Optional delivery must never turn a committed article write into a failed submission. */
export async function notifyArticleOutcome(outcome: ArticleOutcome): Promise<void> {
  const { articleId, versionId, userId, title, status, source } = outcome;
  try {
    if (status === 'pending' && source !== 'moderation') {
      await notifyArticleVersionSubscribers({
        actorUserId: userId,
        articleId,
        articleTitle: title,
        proposedCategoryId: outcome.categoryId,
        versionId,
      });
      return;
    }
    if (status !== 'approved' && status !== 'rejected') return;

    const approved = status === 'approved';
    const manual = source === 'moderation';
    let href: string | undefined = approved ? `/articles/${articleId}/` : '/articles/pending/';
    if (manual && !approved) {
      href = undefined;
      try {
        href = (await getPublicUserSubmissionHref(userId, versionId)) ?? undefined;
      } catch (error) {
        console.error('Failed to build contribution profile link:', error);
      }
    }
    const subject = source === 'edit' ? '文章修改' : '文章';
    const introduction = source === 'edit' ? `您对《${title}》的修改` : `您的文章《${title}》`;
    const decision = approved
      ? `已${manual ? '' : '自动'}通过审核并发布。`
      : `未通过${manual ? '' : '自动'}审核。`;
    const feedback = manual && outcome.feedback ? `审核反馈：${outcome.feedback}` : '';
    await publishNotification({
      recipientUserId: userId,
      kind: approved ? 'article_version_approved' : 'article_version_rejected',
      decisionOrigin: manual ? 'manual' : 'automatic',
      title: approved ? `${subject}已${manual ? '' : '自动'}通过审核` : `${subject}未通过审核`,
      body: `${introduction}${decision}${feedback}`,
      ...(href ? { href } : {}),
      sourceIds: [versionId],
      dedupeKey: `article-version:${versionId}:${status}`,
    });
  } catch (error) {
    console.error('Article outcome notification failed:', { articleId, versionId, status, error });
  }
}
