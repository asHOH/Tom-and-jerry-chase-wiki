import 'server-only';

import type { z } from 'zod';

import { CACHE_TAGS } from '@/lib/cacheTags';
import { cached, MAX_SERVER_CACHE_REVALIDATE_SECONDS } from '@/lib/serverCache';
import {
  articleRecordSchema,
  articleVersionSchema,
  formatZodError,
} from '@/lib/validation/schemas';

import { getAdminClient, getPublicReadClient } from './readClient';

export type ArticleBasicInfo = {
  id: string;
  title: string;
  category_id: string;
  author_id: string;
  created_at: string;
  view_count?: number;
  character_id?: string | null;
  categories: { name: string };
  users_public_view: { nickname: string | null } | null;
};

export async function getArticleBasicInfo(articleId: string): Promise<ArticleBasicInfo | null> {
  const supabase = getPublicReadClient();
  if (!supabase) return null;

  return cached(
    ['article', articleId, 'basic'],
    async () => {
      const { data: article } = await supabase
        .from('articles')
        .select(
          `
            id,
            title,
            category_id,
            author_id,
            created_at,
            view_count,
            character_id,
            categories(name),
            users_public_view!author_id(nickname)
          `
        )
        .eq('id', articleId)
        .not('current_version_id', 'is', null)
        .single();

      return (article as unknown as ArticleBasicInfo) ?? null;
    },
    {
      revalidate: 300,
      tags: [CACHE_TAGS.article(articleId), CACHE_TAGS.articles],
    }
  );
}

export type ArticleApprovedVersion = {
  id: string;
  content: string | null;
  created_at: string | null;
  editor_id: string | null;
  users_public_view: { nickname: string | null } | null;
};

export async function getApprovedArticleVersion(args: {
  articleId: string;
  versionId?: string;
}): Promise<ArticleApprovedVersion | null> {
  const supabase = getPublicReadClient();
  if (!supabase) return null;

  const { articleId, versionId } = args;

  return cached(
    ['article', articleId, 'approved-version', versionId ?? 'latest'],
    async () => {
      if (!versionId) {
        const { data: article } = await supabase
          .from('articles')
          .select(
            `
              current_version:article_versions_public_view!articles_current_version_id_fkey(
                id,
                content,
                created_at,
                editor_id,
                users_public_view!editor_id(nickname)
              )
            `
          )
          .eq('id', articleId)
          .single();

        return (article?.current_version as unknown as ArticleApprovedVersion | null) ?? null;
      }

      const query = supabase
        .from('article_versions_public_view')
        .select(
          `
            id,
            content,
            created_at,
            editor_id,
            users_public_view!editor_id(nickname)
          `
        )
        .eq('article_id', articleId)
        .eq('status', 'approved')
        .eq('id', versionId);

      const { data } = await query.limit(1).single();
      return (data as unknown as ArticleApprovedVersion) ?? null;
    },
    {
      revalidate: MAX_SERVER_CACHE_REVALIDATE_SECONDS,
      tags: [CACHE_TAGS.articleVersions(articleId), CACHE_TAGS.article(articleId)],
    }
  );
}

type ArticleDetailValidationDetails = ReturnType<typeof formatZodError>;

export type ArticleDetailData = {
  article: z.infer<typeof articleRecordSchema> & {
    latest_version: z.infer<typeof articleVersionSchema>;
  };
};

export type ArticleDetailError =
  | { error: 'Articles disabled' }
  | { error: 'Article not found' }
  | { error: 'Article data invalid'; details: ArticleDetailValidationDetails }
  | { error: 'No approved version found' }
  | { error: 'Article version data invalid'; details: ArticleDetailValidationDetails };

