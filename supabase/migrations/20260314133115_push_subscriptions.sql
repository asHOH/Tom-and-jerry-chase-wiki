-- Create push_subscriptions table
create table public.push_subscriptions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    endpoint text not null,
    keys_p256dh text not null,
    keys_auth text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, endpoint)
);

-- Set up Row Level Security (RLS)
alter table public.push_subscriptions enable row level security;

-- Policies
create policy "Users can view own push subscriptions"
    on public.push_subscriptions for select
    to authenticated
    using (auth.uid() = user_id);

create policy "Users can insert own push subscriptions"
    on public.push_subscriptions for insert
    to authenticated
    with check (auth.uid() = user_id);

create policy "Users can delete own push subscriptions"
    on public.push_subscriptions for delete
    to authenticated
    using (auth.uid() = user_id);
