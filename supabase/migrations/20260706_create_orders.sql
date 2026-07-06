-- Orders table for the vinyl cutting service.
-- Payment columns (status, provider ids) are provisioned ahead of the
-- TBC / BOG checkout integration so no schema change is needed later.
-- Amounts are in GEL major units (project convention, see AGENTS.md).

create extension if not exists "pgcrypto";

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- 'received' = order taken without online payment (current email flow).
  -- The payment flow will create orders as 'pending_payment' and move them
  -- to 'paid' / 'failed' from the bank callbacks.
  status text not null default 'received'
    check (status in ('received', 'pending_payment', 'paid', 'failed', 'cancelled', 'fulfilled')),

  -- Customer
  first_name text not null,
  last_name text,
  email text not null,
  phone text not null,

  -- Specs
  size text not null
    check (size in ('7', '10', '12', 'test1', 'test15', 'test05')),
  color text not null
    check (color in ('Black', 'Red', 'Transparent')),
  quantity integer not null
    check (quantity >= 1 and quantity <= 9999),
  sticker_type text not null
    check (sticker_type in ('default', 'custom')),
  sticker_link text,
  outer_sleeve boolean not null default false,
  outer_sleeve_link text,

  -- Pricing, computed server-side at order time
  unit_price numeric(10,2) not null,
  total_price numeric(10,2) not null,
  currency text not null default 'GEL',

  -- Payment gateway references (filled in once checkout goes live)
  payment_provider text
    check (payment_provider in ('tbc', 'bog')),
  tbc_pay_id text unique,
  bog_order_id text unique,

  terms_accepted_at timestamptz not null
);

create index orders_status_idx on public.orders (status);
create index orders_created_at_idx on public.orders (created_at desc);
create index orders_email_idx on public.orders (email);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger orders_set_updated_at
  before update on public.orders
  for each row
  execute function public.set_updated_at();

-- Lock the table down: RLS on, no policies. The app only touches it from
-- server-side API routes using the service role key, which bypasses RLS.
alter table public.orders enable row level security;

-- "Automatically expose new tables" is disabled on this project, so grants
-- are explicit. Only the server-side service role gets access — anon and
-- authenticated deliberately get nothing.
grant select, insert, update, delete on public.orders to service_role;
