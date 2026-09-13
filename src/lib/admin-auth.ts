import 'server-only';
import { cookies } from 'next/headers';

export const adminCookie = 'wedding-admin';
export function adminConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_PUBLISHABLE_KEY && process.env.ADMIN_USER_ID && process.env.SITE_URL);
}
export async function authRequest(path: string, init?: RequestInit) {
  return fetch(`${process.env.SUPABASE_URL}/auth/v1/${path}`, {
    ...init, headers: { apikey: process.env.SUPABASE_PUBLISHABLE_KEY!, 'Content-Type': 'application/json', ...init?.headers }, cache: 'no-store'
  });
}
export async function isAdmin() {
  if (!adminConfigured()) return false;
  const token = (await cookies()).get(adminCookie)?.value;
  if (!token) return false;
  try {
    const response = await authRequest('user', { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) return false;
    const user = await response.json();
    return user.id === process.env.ADMIN_USER_ID && Boolean(user.email_confirmed_at);
  } catch { return false; }
}
