import { ARTICLE_CACHE_REFRESH_WARNING } from '@/constants/articles';
import type { Database } from '@/data/database.generated';

export type ArticleMutationResult = {
  article_id: string;
  version_id: string | null;
  // An edit can commit without returning a version; never invent a publication status.
  status: Database['public']['Enums']['version_status'] | null;
  warning?: 'cache_refresh_failed';
};

export function articleSubmissionMessage(result: ArticleMutationResult | null): string {
  const messages = {
    approved: '提交已自动通过审核并发布。',
    pending: '提交成功，正在等待审核。',
    rejected: '提交已保存，但未通过自动审核。请在我的贡献中查看详情。',
    revoked: '提交版本已撤销，请在我的贡献中查看详情。',
  };
  const message =
    (result?.status && messages[result.status]) ||
    '提交已成功，但未能获取审核状态。请在我的贡献中查看，请勿重复提交。';
  return result?.warning === 'cache_refresh_failed'
    ? `${message}\n${ARTICLE_CACHE_REFRESH_WARNING}`
    : message;
}
