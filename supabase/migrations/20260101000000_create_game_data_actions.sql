CREATE TYPE public.game_data_action_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE public.game_data_actions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type text NOT NULL,
    entry jsonb NOT NULL,
    status public.game_data_action_status NOT NULL,
    is_public boolean NOT NULL DEFAULT false,

    created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),

    reviewed_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
    reviewed_at timestamptz,
    rejection_reason text
);

CREATE INDEX game_data_actions_is_public_created_at_idx
    ON public.game_data_actions (is_public, created_at);

CREATE INDEX game_data_actions_status_created_at_idx
    ON public.game_data_actions (status, created_at);

CREATE INDEX game_data_actions_entity_type_created_at_idx
    ON public.game_data_actions (entity_type, created_at);

ALTER TABLE public.game_data_actions ENABLE ROW LEVEL SECURITY;
