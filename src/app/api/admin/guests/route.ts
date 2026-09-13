import type { NextRequest } from 'next/server';
import { isAdmin } from '@/lib/admin-auth';
import { createGuests, deleteGuest, listGuests, updateGuest } from '@/lib/admin-guests';
import { exportGuestCsv, parseGuestCsv, validateGuest } from '@/lib/admin';
import { apiError, apiJson, checkOrigin, HttpError, readJson } from '@/lib/http';

async function authorize() { if (!await isAdmin()) throw new HttpError('Please sign in again.', 401); }
export async function GET(request: NextRequest) {
  try {
    await authorize();
    const guests = await listGuests();
    if (request.nextUrl.searchParams.get('format') === 'csv') return new Response(exportGuestCsv(guests, new URL(process.env.SITE_URL!).origin), { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="wedding-guests.csv"', 'Cache-Control': 'private, no-store' } });
    return apiJson({ guests });
  } catch (error) { return apiError(error); }
}
export async function POST(request: NextRequest) {
  try {
    checkOrigin(request); await authorize();
    const input = await readJson(request, 300000) as Record<string, unknown>;
    let guests;
    try { guests = input && typeof input.csv === 'string' ? parseGuestCsv(input.csv) : [validateGuest(input)]; }
    catch (error) { throw new HttpError((error as Error).message); }
    await createGuests(guests);
    return apiJson({ created: guests.length }, 201);
  } catch (error) { return apiError(error); }
}
export async function PATCH(request: NextRequest) {
  try {
    checkOrigin(request); await authorize();
    const input = await readJson(request) as Record<string, unknown>;
    const id = checkedId(input?.id);
    let guest;
    try { guest = validateGuest(input); } catch (error) { throw new HttpError((error as Error).message); }
    await updateGuest(id, guest);
    return apiJson({ ok: true });
  } catch (error) { return apiError(error); }
}
export async function DELETE(request: NextRequest) {
  try {
    checkOrigin(request); await authorize();
    const input = await readJson(request) as Record<string, unknown>;
    await deleteGuest(checkedId(input?.id));
    return apiJson({ ok: true });
  } catch (error) { return apiError(error); }
}
function checkedId(value: unknown) {
  if (typeof value !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value)) throw new HttpError('Invalid invitation.');
  return value;
}
