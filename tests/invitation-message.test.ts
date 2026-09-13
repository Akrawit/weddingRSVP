import { test } from 'node:test';
import assert from 'node:assert/strict';
import { invitationMessage, invitationUrl } from '../src/lib/invitation-message.ts';

test('LINE invitation includes the invited party, wedding details, and personal RSVP link', () => {
  const url = `https://example.test/i/${'a'.repeat(64)}`;
  const message = invitationMessage('คุณสมชายและครอบครัว', url, 'th');
  assert.match(message, /^เรียนเชิญ คุณสมชายและครอบครัว มาร่วมแสดงความยินดี/);
  assert.match(message, /New & Sai/);
  assert.match(message, /21 พฤศจิกายน 2569 ณ Oyard/);
  assert.match(message, /พิธีรับไหว้ 16:00 น. · ต้อนรับแขก 18:00 น. · พิธีการ 19:00 น./);
  assert.ok(message.endsWith(url));
});

test('English LINE invitation uses an English-opening personal link', () => {
  const url = invitationUrl('https://example.test', 'b'.repeat(64), 'en');
  const message = invitationMessage('Joe & Family', url, 'en');
  assert.equal(url, `https://example.test/i/${'b'.repeat(64)}?lang=en`);
  assert.match(message, /^Dear Joe & Family,/);
  assert.match(message, /21 November 2026 at Oyard/);
  assert.match(message, /Please RSVP and let us know how many people will attend:/);
  assert.ok(message.endsWith(url));
  assert.equal(invitationUrl('https://example.test', 'a'.repeat(64), 'th'), `https://example.test/i/${'a'.repeat(64)}`);
});
