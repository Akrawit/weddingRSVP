-- Initial schema. Apply in a Supabase SQL editor before enabling real invitations.
-- No browser role can read or mutate guest data. Access is through server-only routes.
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create table public.wedding_guests (
  id uuid primary key default gen_random_uuid(),
  invitation_token text not null unique default encode(extensions.gen_random_bytes(32), 'hex')
    check (invitation_token ~ '^[a-f0-9]{64}$'),
  display_name text not null check (char_length(btrim(display_name)) between 1 and 150),
  preferred_language text not null default 'en' check (preferred_language in ('en', 'th')),
  seats_allocated integer not null default 1 check (seats_allocated between 1 and 20),
  seats_confirmed integer not null default 0 check (seats_confirmed >= 0),
  plus_one_allowed boolean not null default false,
  plus_one_name text not null default '' check (char_length(plus_one_name) <= 120),
  rsvp_status text not null default 'waiting' check (rsvp_status in ('waiting', 'accepted', 'declined')),
  dietary_requirement text not null default '' check (char_length(dietary_requirement) <= 500),
  table_number text check (char_length(table_number) <= 30),
  invitation_opened_at timestamptz,
  rsvp_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint confirmed_status check (
    (rsvp_status = 'accepted' and seats_confirmed >= 1) or
    (rsvp_status in ('waiting', 'declined') and seats_confirmed = 0)
  ),
  constraint plus_one_permission check (plus_one_allowed or plus_one_name = ''),
  constraint plus_one_attending check (seats_confirmed > 1 or plus_one_name = '')
);

alter table public.wedding_guests enable row level security;
revoke all on public.wedding_guests from anon, authenticated;
grant select, insert, update, delete on public.wedding_guests to service_role;
-- Deliberately no public RLS policies: possession of the server credential is required.

create function public.set_wedding_guest_updated_at() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
revoke all on function public.set_wedding_guest_updated_at() from public, anon, authenticated;
grant execute on function public.set_wedding_guest_updated_at() to service_role;
create trigger wedding_guests_updated_at before update on public.wedding_guests
for each row execute function public.set_wedding_guest_updated_at();

-- Example (run separately):
-- insert into public.wedding_guests (display_name, seats_allocated, preferred_language, plus_one_allowed)
-- values ('Joe & Family', 2, 'en', true) returning invitation_token;
-- The returned cryptographic bearer token is the /i/{token} URL suffix.

