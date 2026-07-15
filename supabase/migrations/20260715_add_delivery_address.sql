-- Delivery address details, shown/required depending on the delivery zone:
--   tbilisi: district + address + recipient + phone required
--   regions: region + city + address + recipient + phone required
-- label and courier comment are always optional; region/city are null for
-- tbilisi; district is optional for regions. Enforced by the API.

alter table public.orders
  add column delivery_label text,
  add column delivery_region text,
  add column delivery_city text,
  add column delivery_district text,
  add column delivery_address text,
  add column delivery_recipient text,
  add column delivery_phone text,
  add column delivery_comment text;
