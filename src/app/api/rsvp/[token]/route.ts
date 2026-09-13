import { NextRequest } from 'next/server';
import { getGuest, saveRsvp } from '@/lib/server-guests';
import { validateRsvp } from '@/lib/guest';
import { apiError, apiJson, checkOrigin, HttpError, readJson } from '@/lib/http';

export async function POST(request: NextRequest, context: { params: Promise<{ token: string }> }) {
  try {
    checkOrigin(request);
    const input = await readJson(request);
    const { token } = await context.params;
    const guest = await getGuest(token);
    if (!guest) throw new HttpError('Invitation unavailable', 404);
    let rsvp;
    try { rsvp = validateRsvp(input, guest); }
    catch { throw new HttpError('Please check your reply'); }
    await saveRsvp(token, rsvp);
    return apiJson({ ok: true });
  } catch (error) { return apiError(error); }
}
