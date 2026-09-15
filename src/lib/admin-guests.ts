import 'server-only';
import type { AdminGuest, GuestInput } from './admin';
import { createInvitationToken } from './tokens';
import { HttpError } from './http';

async function database(query: string, init?: RequestInit) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/wedding_guests${query}`, {
    ...init, headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=representation', ...init?.headers }, cache: 'no-store'
  });
  if (!response.ok) {
    if (response.status === 400 || response.status === 409) throw new HttpError('These changes conflict with an existing RSVP. Keep enough seats for confirmed attendees and preserve any named plus-one.', 409);
    throw new Error('Guest database unavailable');
  }
  return response.json();
}
export async function listGuests(): Promise<AdminGuest[]> {
  const guests: AdminGuest[] = [];
  // Continue until empty rather than assuming the project's configured API row limit.
  for (let offset = 0; ; ) {
    const batch: AdminGuest[] = await database(`?select=*&order=created_at.desc,id.desc&offset=${offset}&limit=500`);
    guests.push(...batch);
    if (!batch.length) break;
    offset += batch.length;
  }
  return guests;
}
export async function createGuests(inputs: GuestInput[]) {
  return database('', { method: 'POST', body: JSON.stringify(inputs.map(input => ({ ...input, invitation_token: createInvitationToken() }))) });
}
export async function updateGuest(id: string, input: GuestInput) {
  const result = await database(`?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify(input) });
  if (result.length !== 1) throw new HttpError('This invitation no longer exists.', 404);
}
export async function updateInvitationSent(id: string, invitationSent: boolean) {
  const result = await database(`?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify({ invitation_sent: invitationSent }) });
  if (result.length !== 1) throw new HttpError('This invitation no longer exists.', 404);
}
export async function updateVipStatus(id: string, isVip: boolean) {
  const result = await database(`?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify({ is_vip: isVip }) });
  if (result.length !== 1) throw new HttpError('This invitation no longer exists.', 404);
}
export async function deleteGuest(id: string) {
  const result = await database(`?id=eq.${id}`, { method: 'DELETE' });
  if (result.length !== 1) throw new HttpError('This invitation no longer exists.', 404);
}

