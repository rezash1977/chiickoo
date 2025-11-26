-- Create notifications table
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null check (type in ('info', 'success', 'warning', 'error', 'ad_status', 'system')),
  title text not null,
  message text not null,
  is_read boolean default false,
  data jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.notifications enable row level security;

-- Policies
create policy "Users can view their own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can update their own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

-- Allow system/admin to insert notifications (if using service role, this is bypassed, but good to have if we have admin users)
-- For now, we assume inserts happen via server-side logic or triggers. 
-- If we want client-side inserts (e.g. user to user), we need a policy. 
-- Let's keep it restricted for now.

-- Enable Realtime
alter publication supabase_realtime add table public.notifications;
