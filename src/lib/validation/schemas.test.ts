import {
  ARTICLE_COMMIT_MESSAGE_MAX_LENGTH,
  ARTICLE_CONTENT_MAX_LENGTH,
  ARTICLE_TITLE_MAX_LENGTH,
  articleEditSchema,
  articleSubmitSchema,
} from './schemas';

const CATEGORY_ID = '11111111-1111-4111-8111-111111111111';

const validArticle = {
  title: '测试文章',
  category: CATEGORY_ID,
  content: '<p>文章内容</p>',
};

describe('article write schemas', () => {
  it('normalizes an omitted character to null', () => {
    expect(articleSubmitSchema.parse(validArticle)).toEqual({
      ...validArticle,
      character_id: null,
    });
  });

  it('rejects malformed category IDs and non-string fields', () => {
    expect(articleSubmitSchema.safeParse({ ...validArticle, category: 'category-1' }).success).toBe(
      false
    );
    expect(articleSubmitSchema.safeParse({ ...validArticle, title: 123 }).success).toBe(false);
    expect(articleSubmitSchema.safeParse({ ...validArticle, content: {} }).success).toBe(false);
  });

  it('enforces title and content limits', () => {
    expect(
      articleSubmitSchema.safeParse({
        ...validArticle,
        title: 'a'.repeat(ARTICLE_TITLE_MAX_LENGTH + 1),
      }).success
    ).toBe(false);
    expect(
      articleSubmitSchema.safeParse({
        ...validArticle,
        content: 'a'.repeat(ARTICLE_CONTENT_MAX_LENGTH + 1),
      }).success
    ).toBe(false);
  });

  it('requires a bounded string commit message for edits', () => {
    expect(articleEditSchema.safeParse(validArticle).success).toBe(false);
    expect(
      articleEditSchema.safeParse({ ...validArticle, commit_message: { text: 'invalid' } }).success
    ).toBe(false);
    expect(
      articleEditSchema.safeParse({
        ...validArticle,
        commit_message: 'a'.repeat(ARTICLE_COMMIT_MESSAGE_MAX_LENGTH + 1),
      }).success
    ).toBe(false);
    expect(
      articleEditSchema.safeParse({ ...validArticle, commit_message: ' 补充说明 ' }).data
        ?.commit_message
    ).toBe('补充说明');
  });
});
