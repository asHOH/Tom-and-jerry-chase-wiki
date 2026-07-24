-- Re-check account/IP blocks inside the database write boundary.  The old browser-callable
-- mutation functions are revoked below; application writes use the service-role-only wrappers.

CREATE OR REPLACE FUNCTION public.assert_actor_not_blocked(
  p_user_id uuid,
  p_ip inet,
  p_action text,
  p_resource_type text DEFAULT NULL,
  p_resource_id text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_user_id IS NULL AND p_ip IS NULL THEN RETURN; END IF;
  IF EXISTS (
    SELECT 1
    FROM public.find_effective_block(p_user_id, p_ip, p_action, p_resource_type, p_resource_id)
  ) THEN
    RAISE EXCEPTION 'blocked';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.assert_game_data_entry_not_blocked(
  p_user_id uuid,
  p_ip inet,
  p_entity_type text,
  p_entry jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  path_value jsonb := p_entry -> 'path';
  path_text text;
  root_id text;
BEGIN
  IF jsonb_typeof(path_value) = 'string' THEN
    path_text := path_value #>> '{}';
    root_id := CASE
      WHEN p_entity_type IN ('specialSkills', 'achievements') THEN split_part(path_text, '.', 2)
      ELSE split_part(path_text, '.', 1)
    END;
  ELSIF jsonb_typeof(path_value) = 'array' THEN
    root_id := CASE
      WHEN p_entity_type IN ('specialSkills', 'achievements') THEN path_value ->> 1
      ELSE path_value ->> 0
    END;
  ELSE
    root_id := COALESCE(p_entry ->> 'id', p_entry ->> 'key');
  END IF;
  PERFORM public.assert_actor_not_blocked(
    p_user_id, p_ip, 'edit', p_entity_type, NULLIF(root_id, '')
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_account_write_block()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_id uuid := auth.uid();
  article_id uuid;
  category_id uuid;
  resource_type text;
  resource_id text;
BEGIN
  -- Service-role prepared functions perform their explicit check with the request IP. Their
  -- trigger invocation has no end-user JWT and therefore must not reject on a NULL actor.
  IF actor_id IS NULL THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
  END IF;

  IF TG_TABLE_NAME = 'articles' THEN
    PERFORM public.assert_actor_not_blocked(actor_id, NULL, 'edit', 'articles',
      COALESCE(NEW.id, OLD.id)::text);
    PERFORM public.assert_actor_not_blocked(actor_id, NULL, 'edit', 'categories',
      COALESCE(NEW.category_id, OLD.category_id)::text);
  ELSIF TG_TABLE_NAME = 'article_versions' THEN
    article_id := COALESCE(NEW.article_id, OLD.article_id);
    SELECT a.category_id INTO category_id FROM public.articles a WHERE a.id = article_id;
    PERFORM public.assert_actor_not_blocked(actor_id, NULL, 'edit', 'articles', article_id::text);
    PERFORM public.assert_actor_not_blocked(actor_id, NULL, 'edit', 'categories',
      COALESCE(NEW.proposed_category_id, category_id)::text);
  ELSIF TG_TABLE_NAME = 'comments' THEN
    resource_type := 'comments/' || COALESCE(NEW.scope, OLD.scope)::text;
    resource_id := COALESCE(NEW.target_id, OLD.target_id);
    PERFORM public.assert_actor_not_blocked(actor_id, NULL, 'edit', resource_type, resource_id);
  ELSIF TG_TABLE_NAME = 'categories' THEN
    PERFORM public.assert_actor_not_blocked(actor_id, NULL, 'edit', 'categories',
      COALESCE(NEW.id, OLD.id)::text);
    PERFORM public.assert_actor_not_blocked(actor_id, NULL, 'edit', 'categories',
      COALESCE(NEW.parent_category_id, OLD.parent_category_id)::text);
  ELSIF TG_TABLE_NAME = 'game_data_actions' THEN
    PERFORM public.assert_game_data_entry_not_blocked(
      actor_id, NULL, COALESCE(NEW.entity_type, OLD.entity_type), COALESCE(NEW.entry, OLD.entry)
    );
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER articles_block_guard
  BEFORE INSERT OR UPDATE OR DELETE ON public.articles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_account_write_block();
CREATE TRIGGER article_versions_block_guard
  BEFORE INSERT OR UPDATE OR DELETE ON public.article_versions
  FOR EACH ROW EXECUTE FUNCTION public.enforce_account_write_block();
CREATE TRIGGER comments_block_guard
  BEFORE INSERT OR UPDATE OR DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.enforce_account_write_block();
CREATE TRIGGER categories_block_guard
  BEFORE INSERT OR UPDATE OR DELETE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.enforce_account_write_block();
CREATE TRIGGER game_data_actions_block_guard
  BEFORE INSERT OR UPDATE OR DELETE ON public.game_data_actions
  FOR EACH ROW EXECUTE FUNCTION public.enforce_account_write_block();

CREATE OR REPLACE FUNCTION public.prepared_create_article(
  p_actor_id uuid,
  p_ip inet,
  p_title text,
  p_content text,
  p_category_id uuid,
  p_character_id text DEFAULT NULL,
  p_commit_message text DEFAULT NULL
)
RETURNS TABLE (
  article_id uuid,
  submitted_version_id uuid,
  submitted_status public.version_status
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  new_article_id uuid;
  submitted public.version_status;
  submitted_id uuid;
BEGIN
  PERFORM public.assert_actor_not_blocked(p_actor_id, p_ip, 'edit', 'categories', p_category_id::text);
  PERFORM set_config('request.jwt.claim.sub', p_actor_id::text, true);
  INSERT INTO public.articles(title, category_id, author_id, character_id)
  VALUES (p_title, p_category_id, p_actor_id, p_character_id)
  RETURNING id INTO new_article_id;
  SELECT result.submitted_version_id, result.submitted_status
    INTO submitted_id, submitted
  FROM public.submit_article(
    new_article_id, p_title, p_content, p_category_id, p_character_id, p_commit_message
  ) result;
  RETURN QUERY SELECT new_article_id, submitted_id, submitted;
END;
$$;

CREATE OR REPLACE FUNCTION public.prepared_submit_article(
  p_actor_id uuid,
  p_ip inet,
  p_article_id uuid,
  p_title text,
  p_content text,
  p_category_id uuid,
  p_character_id text DEFAULT NULL,
  p_commit_message text DEFAULT NULL
)
RETURNS TABLE (submitted_version_id uuid, submitted_status public.version_status)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
BEGIN
  PERFORM public.assert_actor_not_blocked(p_actor_id, p_ip, 'edit', 'articles', p_article_id::text);
  PERFORM public.assert_actor_not_blocked(p_actor_id, p_ip, 'edit', 'categories', p_category_id::text);
  PERFORM set_config('request.jwt.claim.sub', p_actor_id::text, true);
  RETURN QUERY SELECT * FROM public.submit_article(
    p_article_id, p_title, p_content, p_category_id, p_character_id, p_commit_message
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.prepared_update_pending_article(
  p_actor_id uuid,
  p_ip inet,
  p_version_id uuid,
  p_article_id uuid,
  p_title text,
  p_content text,
  p_category_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.assert_actor_not_blocked(p_actor_id, p_ip, 'edit', 'articles', p_article_id::text);
  PERFORM public.assert_actor_not_blocked(p_actor_id, p_ip, 'edit', 'categories', p_category_id::text);
  PERFORM set_config('request.jwt.claim.sub', p_actor_id::text, true);
  PERFORM public.update_pending_article(p_version_id, p_article_id, p_title, p_content, p_category_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.prepared_create_comment(
  p_actor_id uuid,
  p_ip inet,
  p_scope public.comment_scope,
  p_target_id text,
  p_content text,
  p_parent_id uuid DEFAULT NULL,
  p_title text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE new_id uuid;
BEGIN
  PERFORM public.assert_actor_not_blocked(
    p_actor_id, p_ip, 'edit', 'comments/' || p_scope::text, p_target_id
  );
  PERFORM set_config('request.jwt.claim.sub', p_actor_id::text, true);
  SELECT public.create_comment(p_scope, p_target_id, p_content, p_parent_id, p_title) INTO new_id;
  RETURN new_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.prepared_set_comment_status(
  p_actor_id uuid,
  p_ip inet,
  p_comment_id uuid,
  p_status public.comment_status
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_scope public.comment_scope; v_target_id text;
BEGIN
  SELECT scope, target_id INTO v_scope, v_target_id FROM public.comments WHERE id = p_comment_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'comment_not_found'; END IF;
  PERFORM public.assert_actor_not_blocked(
    p_actor_id, p_ip, 'edit', 'comments/' || v_scope::text, v_target_id
  );
  PERFORM set_config('request.jwt.claim.sub', p_actor_id::text, true);
  PERFORM public.set_comment_status(p_comment_id, p_status);
END;
$$;

CREATE OR REPLACE FUNCTION public.prepared_create_category(
  p_actor_id uuid,
  p_ip inet,
  p_name text,
  p_parent_category_id uuid DEFAULT NULL,
  p_default_visibility public.version_status DEFAULT 'approved'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE new_id uuid;
BEGIN
  PERFORM public.assert_actor_not_blocked(
    p_actor_id, p_ip, 'edit', 'categories', p_parent_category_id::text
  );
  PERFORM set_config('request.jwt.claim.sub', p_actor_id::text, true);
  SELECT public.create_category(p_name, p_parent_category_id, p_default_visibility) INTO new_id;
  RETURN new_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.prepared_update_category(
  p_actor_id uuid,
  p_ip inet,
  p_id uuid,
  p_name text,
  p_parent_category_id uuid DEFAULT NULL,
  p_default_visibility public.version_status DEFAULT 'approved'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.assert_actor_not_blocked(p_actor_id, p_ip, 'edit', 'categories', p_id::text);
  PERFORM public.assert_actor_not_blocked(
    p_actor_id, p_ip, 'edit', 'categories', p_parent_category_id::text
  );
  PERFORM set_config('request.jwt.claim.sub', p_actor_id::text, true);
  PERFORM public.update_category(p_id, p_name, p_parent_category_id, p_default_visibility);
END;
$$;

CREATE OR REPLACE FUNCTION public.prepared_delete_category(
  p_actor_id uuid,
  p_ip inet,
  p_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.assert_actor_not_blocked(p_actor_id, p_ip, 'edit', 'categories', p_id::text);
  PERFORM set_config('request.jwt.claim.sub', p_actor_id::text, true);
  PERFORM public.delete_category(p_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.prepared_article_version_moderation(
  p_actor_id uuid,
  p_ip inet,
  p_version_id uuid,
  p_action text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_article_id uuid; v_category_id uuid;
BEGIN
  SELECT av.article_id, a.category_id INTO v_article_id, v_category_id
  FROM public.article_versions av JOIN public.articles a ON a.id = av.article_id
  WHERE av.id = p_version_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Article version not found'; END IF;
  PERFORM public.assert_actor_not_blocked(p_actor_id, p_ip, 'edit', 'articles', v_article_id::text);
  PERFORM public.assert_actor_not_blocked(p_actor_id, p_ip, 'edit', 'categories', v_category_id::text);
  PERFORM set_config('request.jwt.claim.sub', p_actor_id::text, true);
  IF p_action = 'approve' THEN
    PERFORM public.approve_article_version(p_version_id);
  ELSIF p_action = 'reject' THEN
    PERFORM public.reject_article_version(p_version_id);
  ELSIF p_action = 'revoke' THEN
    PERFORM public.revoke_article_version(p_version_id);
  ELSE
    RAISE EXCEPTION 'Invalid moderation action';
  END IF;
END;
$$;

-- Game-data mutations already use service-role prepared RPCs. These overloads add the request
-- IP/block re-check while delegating the existing permission and replay-epoch checks.
CREATE OR REPLACE FUNCTION public.prepared_publish_game_data_actions(
  p_actor_id uuid,
  p_permission_key text,
  p_entity_type text,
  p_entries jsonb,
  p_message text,
  p_expected_replay_epoch bigint,
  p_ip inet
)
RETURNS TABLE(id uuid, is_public boolean, status public.game_data_action_status)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE entry jsonb;
BEGIN
  FOR entry IN SELECT value FROM jsonb_array_elements(p_entries) LOOP
    PERFORM public.assert_game_data_entry_not_blocked(p_actor_id, p_ip, p_entity_type, entry);
  END LOOP;
  RETURN QUERY SELECT * FROM public.prepared_publish_game_data_actions(
    p_actor_id, p_permission_key, p_entity_type, p_entries, p_message, p_expected_replay_epoch
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.prepared_publish_anonymous_game_data_actions(
  p_entity_type text,
  p_entries jsonb,
  p_expected_replay_epoch bigint,
  p_message text,
  p_ip inet
)
RETURNS TABLE(id uuid, is_public boolean, status public.game_data_action_status)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE entry jsonb;
BEGIN
  FOR entry IN SELECT value FROM jsonb_array_elements(p_entries) LOOP
    PERFORM public.assert_game_data_entry_not_blocked(NULL, p_ip, p_entity_type, entry);
  END LOOP;
  RETURN QUERY SELECT * FROM public.prepared_publish_anonymous_game_data_actions(
    p_entity_type, p_entries, p_expected_replay_epoch, p_message
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.prepared_approve_game_data_action(
  p_actor_id uuid,
  p_action_id uuid,
  p_expected_entity_type text,
  p_expected_entry jsonb,
  p_expected_replay_epoch bigint,
  p_ip inet
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.assert_game_data_entry_not_blocked(
    p_actor_id, p_ip, p_expected_entity_type, p_expected_entry
  );
  PERFORM public.prepared_approve_game_data_action(
    p_actor_id, p_action_id, p_expected_entity_type, p_expected_entry, p_expected_replay_epoch
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.prepared_mark_game_data_action_synced(
  p_actor_id uuid,
  p_action_id uuid,
  p_expected_entity_type text,
  p_expected_entry jsonb,
  p_expected_replay_epoch bigint,
  p_ip inet
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.assert_game_data_entry_not_blocked(
    p_actor_id, p_ip, p_expected_entity_type, p_expected_entry
  );
  PERFORM public.prepared_mark_game_data_action_synced(
    p_actor_id, p_action_id, p_expected_entity_type, p_expected_entry, p_expected_replay_epoch
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.prepared_revoke_game_data_action(
  p_actor_id uuid,
  p_action_id uuid,
  p_expected_entity_type text,
  p_expected_entry jsonb,
  p_expected_replay_epoch bigint,
  p_ip inet
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.assert_game_data_entry_not_blocked(
    p_actor_id, p_ip, p_expected_entity_type, p_expected_entry
  );
  PERFORM public.prepared_revoke_game_data_action(
    p_actor_id, p_action_id, p_expected_entity_type, p_expected_entry, p_expected_replay_epoch
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.prepared_reject_game_data_action(
  p_actor_id uuid,
  p_action_id uuid,
  p_reason text,
  p_ip inet
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_entity_type text; v_entry jsonb;
BEGIN
  SELECT entity_type, entry INTO v_entity_type, v_entry
  FROM public.game_data_actions
  WHERE id = p_action_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'action_not_found'; END IF;
  PERFORM public.assert_game_data_entry_not_blocked(p_actor_id, p_ip, v_entity_type, v_entry);
  PERFORM set_config('request.jwt.claim.sub', p_actor_id::text, true);
  PERFORM public.reject_game_data_action(p_action_id, p_reason);
END;
$$;

-- Only the service-role wrappers can perform these mutations. Public read RPCs remain unchanged.
REVOKE ALL ON FUNCTION public.submit_article(uuid, text, text, uuid, text, text)
FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_pending_article(uuid, uuid, text, text, uuid)
FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.create_comment(public.comment_scope, text, text, uuid, text)
FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_comment_status(uuid, public.comment_status)
FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.create_category(text, uuid, public.version_status)
FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_category(uuid, text, uuid, public.version_status)
FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.delete_category(uuid)
FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.approve_article_version(uuid)
FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reject_article_version(uuid)
FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.revoke_article_version(uuid)
FROM PUBLIC, anon, authenticated;
REVOKE INSERT, UPDATE, DELETE
ON TABLE public.articles, public.article_versions, public.comments, public.categories
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.prepared_create_article(uuid, inet, text, text, uuid, text, text)
TO service_role;
GRANT EXECUTE ON FUNCTION public.prepared_submit_article(uuid, inet, uuid, text, text, uuid, text, text)
TO service_role;
GRANT EXECUTE ON FUNCTION public.prepared_update_pending_article(uuid, inet, uuid, uuid, text, text, uuid)
TO service_role;
GRANT EXECUTE ON FUNCTION public.prepared_create_comment(uuid, inet, public.comment_scope, text, text, uuid, text)
TO service_role;
GRANT EXECUTE ON FUNCTION public.prepared_set_comment_status(uuid, inet, uuid, public.comment_status)
TO service_role;
GRANT EXECUTE ON FUNCTION public.prepared_create_category(uuid, inet, text, uuid, public.version_status)
TO service_role;
GRANT EXECUTE ON FUNCTION public.prepared_update_category(uuid, inet, uuid, text, uuid, public.version_status)
TO service_role;
GRANT EXECUTE ON FUNCTION public.prepared_delete_category(uuid, inet, uuid)
TO service_role;
GRANT EXECUTE ON FUNCTION public.prepared_article_version_moderation(uuid, inet, uuid, text)
TO service_role;

REVOKE ALL ON FUNCTION public.prepared_create_article(uuid, inet, text, text, uuid, text, text)
FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prepared_submit_article(uuid, inet, uuid, text, text, uuid, text, text)
FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prepared_update_pending_article(uuid, inet, uuid, uuid, text, text, uuid)
FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prepared_create_comment(uuid, inet, public.comment_scope, text, text, uuid, text)
FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prepared_set_comment_status(uuid, inet, uuid, public.comment_status)
FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prepared_create_category(uuid, inet, text, uuid, public.version_status)
FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prepared_update_category(uuid, inet, uuid, text, uuid, public.version_status)
FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prepared_delete_category(uuid, inet, uuid)
FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prepared_article_version_moderation(uuid, inet, uuid, text)
FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.prepared_publish_game_data_actions(
  uuid, text, text, jsonb, text, bigint, inet
) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prepared_publish_anonymous_game_data_actions(
  text, jsonb, bigint, text, inet
) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prepared_approve_game_data_action(
  uuid, uuid, text, jsonb, bigint, inet
) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prepared_mark_game_data_action_synced(
  uuid, uuid, text, jsonb, bigint, inet
) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prepared_revoke_game_data_action(
  uuid, uuid, text, jsonb, bigint, inet
) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prepared_reject_game_data_action(uuid, uuid, text, inet)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prepared_publish_game_data_actions(
  uuid, text, text, jsonb, text, bigint, inet
) TO service_role;
GRANT EXECUTE ON FUNCTION public.prepared_publish_anonymous_game_data_actions(
  text, jsonb, bigint, text, inet
) TO service_role;
GRANT EXECUTE ON FUNCTION public.prepared_approve_game_data_action(
  uuid, uuid, text, jsonb, bigint, inet
) TO service_role;
GRANT EXECUTE ON FUNCTION public.prepared_mark_game_data_action_synced(
  uuid, uuid, text, jsonb, bigint, inet
) TO service_role;
GRANT EXECUTE ON FUNCTION public.prepared_revoke_game_data_action(
  uuid, uuid, text, jsonb, bigint, inet
) TO service_role;
GRANT EXECUTE ON FUNCTION public.prepared_reject_game_data_action(uuid, uuid, text, inet)
TO service_role;

REVOKE ALL ON FUNCTION public.reject_game_data_action(uuid, text)
FROM PUBLIC, anon, authenticated;
