'use client';
import Link from 'next/link';
import { useState } from 'react';

export function AdminLogin() {
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/admin/magic-link', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: form.get('email') }) });
      if (!response.ok) { const data = await response.json(); throw new Error(data.error); }
      setSent(true);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to send the link. Please try again.'); }
    finally { setBusy(false); }
  }
  return <main className="admin-login"><p className="eyebrow">YOUR WEDDING, TOGETHER</p><h1>Guest list</h1><p>Enter your organizer email and we’ll send you a sign-in link.</p><form onSubmit={submit}><label>Email<input type="email" name="email" autoComplete="email" required maxLength={254} /></label>{error && <p role="alert" className="admin-error">{error}</p>}{sent && <p role="status">If this is your organizer email, check your inbox for a sign-in link.</p>}<button className="admin-primary" disabled={busy}>{busy ? 'Sending…' : 'Email me a sign-in link'}</button></form><p className="admin-small">Only your designated organizer account can access the guest list.</p><Link href="/">View invitation ↗</Link></main>;
}
