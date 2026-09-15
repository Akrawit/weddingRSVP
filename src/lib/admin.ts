import type { Guest } from './guest';

export type AdminGuest = Guest & { id: string; invitation_token: string; invitation_sent: boolean; rsvp_at: string | null; created_at: string };
export type GuestInput = Pick<Guest, 'display_name' | 'preferred_language' | 'seats_allocated' | 'plus_one_allowed' | 'table_number'>;

export function guestTotals(guests: Guest[]) {
  return guests.reduce((total, guest) => {
    total.invitations++;
    total.invitedPeople += guest.seats_allocated;
    total[guest.rsvp_status]++;
    if (guest.rsvp_status === 'accepted') total.confirmedPeople += guest.seats_confirmed;
    if (guest.rsvp_status === 'waiting') total.waitingPeople += guest.seats_allocated;
    return total;
  }, { invitations: 0, invitedPeople: 0, accepted: 0, declined: 0, waiting: 0, confirmedPeople: 0, waitingPeople: 0 });
}

export function validateGuest(value: unknown): GuestInput {
  if (!value || typeof value !== 'object') throw new Error('Please check the guest details.');
  const v = value as Record<string, unknown>;
  if (typeof v.display_name !== 'string' || !v.display_name.trim() || v.display_name.trim().length > 150) throw new Error('Enter a guest name of 1–150 characters.');
  if (/[\u0000-\u001F\u007F]/.test(v.display_name)) throw new Error('Guest name cannot contain control characters.');
  if (!Number.isInteger(v.seats_allocated) || (v.seats_allocated as number) < 1 || (v.seats_allocated as number) > 20) throw new Error('Allocate between 1 and 20 seats.');
  if (v.preferred_language !== 'en' && v.preferred_language !== 'th') throw new Error('Choose English or Thai.');
  if (typeof v.plus_one_allowed !== 'boolean') throw new Error('Check the plus-one setting.');
  if (v.table_number !== null && (typeof v.table_number !== 'string' || v.table_number.trim().length > 30)) throw new Error('Table number must be at most 30 characters.');
  if (typeof v.table_number === 'string' && /[\u0000-\u001F\u007F]/.test(v.table_number)) throw new Error('Table number cannot contain control characters.');
  return {
    display_name: v.display_name.trim(), seats_allocated: v.seats_allocated as number,
    preferred_language: v.preferred_language, plus_one_allowed: v.plus_one_allowed,
    table_number: typeof v.table_number === 'string' ? v.table_number.trim() || null : null
  };
}

export function parseGuestCsv(csv: string): GuestInput[] {
  if (new TextEncoder().encode(csv).byteLength > 250000) throw new Error('CSV must be smaller than 250 KB.');
  const rows: string[][] = [];
  let row: string[] = [], cell = '', quoted = false, closed = false;
  const finishCell = () => { row.push(cell); cell = ''; closed = false; };
  const finishRow = () => { finishCell(); if (row.some(x => x.trim())) rows.push(row); row = []; };
  csv = csv.replace(/^\uFEFF/, '');
  for (let i = 0; i < csv.length; i++) {
    const char = csv[i];
    if (quoted) {
      if (char === '"' && csv[i + 1] === '"') { cell += '"'; i++; }
      else if (char === '"') { quoted = false; closed = true; }
      else cell += char;
    } else if (char === ',' ) finishCell();
    else if (char === '\n' || char === '\r') { if (char === '\r' && csv[i + 1] === '\n') i++; finishRow(); }
    else if (char === '"' && !cell && !closed) quoted = true;
    else if (closed || char === '"') throw new Error('CSV contains an invalid quoted field.');
    else cell += char;
  }
  if (quoted) throw new Error('CSV contains an unclosed quote.');
  if (cell || row.length) finishRow();
  if (rows.length < 2) throw new Error('CSV needs a header and at least one guest.');
  if (rows.length > 1001) throw new Error('Import at most 1,000 invitations at a time.');
  const header = rows.shift()!.map(x => x.trim().toLowerCase());
  if (new Set(header).size !== header.length || !['name', 'seats', 'language', 'table'].every(key => header.includes(key))) throw new Error('Required CSV columns: name,seats,language,table.');
  return rows.map((columns, index) => {
    if (columns.length !== header.length) throw new Error(`Row ${index + 2}: column count does not match the header.`);
    const get = (key: string) => columns[header.indexOf(key)]?.trim() ?? '';
    const seats = get('seats');
    const plus = get('plus_one_allowed');
    if (!/^\d+$/.test(seats)) throw new Error(`Row ${index + 2}: seats must be a whole number.`);
    if (plus && plus !== 'true' && plus !== 'false') throw new Error(`Row ${index + 2}: plus_one_allowed must be true or false.`);
    try {
      return validateGuest({ display_name: get('name'), seats_allocated: Number(seats), preferred_language: get('language'), table_number: get('table') || null, plus_one_allowed: plus === 'true' });
    } catch (e) { throw new Error(`Row ${index + 2}: ${(e as Error).message}`); }
  });
}

export function exportGuestCsv(guests: AdminGuest[], origin: string) {
  const safeCell = (value: unknown) => {
    let text = String(value ?? '');
    if (/^[\s]*[=+@\-]/.test(text) || /^[\t\r\n]/.test(text)) text = "'" + text;
    return '"' + text.replaceAll('"', '""') + '"';
  };
  const rows = [['name', 'seats', 'language', 'table', 'plus_one_allowed', 'rsvp', 'attendees', 'plus_one_name', 'dietary', 'invitation_url'], ...guests.map(g => [g.display_name, g.seats_allocated, g.preferred_language, g.table_number, g.plus_one_allowed, g.rsvp_status, g.seats_confirmed, g.plus_one_name, g.dietary_requirement, `${origin}/i/${g.invitation_token}`])];
  return '\uFEFF' + rows.map(row => row.map(safeCell).join(',')).join('\r\n');
}
