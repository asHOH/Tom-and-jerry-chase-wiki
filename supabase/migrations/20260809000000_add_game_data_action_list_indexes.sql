-- Measurement-selected ordering indexes for bounded admin action pages.
CREATE INDEX game_data_actions_created_at_id_idx
  ON public.game_data_actions (created_at DESC, id DESC);

CREATE INDEX game_data_actions_pending_created_at_id_idx
  ON public.game_data_actions (created_at DESC, id DESC)
  WHERE status = 'pending';
