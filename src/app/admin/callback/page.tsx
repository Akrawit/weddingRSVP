'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import '../admin.css';

export default function AdminCallback() {
  const [error, setError] = useState('');
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const token = fragment.get('access_token');
    window.history.replaceState(null, '', '/admin/callback');
    if (!token) { queueMicrotask(() => setError('This sign-in link is invalid or expired. Please request a new one.')); return; }
    fetch('/api/admin/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ access_token: token }) })
      .then(response => {
        if (!response.ok) throw new Error('This sign-in link is invalid or expired. Please request a new one.');
        window.location.replace('/admin');
      })
      .catch(e => setError(e.message));
  }, []);
  return <main className="admin-login"><p className="eyebrow">YOUR WEDDING, TOGETHER</p><h1>Guest list</h1>{error ? <><p role="alert" className="admin-error">{error}</p><Link href="/admin">Request a new link ↗</Link></> : <p role="status">Signing you in…</p>}</main>;
}