export async function getArticleDetailData(
  articleId: string
): Promise<ArticleDetailData | ArticleDetailError> {
  const supabase = getPublicReadClient();
  if (!supabase) return { error: 'Articles disabled' };

  return cached(
    ['api', 'articles', articleId],
    async () => {
      const { data: article, error: articleError } = await supabase
        .from('articles')
        .select(
          `
            id,
            title,
            category_id,
            author_id,
            created_at,
            view_count,
            categories(name),
            users_public_view!author_id(nickname),
            current_version:article_versions_public_view!articles_current_version_id_fkey(
              id,
              content,
              created_at,
              editor_id,
              users_public_view!editor_id(nickname)
            )
          `
        )
        .eq('id', articleId)
        .single();

      if (articleError) {
        console.error('Error fetching article:', articleError);
        return { error: 'Article not found' } as const;
      }

      const parsedArticle = articleRecordSchema.safeParse(article);
      if (!parsedArticle.success) {
        console.error('Article payload validation failed', parsedArticle.error.format());
        return {
          error: 'Article data invalid',
          details: formatZodError(parsedArticle.error),
        } as const;
      }

      const currentVersion = article.current_version;
      if (!currentVersion) {
        return { error: 'No approved version found' } as const;
      }

      const parsedVersion = articleVersionSchema.safeParse(currentVersion);
      if (!parsedVersion.success) {
        console.error('Article version payload validation failed', parsedVersion.error.format());
        return {
          error: 'Article version data invalid',
          details: formatZodError(parsedVersion.error),
        } as const;
      }

      return {
        article: {
          ...parsedArticle.data,
          latest_version: parsedVersion.data,
        },
      };
    },
    {
      revalidate: MAX_SERVER_CACHE_REVALIDATE_SECONDS,
      tags: [
        CACHE_TAGS.article(articleId),
        CACHE_TAGS.articleVersions(articleId),
        CACHE_TAGS.articles,
      ],
    }
  );
}

export type ArticleHistoryData = {
  article: {
    id: string;
    title: string;
    categories: { name: string } | null;
  };
  versions: Array<{
    id: string;
    content: string | null;
    created_at: string | null;
    editor_id: string | null;
    status: string | null;
    commit_message: string | null;
    users: { nickname: string | null } | null;
  }>;
  total_count: number;
};

export type ArticleHistoryError =
  | { error: 'Articles disabled' }
  | { error: 'Article not found' }
  | { error: 'Failed to fetch article history' };

type ArticleHistoryArticleRow = {
  id: string;
  title: string;
  categories: { name: string } | null;
};

export async function getArticleHistory(
  articleId: string
): Promise<ArticleHistoryData | ArticleHistoryError> {
  const supabase = getPublicReadClient();
  if (!supabase) return { error: 'Articles disabled' };

  return cached(
    ['api', 'articles', articleId, 'history'],
    async () => {
      const { data: article, error: articleError } = await supabase
        .from('articles')
        .select('id, title, categories(name)')
        .eq('id', articleId)
        .single();

      if (articleError || !article) {
        console.error('Error fetching article:', articleError);
        return { error: 'Article not found' } as const;
      }

      const { data: versions, error: versionsError } = await supabase
        .from('article_versions_public_view')
        .select(
          `
            id,
            content,
            created_at,
            editor_id,
            status,
            commit_message,
            users:users_public_view!editor_id(nickname)
          `
        )
        .eq('article_id', articleId)
        .eq('status', 'approved')
        .order('publication_revision', { ascending: false });

      if (versionsError) {
        console.error('Error fetching versions:', versionsError);
        return { error: 'Failed to fetch article history' } as const;
      }

      const articleRow = article as unknown as ArticleHistoryArticleRow;
      const historyVersions = (versions ?? []) as ArticleHistoryData['versions'];

      return {
        article: {
          id: articleRow.id,
          title: articleRow.title,
          categories: articleRow.categories,
        },
        versions: historyVersions,
        total_count: historyVersions.length,
      };
    },
    {
      revalidate: MAX_SERVER_CACHE_REVALIDATE_SECONDS,
      tags: [CACHE_TAGS.article(articleId), CACHE_TAGS.articleVersions(articleId)],
    }
  );
}

export async function incrementArticleViewCount(articleId: string): Promise<void> {
  const adminClient = getAdminClient();
  if (!adminClient) return;

  const { error } = await adminClient.rpc('increment_article_view_count', {
    p_article_id: articleId,
  });

  if (error) {
    console.error('Error incrementing article view count:', error);
  }
}
