-- Manufacturing time (standard 5-10 days / express 24-48h; express only for
-- quantity <= 2, enforced by the API) and delivery zone (flat fee: tbilisi
-- 15 GEL / regions 25 GEL, included in total_price).
-- Nullable because orders predating this feature have neither.

alter table public.orders
  add column manufacturing_time text
    check (manufacturing_time in ('standard', 'express')),
  add column delivery text
    check (delivery in ('tbilisi', 'regions'));
