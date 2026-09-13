import type { NextRequest } from 'next/server';
import { adminConfigured, authRequest } from '@/lib/admin-auth';
import { apiError, apiJson, checkOrigin, HttpError, readJson } from '@/lib/http';

export async function POST(request: NextRequest) {
  try {
    checkOrigin(request);
    if (!adminConfigured()) throw new HttpError('Guest collection has not been configured yet.', 503);
    const input = await readJson(request) as Record<string, unknown>;
    if (!input || typeof input.email !== 'string' || input.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) throw new HttpError('Enter a valid email address.');
    const email = input.email.trim();
    const owner = await fetch(`${process.env.SUPABASE_URL}/auth/v1/admin/users/${encodeURIComponent(process.env.ADMIN_USER_ID!)}`, {
      headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}` }, cache: 'no-store'
    });
    if (!owner.ok) throw new HttpError('Unable to send the link. Please try again.', 503);
    const user = await owner.json();
    if (typeof user.email === 'string' && user.email.toLowerCase() === email.toLowerCase()) {
      const redirect = new URL('/admin/callback', process.env.SITE_URL).toString();
      const response = await authRequest(`otp?redirect_to=${encodeURIComponent(redirect)}`, { method: 'POST', body: JSON.stringify({ email, create_user: false }) });
      if (!response.ok) throw new HttpError('Unable to send the link. Please try again.', 503);
    }
    return apiJson({ ok: true });
  } catch (error) { return apiError(error); }
}
