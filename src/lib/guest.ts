export type Guest = {
  display_name: string;
  preferred_language: 'en' | 'th';
  seats_allocated: number;
  seats_confirmed: number;
  plus_one_allowed: boolean;
  plus_one_name: string;
  rsvp_status: 'waiting' | 'accepted' | 'declined';
  dietary_requirement: string;
  table_number: string | null;
};
export type Rsvp = Pick<Guest, 'rsvp_status' | 'seats_confirmed' | 'plus_one_name' | 'dietary_requirement'>;
export const demoGuest: Guest = {
  display_name: "P’Joe & Family", preferred_language: 'en', seats_allocated: 2,
  seats_confirmed: 0, plus_one_allowed: true, plus_one_name: '',
  rsvp_status: 'waiting', dietary_requirement: '', table_number: '12'
};
function normalizeText(value: unknown, limit: number, error: string) {
  if (typeof value !== 'string') throw new Error(error);
  const normalized = value.trim();
  if (normalized.includes('\0') || Array.from(normalized).length > limit) throw new Error(error);
  return normalized;
}
export function validateRsvp(value: unknown, guest: Pick<Guest, 'seats_allocated' | 'plus_one_allowed'>): Rsvp {
  if (!value || typeof value !== 'object') throw new Error('invalid');
  const v = value as Record<string, unknown>;
  if (v.rsvp_status !== 'accepted' && v.rsvp_status !== 'declined') throw new Error('status');
  const dietary = normalizeText(v.dietary_requirement, 500, 'dietary');
  const plusOne = normalizeText(v.plus_one_name, 120, 'name');
  if (!Number.isInteger(v.seats_confirmed)) throw new Error('seats');
  const seats = v.seats_confirmed as number;
  if (v.rsvp_status === 'accepted' && (seats < 1 || seats > guest.seats_allocated)) throw new Error('seats');
  if (v.rsvp_status === 'declined' && seats !== 0) throw new Error('seats');
  if (!guest.plus_one_allowed && plusOne) throw new Error('plus-one');
  return {
    rsvp_status: v.rsvp_status, seats_confirmed: seats,
    plus_one_name: seats > 1 ? plusOne : '',
    dietary_requirement: v.rsvp_status === 'accepted' ? dietary : ''
  };
}
export function weddingDay(date: string, now = new Date()): 'today' | 'tomorrow' | null {
  const bangkok = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  const diff = Math.round((Date.parse(date + 'T00:00:00Z') - Date.parse(bangkok + 'T00:00:00Z')) / 86400000);
  return diff === 0 ? 'today' : diff === 1 ? 'tomorrow' : null;
}
