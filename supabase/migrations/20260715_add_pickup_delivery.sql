-- Third delivery option: free pickup from our location. No address fields
-- are collected for it (delivery_* columns stay null).

alter table public.orders
  drop constraint orders_delivery_check;

alter table public.orders
  add constraint orders_delivery_check
  check (delivery in ('tbilisi', 'regions', 'pickup'));
