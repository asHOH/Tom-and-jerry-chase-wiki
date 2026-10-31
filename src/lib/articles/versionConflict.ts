export const ARTICLE_VERSION_CONFLICT_MESSAGE =
  '文章或待审核版本已变化，或旧草稿的编辑起点未知。当前草稿已保留，请核对最新版本后重新提交。';

export const ARTICLE_MODERATION_UNKNOWN_BASE_MESSAGE =
  '此提交的编辑起点未知，请联系管理员核验历史版本并修复后重试审核。原提交内容已保留。';

export const ARTICLE_MODERATION_OUTDATED_BASE_MESSAGE =
  '公开版本已变化，此提交的编辑起点已过期。请先核对并合并最新内容，再提交新版本审核。原提交内容已保留。';

export const ARTICLE_MODERATION_CONFLICT_MESSAGE =
  '该待审核版本的编辑起点需要核对。请联系管理员核验历史版本，或由提交者核对最新内容、更新编辑起点并重新提交。原提交内容已保留。';

export class ArticleVersionConflictError extends Error {
  constructor() {
    super(ARTICLE_VERSION_CONFLICT_MESSAGE);
  }
}

export class ArticleRefreshRequiredError extends Error {
  constructor() {
    super('请保存当前草稿并刷新编辑页面，以获取文章版本信息。');
  }
}
