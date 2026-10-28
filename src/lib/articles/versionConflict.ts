export const ARTICLE_VERSION_CONFLICT_MESSAGE =
  '文章或待审核版本已变化，或旧草稿的编辑起点未知。当前草稿已保留，请核对最新版本后重新提交。';

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
