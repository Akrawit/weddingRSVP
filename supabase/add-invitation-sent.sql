-- Add a private organizer-side delivery marker to an existing guest table.
alter table public.wedding_guests
  add column if not exists invitation_sent boolean not null default false;
