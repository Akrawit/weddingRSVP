import { test } from 'node:test';
import assert from 'node:assert/strict';
import { guestTotals, parseGuestCsv, validateGuest, exportGuestCsv } from '../src/lib/admin.ts';
import { demoGuest } from '../src/lib/guest.ts';

test('headcount sums people, distinguishes invitations and excludes declines/waiting', () => {
  const guests = [{ ...demoGuest, rsvp_status: 'accepted' as const, seats_confirmed: 2 }, { ...demoGuest, rsvp_status: 'accepted' as const, seats_confirmed: 1 }, { ...demoGuest, rsvp_status: 'declined' as const }, demoGuest];
  assert.deepEqual(guestTotals(guests), { invitations: 4, invitedPeople: 8, accepted: 2, declined: 1, waiting: 1, confirmedPeople: 3, waitingPeople: 2 });
  guests[0] = { ...guests[0], seats_confirmed: 1 };
  assert.equal(guestTotals(guests).confirmedPeople, 2);
  assert.equal(guestTotals([]).confirmedPeople, 0);
});
test('CSV supports BOM, CRLF, Thai names, quoted commas, escaped quotes and optional plus-one', () => {
  const result = parseGuestCsv('\uFEFFname,seats,language,table,plus_one_allowed\r\n"Joe, family",2,en,12,true\r\n"คุณ \"\"สมชาย\"\"",3,th,,false\r\n');
  assert.equal(result.length, 2);
  assert.equal(result[0].display_name, 'Joe, family');
  assert.equal(result[0].plus_one_allowed, true);
  assert.equal(result[1].display_name, 'คุณ "สมชาย"');
  assert.equal(result[1].table_number, null);
});
test('CSV rejects malformed rows, excessive allocations, partial numbers and unclosed quotes', () => {
  for (const csv of ['name,seats,language,table\nJoe,21,en,1', 'name,seats,language,table\nJoe,2x,en,1', 'name,seats,language,table\n"Joe,2,en,1', 'name,seats,language,table\nJoe,2,en', 'name,seats,language,table\nJoe,2,jp,1']) assert.throws(() => parseGuestCsv(csv));
});
test('guest writes cannot assign tokens or RSVP fields', () => {
  const value = validateGuest({ ...demoGuest, invitation_token: 'forged', seats_confirmed: 99 });
  assert.equal('invitation_token' in value, false);
  assert.equal('seats_confirmed' in value, false);
  assert.throws(() => validateGuest({ ...demoGuest, seats_allocated: 0 }));
});
test('guest writes reject line-breaking control characters', () => {
  assert.throws(() => validateGuest({ ...demoGuest, display_name: 'Joe\nInjected row' }));
  assert.throws(() => validateGuest({ ...demoGuest, table_number: '12\t=FORMULA()' }));
});
test('CSV size limit measures UTF-8 bytes', () => {
  const oversized = `name,seats,language,table,notes\nJoe,1,en,1,${'ก'.repeat(90000)}`;
  assert.throws(() => parseGuestCsv(oversized), /250 KB/);
});
test('CSV exports invitation URLs and neutralizes spreadsheet formulas', () => {
  const csv = exportGuestCsv([{ ...demoGuest, id: 'id', invitation_token: 'abc', rsvp_at: null, created_at: '', display_name: '=HYPERLINK("bad")' }], 'https://wedding.example');
  assert.ok(csv.includes("\"'=HYPERLINK"));
  assert.ok(csv.includes('https://wedding.example/i/abc'));
});
