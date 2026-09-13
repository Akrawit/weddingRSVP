import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateRsvp, weddingDay, demoGuest } from '../src/lib/guest.ts';
import { createInvitationToken, isToken } from '../src/lib/tokens.ts';
const valid = { rsvp_status: 'accepted', seats_confirmed: 2, plus_one_name: '  Pim  ', dietary_requirement: '  Vegetarian  ' };
test('tokens are 256-bit random values; malformed and sequential tokens are rejected', () => {
  const tokens = Array.from({ length: 100 }, createInvitationToken);
  assert.equal(new Set(tokens).size, 100);
  assert.ok(tokens.every(isToken));
  for (const token of ['1', '12345', '', '../admin', 'x'.repeat(64), 'a'.repeat(63)]) assert.equal(isToken(token), false);
});
test('accepts a positive headcount and normalizes input', () => {
  assert.deepEqual(validateRsvp(valid, demoGuest), { ...valid, plus_one_name: 'Pim', dietary_requirement: 'Vegetarian' });
});
test('accepts headcounts above the old allocation', () => {
  assert.equal(validateRsvp({ ...valid, seats_confirmed: 30 }, demoGuest).seats_confirmed, 30);
});
test('rejects zero, fractions, strings, negatives and counts beyond the database integer range', () => {
  for (const seats_confirmed of [0, 1.5, '2', -1, NaN, 2147483648]) assert.throws(() => validateRsvp({ ...valid, seats_confirmed }, demoGuest));
});
test('decline must confirm zero seats and clears dietary and plus-one information', () => {
  assert.throws(() => validateRsvp({ ...valid, rsvp_status: 'declined' }, demoGuest));
  assert.deepEqual(validateRsvp({ ...valid, rsvp_status: 'declined', seats_confirmed: 0 }, demoGuest), { rsvp_status: 'declined', seats_confirmed: 0, plus_one_name: '', dietary_requirement: '' });
});
test('cannot add plus one without explicit permission', () => {
  assert.throws(() => validateRsvp(valid, { ...demoGuest, plus_one_allowed: false }));
});
test('rejects invalid status, missing values and oversized strings', () => {
  for (const payload of [null, 'data', {}, { ...valid, rsvp_status: 'waiting' }, { ...valid, plus_one_name: 'x'.repeat(121) }, { ...valid, dietary_requirement: 'x'.repeat(501) }, { ...valid, plus_one_name: 'Pim\0' }, { ...valid, dietary_requirement: 'Vegetarian\0' }]) assert.throws(() => validateRsvp(payload, demoGuest));
});
test('applies text limits to trimmed Unicode characters as stored by Postgres', () => {
  const plus_one_name = `  ${'💍'.repeat(120)}  `;
  const dietary_requirement = `  ${'🌿'.repeat(500)}  `;
  assert.deepEqual(validateRsvp({ ...valid, plus_one_name, dietary_requirement }, demoGuest), {
    ...valid,
    plus_one_name: plus_one_name.trim(),
    dietary_requirement: dietary_requirement.trim()
  });
  assert.throws(() => validateRsvp({ ...valid, plus_one_name: '💍'.repeat(121) }, demoGuest));
  assert.throws(() => validateRsvp({ ...valid, dietary_requirement: '🌿'.repeat(501) }, demoGuest));
});
test('ignores attempts to write protected guest fields', () => {
  const result = validateRsvp({ ...valid, seats_allocated: 99, invitation_token: 'stolen', table_number: '1' }, demoGuest);
  assert.equal('invitation_token' in result, false);
  assert.equal('seats_allocated' in result, false);
  assert.equal('table_number' in result, false);
});
test('Bangkok date boundaries correctly distinguish today, tomorrow, and other days', () => {
  assert.equal(weddingDay('2026-11-21', new Date('2026-11-19T17:00:00Z')), 'tomorrow');
  assert.equal(weddingDay('2026-11-21', new Date('2026-11-20T16:59:59Z')), 'tomorrow');
  assert.equal(weddingDay('2026-11-21', new Date('2026-11-20T17:00:00Z')), 'today');
  assert.equal(weddingDay('2026-11-21', new Date('2026-11-21T17:00:00Z')), null);
  assert.equal(weddingDay('2026-11-21', new Date('2026-09-09T00:00:00Z')), null);
});
