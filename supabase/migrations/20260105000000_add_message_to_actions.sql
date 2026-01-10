-- Add message column to game_data_actions
ALTER TABLE public.game_data_actions
ADD COLUMN IF NOT EXISTS message text;

-- Drop old functions to handle return type changes and overloads
DROP FUNCTION IF EXISTS public.publish_game_data_actions(text, jsonb);
DROP FUNCTION IF EXISTS public.get_pending_game_data_actions();

-- Update publish_game_data_actions function to accept message
CREATE OR REPLACE FUNCTION public.publish_game_data_actions(
    p_entity_type text,
    p_entries jsonb,
    p_message text DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    is_public boolean,
    status public.game_data_action_status
) AS $$
DECLARE
    v_uid uuid;
    v_role public.role_type;
    v_auto_public boolean;
    v_entry jsonb;
    v_status public.game_data_action_status;
    v_is_public boolean;
    v_reviewed_by uuid;
    v_reviewed_at timestamptz;
BEGIN
    v_uid := (select auth.uid());
    v_role := get_user_role(v_uid);
    v_auto_public := v_role IN ('Reviewer', 'Coordinator');

    IF p_entity_type IS NULL OR length(trim(p_entity_type)) = 0 THEN
        RAISE EXCEPTION 'entity_type is required';
    END IF;

    IF p_entries IS NULL OR jsonb_typeof(p_entries) <> 'array' THEN
        RAISE EXCEPTION 'entries must be a jsonb array';
    END IF;

    IF v_auto_public THEN
        v_status := 'approved';
        v_is_public := true;
        v_reviewed_by := v_uid;
        v_reviewed_at := now();
    ELSE
        v_status := 'pending';
        v_is_public := false;
        v_reviewed_by := NULL;
        v_reviewed_at := NULL;
    END IF;

    FOR v_entry IN
        SELECT value FROM jsonb_array_elements(p_entries)
    LOOP
        INSERT INTO public.game_data_actions (
            entity_type,
            entry,
            status,
            is_public,
            created_by,
            reviewed_by,
            reviewed_at,
            message
        )
        VALUES (
            p_entity_type,
            v_entry,
            v_status,
            v_is_public,
            v_uid,
            v_reviewed_by,
            v_reviewed_at,
            p_message
        )
        RETURNING public.game_data_actions.id, public.game_data_actions.is_public, public.game_data_actions.status
        INTO id, is_public, status;

        RETURN NEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update get_pending_game_data_actions to return message
CREATE OR REPLACE FUNCTION public.get_pending_game_data_actions()
RETURNS TABLE (
    action_id uuid,
    entity_type text,
    entry jsonb,
    status public.game_data_action_status,
    is_public boolean,
    created_at timestamptz,
    created_by uuid,
    created_by_nickname text,
    reviewed_at timestamptz,
    reviewed_by uuid,
    reviewed_by_nickname text,
    rejection_reason text,
    message text
) AS $$
DECLARE
    v_uid uuid;
BEGIN
    v_uid := (select auth.uid());

    IF get_user_role(v_uid) NOT IN ('Reviewer', 'Coordinator') THEN
        RAISE EXCEPTION 'Insufficient permissions to view pending actions';
    END IF;

    RETURN QUERY
    SELECT
        a.id AS action_id,
        a.entity_type,
        a.entry,
        a.status,
        a.is_public,
        a.created_at,
        a.created_by,
        u.nickname AS created_by_nickname,
        a.reviewed_at,
        a.reviewed_by,
        ru.nickname AS reviewed_by_nickname,
        a.rejection_reason,
        a.message
    FROM public.game_data_actions a
    LEFT JOIN public.users u ON a.created_by = u.id
    LEFT JOIN public.users ru ON a.reviewed_by = ru.id
    WHERE a.status = 'pending'
    ORDER BY a.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
