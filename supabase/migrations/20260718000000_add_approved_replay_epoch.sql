CREATE TABLE public.game_data_approved_replay_epoch (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  epoch bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.game_data_approved_replay_epoch (singleton, epoch)
VALUES (true, 0)
ON CONFLICT (singleton) DO NOTHING;

ALTER TABLE public.game_data_approved_replay_epoch ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.game_data_approved_replay_epoch FROM PUBLIC, anon, authenticated;
GRANT SELECT, UPDATE ON TABLE public.game_data_approved_replay_epoch TO service_role;

CREATE OR REPLACE FUNCTION public.advance_game_data_approved_replay_epoch()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_member boolean := false;
  new_member boolean := false;
  replay_set_changed boolean := false;
BEGIN
  IF TG_OP <> 'INSERT' THEN
    old_member := OLD.is_public AND OLD.status = 'approved';
  END IF;
  IF TG_OP <> 'DELETE' THEN
    new_member := NEW.is_public AND NEW.status = 'approved';
  END IF;

  replay_set_changed := old_member IS DISTINCT FROM new_member;
  IF TG_OP = 'UPDATE' AND (old_member OR new_member) THEN
    replay_set_changed := replay_set_changed OR
      ROW(OLD.id, OLD.entity_type, OLD.entry, OLD.created_at) IS DISTINCT FROM
      ROW(NEW.id, NEW.entity_type, NEW.entry, NEW.created_at);
  END IF;

  IF replay_set_changed THEN
    UPDATE public.game_data_approved_replay_epoch
    SET epoch = epoch + 1, updated_at = now()
    WHERE singleton = true;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.advance_game_data_approved_replay_epoch() FROM PUBLIC;

CREATE TRIGGER game_data_actions_approved_replay_epoch
AFTER INSERT OR UPDATE OR DELETE ON public.game_data_actions
FOR EACH ROW EXECUTE FUNCTION public.advance_game_data_approved_replay_epoch();

CREATE OR REPLACE FUNCTION public.read_game_data_approved_replay_snapshot()
RETURNS TABLE(replay_epoch bigint, action_rows jsonb)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    epoch_row.epoch AS replay_epoch,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', action.id,
            'entity_type', action.entity_type,
            'entry', action.entry,
            'created_at', action.created_at,
            'status', action.status,
            'message', action.message,
            'reviewed_at', action.reviewed_at,
            'created_by', action.created_by
          )
          ORDER BY action.created_at ASC, action.id ASC
        )
        FROM public.game_data_actions AS action
        WHERE action.is_public = true AND action.status = 'approved'
      ),
      '[]'::jsonb
    ) AS action_rows
  FROM public.game_data_approved_replay_epoch AS epoch_row
  WHERE epoch_row.singleton = true;
$$;

REVOKE ALL ON FUNCTION public.read_game_data_approved_replay_snapshot() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.read_game_data_approved_replay_snapshot() TO service_role;
