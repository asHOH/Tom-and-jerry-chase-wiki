create table if not exists public.feedback (
  id uuid not null default gen_random_uuid(),
  type text not null,
  content text not null,
  contact text,
  user_agent text,
  ip_address text,
  status text not null default 'pending',
  created_at timestamp with time zone not null default now(),
  constraint feedback_pkey primary key (id)
);

alter table public.feedback enable row level security;

-- Only service role can access this table for now (API routes use service role)
-- No public policies needed as we don't want client-side access
