-- Keep article-list payloads bounded without duplicating excerpt state in write paths.
-- The view computes plain text only for versions selected by a reader's query.

CREATE OR REPLACE VIEW public.article_versions_public_view
WITH (security_invoker = true)
AS
SELECT
  id,
  article_id,
  content,
  editor_id,
  status,
  created_at,
  commit_message,
  publication_revision,
  left(
    regexp_replace(
      trim(
        replace(
          replace(
            replace(
              replace(
                replace(regexp_replace(content, '<[^>]*>', ' ', 'g'), '&nbsp;', ' '),
                '&amp;',
                '&'
              ),
              '&lt;',
              '<'
            ),
            '&gt;',
            '>'
          ),
          '&quot;',
          '"'
        )
      ),
      '\s+',
      ' ',
      'g'
    ),
    240
  ) AS excerpt
FROM public.article_versions;
