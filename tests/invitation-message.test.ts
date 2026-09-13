import { test } from 'node:test';
import assert from 'node:assert/strict';
import { invitationMessage } from '../src/lib/invitation-message.ts';

test('LINE invitation includes the invited party, wedding details, and personal RSVP link', () => {
  const url = `https://example.test/i/${'a'.repeat(64)}`;
  const message = invitationMessage('คุณสมชายและครอบครัว', url);
  assert.match(message, /^เรียนเชิญ คุณสมชายและครอบครัว มาร่วมแสดงความยินดี/);
  assert.match(message, /New & Sai/);
  assert.match(message, /21 พฤศจิกายน 2569 ณ Oyard/);
  assert.match(message, /พิธีรับไหว้ 16:00 น. · ต้อนรับแขก 18:00 น. · พิธีการ 19:00 น./);
  assert.ok(message.endsWith(url));
});
