-- Public contributor activity is read by the server with the service role.
-- Keep the functions SECURITY INVOKER so their access is still governed by
-- the role used to call them, and do not expose the underlying tables to the
-- public API roles.

CREATE INDEX IF NOT EXISTS article_versions_contributor_activity_idx
  ON public.article_versions (editor_id, created_at DESC, id DESC)
  WHERE status = 'approved'::public.version_status;

CREATE INDEX IF NOT EXISTS game_data_actions_contributor_activity_idx
  ON public.game_data_actions (created_by, created_at DESC, id DESC)
  WHERE created_by IS NOT NULL
    AND (is_public = true OR status = 'synced'::public.game_data_action_status);

CREATE INDEX IF NOT EXISTS game_data_actions_creator_status_idx
  ON public.game_data_actions (created_by, status)
  WHERE created_by IS NOT NULL;

CREATE OR REPLACE FUNCTION public.get_public_contribution_calendar(
  p_user_id uuid,
  p_start_date date,
  p_end_date date
)
RETURNS TABLE (
  activity_date date,
  article_count bigint,
  game_data_count bigint,
  total_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_start_at timestamptz;
  v_end_at timestamptz;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id is required';
  END IF;

  IF p_start_date IS NULL OR p_end_date IS NULL THEN
    RAISE EXCEPTION 'start_date and end_date are required';
  END IF;

  IF p_end_date < p_start_date THEN
    RAISE EXCEPTION 'end_date must be on or after start_date';
  END IF;

  IF p_end_date - p_start_date > 365 THEN
    RAISE EXCEPTION 'date range must not exceed 366 calendar days';
  END IF;

  v_start_at := p_start_date::timestamp AT TIME ZONE 'Asia/Shanghai';
  v_end_at := (p_end_date + 1)::timestamp AT TIME ZONE 'Asia/Shanghai';

  RETURN QUERY
  WITH daily_counts AS (
    SELECT
      (av.created_at AT TIME ZONE 'Asia/Shanghai')::date AS activity_date,
      COUNT(*)::bigint AS article_count,
      0::bigint AS game_data_count
    FROM public.article_versions AS av
    WHERE av.editor_id = p_user_id
      AND av.status = 'approved'::public.version_status
      AND av.created_at >= v_start_at
      AND av.created_at < v_end_at
    GROUP BY 1

    UNION ALL

    SELECT
      (gda.created_at AT TIME ZONE 'Asia/Shanghai')::date AS activity_date,
      0::bigint AS article_count,
      COUNT(*)::bigint AS game_data_count
    FROM public.game_data_actions AS gda
    WHERE gda.created_by = p_user_id
      AND (gda.is_public = true OR gda.status = 'synced'::public.game_data_action_status)
      AND gda.created_at >= v_start_at
      AND gda.created_at < v_end_at
    GROUP BY 1
  )
  SELECT
    dc.activity_date,
    SUM(dc.article_count)::bigint AS article_count,
    SUM(dc.game_data_count)::bigint AS game_data_count,
    SUM(dc.article_count + dc.game_data_count)::bigint AS total_count
  FROM daily_counts AS dc
  GROUP BY dc.activity_date
  ORDER BY dc.activity_date ASC;
END;
$$;


CREATE OR REPLACE FUNCTION public.get_public_contribution_breakdown(
  p_user_id uuid,
  p_start_date date,
  p_end_date date
)
RETURNS TABLE (
  category text,
  contribution_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_start_at timestamptz;
  v_end_at timestamptz;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id is required';
  END IF;

  IF p_start_date IS NULL OR p_end_date IS NULL THEN
    RAISE EXCEPTION 'start_date and end_date are required';
  END IF;

  IF p_end_date < p_start_date THEN
    RAISE EXCEPTION 'end_date must be on or after start_date';
  END IF;

  IF p_end_date - p_start_date > 365 THEN
    RAISE EXCEPTION 'date range must not exceed 366 calendar days';
  END IF;

  v_start_at := p_start_date::timestamp AT TIME ZONE 'Asia/Shanghai';
  v_end_at := (p_end_date + 1)::timestamp AT TIME ZONE 'Asia/Shanghai';

  RETURN QUERY
  WITH categories AS (
    SELECT
      'article'::text AS category,
      COUNT(*)::bigint AS contribution_count
    FROM public.article_versions AS av
    WHERE av.editor_id = p_user_id
      AND av.status = 'approved'::public.version_status
      AND av.created_at >= v_start_at
      AND av.created_at < v_end_at
    HAVING COUNT(*) > 0

    UNION ALL

    SELECT
      gda.entity_type AS category,
      COUNT(*)::bigint AS contribution_count
    FROM public.game_data_actions AS gda
    WHERE gda.created_by = p_user_id
      AND (gda.is_public = true OR gda.status = 'synced'::public.game_data_action_status)
      AND gda.created_at >= v_start_at
      AND gda.created_at < v_end_at
    GROUP BY gda.entity_type
  )
  SELECT c.category, SUM(c.contribution_count)::bigint AS contribution_count
  FROM categories AS c
  GROUP BY c.category
  ORDER BY SUM(c.contribution_count) DESC, c.category ASC;
END;
$$;


CREATE OR REPLACE FUNCTION public.get_public_contribution_activity(
  p_user_id uuid,
  p_filter text DEFAULT 'all',
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  kind text,
  id uuid,
  article_id uuid,
  article_title text,
  entity_type text,
  entry jsonb,
  description text,
  created_at timestamptz,
  actor_id uuid,
  total_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id is required';
  END IF;

  IF p_filter IS NULL OR p_filter NOT IN ('all', 'articles', 'game-data') THEN
    RAISE EXCEPTION 'filter must be all, articles, or game-data';
  END IF;

  IF p_limit IS NULL OR p_limit < 1 OR p_limit > 50 THEN
    RAISE EXCEPTION 'limit must be between 1 and 50';
  END IF;

  IF p_offset IS NULL OR p_offset < 0 THEN
    RAISE EXCEPTION 'offset must not be negative';
  END IF;

  RETURN QUERY
  WITH activity_rows AS (
    SELECT
      'article'::text AS kind,
      av.id,
      av.article_id,
      a.title AS article_title,
      NULL::text AS entity_type,
      NULL::jsonb AS entry,
      av.commit_message AS description,
      av.created_at,
      av.editor_id AS actor_id
    FROM public.article_versions AS av
    INNER JOIN public.articles AS a ON a.id = av.article_id
    WHERE av.editor_id = p_user_id
      AND av.status = 'approved'::public.version_status
      AND p_filter IN ('all', 'articles')

    UNION ALL

    SELECT
      'game_data'::text AS kind,
      gda.id,
      NULL::uuid AS article_id,
      NULL::text AS article_title,
      gda.entity_type,
      gda.entry,
      gda.message AS description,
      gda.created_at,
      gda.created_by AS actor_id
    FROM public.game_data_actions AS gda
    WHERE gda.created_by = p_user_id
      AND (gda.is_public = true OR gda.status = 'synced'::public.game_data_action_status)
      AND p_filter IN ('all', 'game-data')
  ),
  counted_rows AS (
    SELECT
      ar.kind,
      ar.id,
      ar.article_id,
      ar.article_title,
      ar.entity_type,
      ar.entry,
      ar.description,
      ar.created_at,
      ar.actor_id,
      COUNT(*) OVER ()::bigint AS total_count
    FROM activity_rows AS ar
  )
  SELECT
    cr.kind,
    cr.id,
    cr.article_id,
    cr.article_title,
    cr.entity_type,
    cr.entry,
    cr.description,
    cr.created_at,
    cr.actor_id,
    cr.total_count
  FROM counted_rows AS cr
  ORDER BY cr.created_at DESC, cr.id DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;


REVOKE ALL ON FUNCTION public.get_public_contribution_calendar(uuid, date, date)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_public_contribution_breakdown(uuid, date, date)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_public_contribution_activity(uuid, text, integer, integer)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_public_contribution_calendar(uuid, date, date)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.get_public_contribution_breakdown(uuid, date, date)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.get_public_contribution_activity(uuid, text, integer, integer)
  TO service_role;
