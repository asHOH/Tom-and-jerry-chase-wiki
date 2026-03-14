ALTER TYPE public.game_data_action_status ADD VALUE IF NOT EXISTS 'synced';

ALTER TABLE public.game_data_actions
ADD COLUMN IF NOT EXISTS pr_url text;

CREATE OR REPLACE FUNCTION public.approve_game_data_action(p_action_id uuid)
RETURNS void AS $$
DECLARE
    v_uid uuid;
BEGIN
    v_uid := (select auth.uid());

    IF get_user_role(v_uid) NOT IN ('Reviewer', 'Coordinator') THEN
        RAISE EXCEPTION 'Insufficient permissions to approve actions';
    END IF;

    UPDATE public.game_data_actions
    SET
        status = 'approved',
        is_public = true,
        reviewed_by = v_uid,
        reviewed_at = now(),
        rejection_reason = NULL
    WHERE id = p_action_id
      AND status = 'pending';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Action not found or not in pending status';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.reject_game_data_action(
    p_action_id uuid,
    p_reason text DEFAULT NULL
)
RETURNS void AS $$
DECLARE
    v_uid uuid;
BEGIN
    v_uid := (select auth.uid());

    IF get_user_role(v_uid) NOT IN ('Reviewer', 'Coordinator') THEN
        RAISE EXCEPTION 'Insufficient permissions to reject actions';
    END IF;

    UPDATE public.game_data_actions
    SET
        status = 'rejected',
        is_public = false,
        reviewed_by = v_uid,
        reviewed_at = now(),
        rejection_reason = p_reason
    WHERE id = p_action_id
      AND status = 'pending';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Action not found or not in pending status';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
