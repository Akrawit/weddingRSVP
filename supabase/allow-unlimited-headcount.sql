-- Apply once to the existing wedding_guests table before deploying the updated RSVP form.
-- The accepted/waiting/declined status constraint still enforces a positive accepted count
-- and zero for other statuses. The integer column itself has a 2,147,483,647 ceiling.
alter table public.wedding_guests
  drop constraint wedding_guests_check;

alter table public.wedding_guests
  add constraint wedding_guests_seats_confirmed_nonnegative
  check (seats_confirmed >= 0);
