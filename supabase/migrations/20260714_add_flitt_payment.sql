-- Flitt payment gateway support: allow 'flitt' as a payment provider and
-- store the Flitt payment id plus the moment the payment was approved.

alter table public.orders
  drop constraint orders_payment_provider_check;

alter table public.orders
  add constraint orders_payment_provider_check
  check (payment_provider in ('tbc', 'bog', 'flitt'));

alter table public.orders
  add column flitt_payment_id text unique,
  add column paid_at timestamptz;
