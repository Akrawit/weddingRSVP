-- Add a private organizer-side VIP marker to an existing guest table.
alter table public.wedding_guests
  add column if not exists is_vip boolean not null default false;
