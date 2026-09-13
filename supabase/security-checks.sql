-- Run after schema.sql in a disposable Supabase development database.
-- Rolls back all inserted test data. Throws on missing constraints or public access.
begin;
do $$
declare test_id uuid;
begin
  if has_table_privilege('anon', 'public.wedding_guests', 'select') or
     has_table_privilege('authenticated', 'public.wedding_guests', 'select') or
     has_table_privilege('anon', 'public.wedding_guests', 'update') or
     has_table_privilege('authenticated', 'public.wedding_guests', 'update') or
     has_table_privilege('anon', 'public.wedding_guests', 'insert') or
     has_table_privilege('authenticated', 'public.wedding_guests', 'insert') or
     has_table_privilege('anon', 'public.wedding_guests', 'delete') or
     has_table_privilege('authenticated', 'public.wedding_guests', 'delete') then
    raise exception 'Browser roles must have no guest privileges';
  end if;
  if not (select relrowsecurity from pg_class where oid = 'public.wedding_guests'::regclass) then
    raise exception 'Guest RLS must be enabled';
  end if;
  insert into public.wedding_guests(display_name, seats_allocated) values ('Security test', 2) returning id into test_id;
  if not (select invitation_token ~ '^[a-f0-9]{64}$' from public.wedding_guests where id = test_id) then
    raise exception 'Token format is invalid';
  end if;
  begin
    update public.wedding_guests set rsvp_status = 'accepted', seats_confirmed = 3 where id = test_id;
    raise exception 'Seat limit was not enforced';
  exception when check_violation then null;
  end;
  begin
    update public.wedding_guests set rsvp_status = 'declined', seats_confirmed = 1 where id = test_id;
    raise exception 'Decline seat constraint was not enforced';
  exception when check_violation then null;
  end;
  begin
    update public.wedding_guests set rsvp_status = 'accepted', seats_confirmed = 2, plus_one_name = 'Not allowed' where id = test_id;
    raise exception 'Plus-one permission was not enforced';
  exception when check_violation then null;
  end;
  update public.wedding_guests set rsvp_status = 'accepted', seats_confirmed = 2 where id = test_id;
end;
$$;
rollback;

