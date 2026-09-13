// Exercise the real production HTTP routes against an isolated Supabase test double.
// This verifies application authorization and RSVP-to-headcount behavior, not Postgres RLS.
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { guestTotals } from '../src/lib/admin.ts';

const project = fileURLToPath(new URL('..', import.meta.url));
const adminId = randomUUID();
const defaults = { preferred_language: 'en', seats_confirmed: 0, plus_one_allowed: true, plus_one_name: '', rsvp_status: 'waiting', dietary_requirement: '', table_number: null, rsvp_at: null, created_at: '2026-09-10T00:00:00Z' };
let guests = [
  { ...defaults, id: randomUUID(), display_name: 'Fixture accepted family', seats_allocated: 2, seats_confirmed: 2, rsvp_status: 'accepted', invitation_token: 'a'.repeat(64) },
  { ...defaults, id: randomUUID(), display_name: 'Fixture waiting family', seats_allocated: 3, invitation_token: 'b'.repeat(64) }
];
const mock = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const send = (value, status = 200) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(value)); };
  let raw = ''; for await (const chunk of req) raw += chunk;
  const body = raw ? JSON.parse(raw) : {};
  if (url.pathname === `/auth/v1/admin/users/${adminId}`) return req.headers.authorization === 'Bearer fixture-service-key' ? send({ id: adminId, email: 'owner@example.test' }) : send({}, 403);
  if (url.pathname === '/auth/v1/otp') return body.email === 'owner@example.test' && body.create_user === false && url.searchParams.get('redirect_to') === `${origin}/admin/callback` ? send({}) : send({}, 400);
  if (url.pathname === '/auth/v1/user') {
    if (req.headers.authorization === 'Bearer fixture-session') return send({ id: adminId, email_confirmed_at: '2026-01-01' });
    if (req.headers.authorization === 'Bearer other-account') return send({ id: 'different-user', email_confirmed_at: '2026-01-01' });
    return send({}, 401);
  }
  if (url.pathname !== '/rest/v1/wedding_guests' || req.headers.apikey !== 'fixture-service-key') return send({}, 403);
  const target = guests.filter(g => (!url.searchParams.has('id') || 'eq.' + g.id === url.searchParams.get('id')) && (!url.searchParams.has('invitation_token') || 'eq.' + g.invitation_token === url.searchParams.get('invitation_token')));
  if (req.method === 'GET') {
    // Simulate a project row cap lower than the app's requested 500-row page size.
    const offset = Number(url.searchParams.get('offset') || 0);
    const rows = target.slice(offset, offset + Math.min(Number(url.searchParams.get('limit') || 2), 2));
    const fields = url.searchParams.get('select');
    return send(fields && fields !== '*' ? rows.map(g => Object.fromEntries(fields.split(',').map(k => [k, g[k]]))) : rows);
  }
  if (req.method === 'POST') { const rows = body.map(g => ({ ...defaults, ...g, id: randomUUID() })); guests.push(...rows); return send(rows, 201); }
  if (req.method === 'PATCH') {
    const rows = target.map(g => ({ ...g, ...body }));
    if (rows.some(g => g.seats_confirmed < 0 || (g.rsvp_status === 'accepted' ? g.seats_confirmed < 1 : g.seats_confirmed !== 0) || (!g.plus_one_allowed && g.plus_one_name))) return send({}, 400);
    guests = guests.map(g => rows.find(row => row.id === g.id) ?? g); return send(rows);
  }
  if (req.method === 'DELETE') { guests = guests.filter(g => !target.some(row => row.id === g.id)); return send(target); }
  return send({}, 405);
});
mock.listen(0, '127.0.0.1'); await once(mock, 'listening');
const reservation = createServer(); reservation.listen(0, '127.0.0.1'); await once(reservation, 'listening');
const port = reservation.address().port; await new Promise(resolve => reservation.close(resolve));
const origin = `http://127.0.0.1:${port}`;
const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', String(port)], {
  cwd: project, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
  env: { ...process.env, SITE_URL: origin, SUPABASE_URL: `http://127.0.0.1:${mock.address().port}`, SUPABASE_SERVICE_ROLE_KEY: 'fixture-service-key', SUPABASE_PUBLISHABLE_KEY: 'fixture-publishable-key', ADMIN_USER_ID: adminId, NEXT_TELEMETRY_DISABLED: '1' }
});
let logs = ''; child.stdout.on('data', chunk => logs += chunk); child.stderr.on('data', chunk => logs += chunk);
let cookie = '';
const request = (path, method = 'GET', body, extra = {}) => fetch(origin + path, { method, headers: { origin, 'Content-Type': 'application/json', ...(cookie ? { cookie } : {}), ...extra }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
try {
  let ready = false;
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(origin)).ok) { ready = true; break; } } catch { /* Wait for startup. */ }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.ok(ready, logs);
  assert.equal((await request('/api/admin/guests')).status, 401);
  assert.equal((await request('/api/admin/guests?format=csv')).status, 401);
  assert.equal((await request('/api/admin/guests', 'POST', {})).status, 401);
  assert.equal((await request('/api/admin/guests', 'PATCH', {})).status, 401);
  assert.equal((await request('/api/admin/guests', 'DELETE', {})).status, 401);
  const loggedOut = await (await request('/admin')).text();
  assert.ok(loggedOut.includes('Email me a sign-in link'));
  assert.ok(!loggedOut.includes('Fixture accepted family'));
  assert.equal((await request('/api/admin/magic-link', 'POST', { email: 'stranger@example.test' })).status, 200);
  assert.equal((await request('/api/admin/magic-link', 'POST', { email: 'owner@example.test' })).status, 200);
  assert.equal((await request('/api/admin/session', 'POST', { access_token: 'forged' })).status, 401);
  assert.equal((await request('/api/admin/session', 'POST', { access_token: 'other-account' })).status, 403);
  const login = await request('/api/admin/session', 'POST', { access_token: 'fixture-session' });
  assert.equal(login.status, 200);
  const setCookie = login.headers.get('set-cookie');
  assert.ok(setCookie.includes('HttpOnly') && setCookie.includes('SameSite=strict'));
  cookie = setCookie.split(';')[0];
  assert.equal((await request('/api/admin/guests', 'GET', undefined, { cookie: 'wedding-admin=other-account' })).status, 401);
  assert.equal((await request('/api/admin/guests', 'GET', undefined, { cookie: 'wedding-admin=forged' })).status, 401);
  const list = async () => (await (await request('/api/admin/guests')).json()).guests;
  assert.equal(guestTotals(await list()).confirmedPeople, 2);
  const token = 'b'.repeat(64);
  const reply = (seats, status = 'accepted') => request(`/api/rsvp/${token}`, 'POST', { rsvp_status: status, seats_confirmed: seats, plus_one_name: '', dietary_requirement: 'Vegetarian' });
  assert.equal((await reply(4)).status, 200);
  assert.equal(guestTotals(await list()).confirmedPeople, 6);
  assert.equal((await reply(0)).status, 400);
  assert.equal((await reply(2)).status, 200);
  assert.equal(guestTotals(await list()).confirmedPeople, 4);
  assert.equal((await reply(1)).status, 200);
  assert.equal(guestTotals(await list()).confirmedPeople, 3);
  assert.equal((await list()).length, 2);
  assert.equal((await reply(0, 'declined')).status, 200);
  assert.equal(guestTotals(await list()).confirmedPeople, 2);
  assert.equal((await request('/api/admin/guests', 'POST', {}, { origin: 'https://untrusted.test' })).status, 403);
  assert.equal((await request(`/api/rsvp/${token}`, 'POST', {}, { origin: 'https://untrusted.test' })).status, 403);
  assert.equal((await request(`/api/rsvp/${token}`, 'POST', { oversized: 'x'.repeat(5000) })).status, 413);
  assert.equal((await request('/api/admin/guests', 'POST', { csv: 'name,seats,language,table\nNew family,2,en,1\nInvalid,99,en,2' })).status, 400);
  assert.equal((await list()).length, 2);
  assert.equal((await request('/api/admin/guests', 'POST', { csv: 'name,seats,language,table\nNew family,2,en,1\nคุณสมชาย,3,th,2' })).status, 201);
  const rows = await list(); assert.equal(rows.length, 4);
  assert.equal(new Set(rows.map(g => g.invitation_token)).size, 4);
  assert.ok(rows.every(g => /^[a-f0-9]{64}$/.test(g.invitation_token)));
  const newGuest = rows[2];
  assert.equal((await request('/api/admin/guests', 'PATCH', { ...newGuest, table_number: '8' })).status, 200);
  assert.equal((await list()).find(g => g.id === newGuest.id).table_number, '8');
  assert.equal((await request('/api/admin/guests', 'DELETE', { id: newGuest.id })).status, 200);
  assert.equal((await list()).length, 3);
  const exported = await (await request('/api/admin/guests?format=csv')).text();
  assert.ok(exported.includes('invitation_url') && exported.includes('/i/' + token));
  const page = await (await request('/i/' + token)).text();
  assert.ok(page.includes('Fixture waiting family'));
  assert.ok(!page.includes('Fixture accepted family'));
  assert.ok(!page.includes('fixture-service-key'));
  const englishPage = await (await request('/i/' + token + '?lang=en')).text();
  assert.ok(englishPage.includes('Confirm attendance'));
  assert.ok(englishPage.includes('lang="en"'));
  assert.equal((await request('/api/admin/session', 'DELETE')).status, 200);
  console.log('PASS: admin authorization, secure session cookie, uncapped party headcounts, RSVP edits, declines, CSRF, body limits, atomic CSV validation, pagination, CRUD, export, and guest isolation.');
} catch (error) { console.error(logs); throw error; }
finally { child.kill(); mock.closeAllConnections(); await new Promise(resolve => mock.close(resolve)); }

