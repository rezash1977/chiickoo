-- Create a new table for ad details
create table if not exists public.ad_details (
  id uuid default gen_random_uuid() primary key,
  ad_id uuid references public.ads(id) on delete cascade not null,
  features jsonb not null default '{}'::jsonb, -- Flexible storage for category-specific attributes
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add index on ad_id for faster lookups
create index if not exists ad_details_ad_id_idx on public.ad_details(ad_id);

-- Enable RLS
alter table public.ad_details enable row level security;

-- Policies
-- Everyone can view details of active ads
create policy "Public can view details of active ads"
  on public.ad_details for select
  using ( exists ( select 1 from public.ads where ads.id = ad_details.ad_id and ads.status = 'active' ) );

-- Users can view their own ad details regardless of status
create policy "Users can view own ad details"
  on public.ad_details for select
  using ( exists ( select 1 from public.ads where ads.id = ad_details.ad_id and ads.user_id = auth.uid() ) );

-- Users can insert details for their own ads
create policy "Users can insert details for own ads"
  on public.ad_details for insert
  with check ( exists ( select 1 from public.ads where ads.id = ad_details.ad_id and ads.user_id = auth.uid() ) );

-- Users can update details for their own ads
create policy "Users can update details for own ads"
  on public.ad_details for update
  using ( exists ( select 1 from public.ads where ads.id = ad_details.ad_id and ads.user_id = auth.uid() ) );
