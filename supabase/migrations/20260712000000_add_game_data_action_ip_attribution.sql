ALTER TABLE public.game_data_actions
ADD COLUMN anonymous_contributor_label text;

CREATE TABLE public.game_data_action_attribution (
    action_id uuid PRIMARY KEY REFERENCES public.game_data_actions(id) ON DELETE CASCADE,
    ip_address inet NOT NULL
);

ALTER TABLE public.game_data_action_attribution ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_data_action_attribution FORCE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage game data action attribution"
ON public.game_data_action_attribution FOR ALL TO service_role
USING (true) WITH CHECK (true);

REVOKE ALL ON public.game_data_action_attribution FROM anon, authenticated;
GRANT ALL ON public.game_data_action_attribution TO service_role;

CREATE OR REPLACE FUNCTION public.mask_game_data_contributor_ip(p_ip inet)
RETURNS text
LANGUAGE sql
IMMUTABLE
STRICT
SET search_path = public
AS $$
    SELECT CASE family(p_ip)
        WHEN 4 THEN 'IP ' || regexp_replace(host(p_ip), '\.[^.]+$', '.*')
        WHEN 6 THEN 'IP ' || regexp_replace(host(set_masklen(p_ip, 48)), '::$', ':*')
    END;
$$;

REVOKE ALL ON FUNCTION public.mask_game_data_contributor_ip(inet) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mask_game_data_contributor_ip(inet) TO service_role;

CREATE OR REPLACE FUNCTION public.publish_game_data_actions_server(
    p_entity_type text,
    p_entries jsonb,
    p_created_by uuid DEFAULT NULL,
    p_anonymous_ip inet DEFAULT NULL,
    p_message text DEFAULT NULL
)
RETURNS TABLE (id uuid, is_public boolean, status public.game_data_action_status) AS $$
DECLARE
    v_role public.role_type;
    v_auto_public boolean;
    v_entry jsonb;
    v_status public.game_data_action_status;
    v_is_public boolean;
    v_reviewed_by uuid;
    v_reviewed_at timestamptz;
    v_action_id uuid;
    v_label text;
BEGIN
    IF (select auth.role()) <> 'service_role' THEN
        RAISE EXCEPTION 'Service role required';
    END IF;
    IF p_entity_type IS NULL OR length(trim(p_entity_type)) = 0 THEN
        RAISE EXCEPTION 'entity_type is required';
    END IF;
    IF p_entries IS NULL OR jsonb_typeof(p_entries) <> 'array' THEN
        RAISE EXCEPTION 'entries must be a jsonb array';
    END IF;
    IF p_created_by IS NOT NULL AND p_anonymous_ip IS NOT NULL THEN
        RAISE EXCEPTION 'Authenticated actions cannot have anonymous IP attribution';
    END IF;

    v_role := get_user_role(p_created_by);
    v_auto_public := v_role IN ('Reviewer', 'Coordinator');
    v_status := CASE WHEN v_auto_public THEN 'approved' ELSE 'pending' END;
    v_is_public := v_auto_public;
    v_reviewed_by := CASE WHEN v_auto_public THEN p_created_by ELSE NULL END;
    v_reviewed_at := CASE WHEN v_auto_public THEN now() ELSE NULL END;
    v_label := CASE WHEN p_created_by IS NULL AND p_anonymous_ip IS NOT NULL
        THEN mask_game_data_contributor_ip(p_anonymous_ip) ELSE NULL END;

    FOR v_entry IN SELECT value FROM jsonb_array_elements(p_entries)
    LOOP
        INSERT INTO public.game_data_actions (
            entity_type, entry, status, is_public, created_by, reviewed_by, reviewed_at,
            message, anonymous_contributor_label
        ) VALUES (
            p_entity_type, v_entry, v_status, v_is_public, p_created_by, v_reviewed_by,
            v_reviewed_at, p_message, v_label
        ) RETURNING public.game_data_actions.id INTO v_action_id;

        IF p_created_by IS NULL AND p_anonymous_ip IS NOT NULL THEN
            INSERT INTO public.game_data_action_attribution (action_id, ip_address)
            VALUES (v_action_id, p_anonymous_ip);
        END IF;

        id := v_action_id;
        is_public := v_is_public;
        status := v_status;
        RETURN NEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.publish_game_data_actions_server(text, jsonb, uuid, inet, text)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.publish_game_data_actions_server(text, jsonb, uuid, inet, text)
TO service_role;

REVOKE EXECUTE ON FUNCTION public.publish_game_data_actions(text, jsonb, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.publish_game_data_actions(text, jsonb, text) TO authenticated;
