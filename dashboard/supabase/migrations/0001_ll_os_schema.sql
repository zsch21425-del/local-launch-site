-- LL OS Business Database Schema
-- One table per client/profile, with everything Zach + agents need.

-- Clients / Profiles (the heart of the Business OS)
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,             -- url slug: "redwood-landscaping"
  name text not null,                    -- display name
  category text,                         -- "lawn care", "hvac", "auto dealer"
  location text,                         -- "Greenville, SC"
  -- contact
  phone text,
  email text,
  website text,
  facebook text,
  instagram text,
  -- status / pipeline
  stage text not null default 'prospect', -- prospect|audit|pitch|contacted|response|sale|build-launch
  approval_status text default 'none',    -- none|pending|supervisor-approved|zach-approved|rejected|sent
  priority text default 'medium',         -- low|medium|high
  -- pitch
  pitch_subject text,
  pitch_body text,
  pitch_channel text default 'email',     -- email|phone|fb-dm
  pitch_confidence int default 0,        -- 0-10
  pitch_feedback jsonb,                  -- {reason, suggestedFix, reviewedAt}
  -- website / demo / seo
  website_status text,                   -- none|live|broken|template
  demo_url text,                         -- link to demo site
  seo_score int,                         -- current seo score
  -- sales / payments (Stripe)
  sale_value int,                        -- one-time build value
  mrr int default 0,                     -- monthly recurring revenue
  plan text,                             -- "launch"|"grow"|"dominate"|"custom"
  payment_status text default 'unpaid',  -- paid|owed|pending|cancelled
  amount_owed int default 0,
  stripe_customer_id text,               -- for Stripe invoice lookup
  -- activity / work
  playbook jsonb default '[]',          -- [{label, stage, done, detail}]
  next_steps jsonb default '[]',        -- [string]
  activity jsonb default '[]',          -- [{ts, actor, text}] timeline
  -- meta
  last_contact timestamptz,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Row Level Security: only authenticated app users (Zach) can read/write via client.
alter table public.profiles enable row level security;

-- Agency-level config (pricing, goals)
create table if not exists public.agency (
  id int primary key default 1,
  name text,
  tagline text,
  phone text,
  website text,
  email text,
  pricing jsonb,      -- current price list
  goal text           -- "20 clients by end of 2026"
);

-- Sync trigger: bump updated_at on change
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated
  before update on public.profiles
  for each row execute function public.set_updated_at();
