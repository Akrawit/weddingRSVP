import 'server-only';
import type { Guest, Rsvp } from './guest';
import { isToken } from './tokens';

const columns = 'display_name,preferred_language,seats_allocated,seats_confirmed,plus_one_allowed,plus_one_name,rsvp_status,dietary_requirement,table_number';
function config() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Database is not configured');
  return { url, key };
}
export async function getGuest(token: string): Promise<Guest | null> {
  if (!isToken(token)) return null;
  const { url, key } = config();
  const response = await fetch(`${url}/rest/v1/wedding_guests?invitation_token=eq.${token}&select=${columns}&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: 'no-store'
  });
  if (!response.ok) throw new Error('Guest lookup failed');
  const rows: Guest[] = await response.json();
  return rows[0] ?? null;
}
export async function saveRsvp(token: string, rsvp: Rsvp) {
  if (!isToken(token)) throw new Error('Invalid token');
  const { url, key } = config();
  const response = await fetch(`${url}/rest/v1/wedding_guests?invitation_token=eq.${token}`, {
    method: 'PATCH', headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify({ ...rsvp, rsvp_at: new Date().toISOString() }), cache: 'no-store'
  });
  if (!response.ok) throw new Error('RSVP update failed');
  const rows: unknown[] = await response.json();
  if (rows.length !== 1) throw new Error('Invitation unavailable');
}

