CREATE OR REPLACE FUNCTION public.read_game_data_approved_replay_epoch()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT epoch
  FROM public.game_data_approved_replay_epoch
  WHERE singleton = true;
$$;

REVOKE ALL ON FUNCTION public.read_game_data_approved_replay_epoch() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.read_game_data_approved_replay_epoch() TO anon, authenticated;
