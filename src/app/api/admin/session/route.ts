import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { adminConfigured, adminCookie, authRequest } from '@/lib/admin-auth';
import { apiError, apiJson, checkOrigin, HttpError, readJson } from '@/lib/http';

export async function POST(request: NextRequest) {
  try {
    checkOrigin(request);
    if (!adminConfigured()) throw new HttpError('Guest collection has not been configured yet.', 503);
    const input = await readJson(request) as Record<string, unknown>;
    if (!input || typeof input.access_token !== 'string' || input.access_token.length > 4096 || !input.access_token) throw new HttpError('Sign-in link is invalid.', 401);
    const response = await authRequest('user', { headers: { Authorization: `Bearer ${input.access_token}` } });
    if (!response.ok) throw new HttpError('Sign-in link is invalid or expired.', 401);
    const user = await response.json();
    if (user.id !== process.env.ADMIN_USER_ID || !user.email_confirmed_at) throw new HttpError('This account cannot access the guest list.', 403);
    (await cookies()).set(adminCookie, input.access_token, {
      httpOnly: true, secure: process.env.SITE_URL!.startsWith('https://'), sameSite: 'strict', path: '/', maxAge: 3600
    });
    return apiJson({ ok: true });
  } catch (error) { return apiError(error); }
}
export async function DELETE(request: NextRequest) {
  try {
    checkOrigin(request);
    (await cookies()).delete(adminCookie);
    return apiJson({ ok: true });
  } catch (error) { return apiError(error); }
}
