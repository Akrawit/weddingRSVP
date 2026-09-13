'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { guestTotals, parseGuestCsv, type AdminGuest, type GuestInput } from '@/lib/admin';
import { wedding, weddingDate } from '@/lib/wedding';

const empty: GuestInput = { display_name: '', seats_allocated: 1, preferred_language: 'th', plus_one_allowed: false, table_number: null };
export function GuestManager({ initialGuests, setupRequired = false, siteOrigin }: { initialGuests: AdminGuest[]; setupRequired?: boolean; siteOrigin?: string }) {
  const router = useRouter();
  const [guests, setGuests] = useState(initialGuests);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [updated, setUpdated] = useState<string | null>(null);
  const [editor, setEditor] = useState<'new' | AdminGuest | null>(null);
  const [draft, setDraft] = useState<GuestInput>(empty);
  const [deleting, setDeleting] = useState<AdminGuest | null>(null);
  const [csv, setCsv] = useState('');
  const [importRows, setImportRows] = useState<GuestInput[]>([]);
  const [importOpen, setImportOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const mutation = useRef(false);
  const totals = guestTotals(guests);
  const visible = guests.filter(g => (filter === 'all' || g.rsvp_status === filter) && `${g.display_name} ${g.plus_one_name} ${g.table_number ?? ''}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()));

  const refresh = useCallback(async () => {
    if (setupRequired) return;
    const response = await fetch('/api/admin/guests', { cache: 'no-store' });
    if (response.status === 401) { router.refresh(); throw new Error('Your session expired. Please sign in again.'); }
    if (!response.ok) throw new Error('Could not refresh the guest list. The displayed totals may be out of date.');
    const data = await response.json();
    setGuests(data.guests); setUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  }, [router, setupRequired]);

  useEffect(() => {
    if (setupRequired) return;
    const poll = () => { if (document.visibilityState === 'visible' && !mutation.current) refresh().then(() => setError('')).catch(e => setError(e.message)); };
    const timer = setInterval(poll, 60000);
    document.addEventListener('visibilitychange', poll);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', poll); };
  }, [refresh, setupRequired]);

  const isDialogOpen = Boolean(editor || deleting || importOpen);
  useEffect(() => {
    if (isDialogOpen) { dialog.current?.showModal(); document.body.style.overflow = 'hidden'; }
    else { dialog.current?.close(); document.body.style.overflow = ''; }
    return () => { document.body.style.overflow = ''; };
  }, [isDialogOpen]);

  function closeDialog() { if (!mutation.current) { setEditor(null); setDeleting(null); setImportOpen(false); } }
  async function change(method: string, body: unknown, success: string) {
    if (mutation.current) return;
    mutation.current = true; setBusy(true); setError(''); setNotice('');
    try {
      const response = await fetch('/api/admin/guests', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await response.json();
      if (!response.ok) { if (response.status === 401) router.refresh(); throw new Error(data.error); }
      setEditor(null); setDeleting(null); setImportOpen(false); setNotice(success);
      await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : 'Request failed. Please refresh before retrying.'); }
    finally { mutation.current = false; setBusy(false); }
  }
  function edit(guest?: AdminGuest) { setError(''); setDraft(guest ? { display_name: guest.display_name, seats_allocated: guest.seats_allocated, preferred_language: guest.preferred_language, plus_one_allowed: guest.plus_one_allowed, table_number: guest.table_number } : { ...empty }); setEditor(guest ?? 'new'); }
  async function copyInvitation(guest: AdminGuest) {
    const url = `${siteOrigin || location.origin}/i/${guest.invitation_token}`;
    try { await navigator.clipboard.writeText(url); setNotice(`Invitation link copied for ${guest.display_name}.`); }
    catch { setNotice(`Copy this invitation link: ${url}`); }
  }
  async function readFile(file?: File) {
    setError(''); setImportRows([]); setCsv('');
    if (!file) return;
    try {
      if (file.size > 250000) throw new Error('Choose a CSV smaller than 250 KB.');
      const text = await file.text(); const rows = parseGuestCsv(text);
      setCsv(text); setImportRows(rows); setImportOpen(true);
    } catch (e) { setError((e as Error).message); }
    if (fileInput.current) fileInput.current.value = '';
  }
  async function signOut() {
    try { const response = await fetch('/api/admin/session', { method: 'DELETE' }); if (!response.ok) throw new Error(); router.refresh(); }
    catch { setError('Could not sign out. Please try again.'); }
  }
  const metric = (value: number) => setupRequired ? '—' : value;

  return <main className="admin-page">
    <header className="admin-header"><div><Link href="/" className="admin-brand">{wedding.names.join(' & ')}</Link><span>WEDDING RSVP</span></div><nav><a href="/" target="_blank" rel="noreferrer">View invitation ↗</a>{!setupRequired && <button onClick={signOut}>Sign out</button>}</nav></header>
    <div className="admin-title"><div><p className="eyebrow">{weddingDate('en', { day: 'numeric', month: 'long', year: 'numeric' })} · {wedding.venue}</p><h1>Who’s coming?</h1><p>Your replies, your people, your headcount.</p></div><button className="admin-primary" onClick={() => edit()} disabled={setupRequired}>＋ Add invitation</button></div>
    {setupRequired && <section className="admin-setup"><strong>Connect your guest list to start collecting RSVPs.</strong><p>The invitation currently saves preview replies only in each visitor’s browser. No shared guest count is available yet.</p><details><summary>What needs to be connected?</summary><ol><li>Create a Supabase project and apply the included guest schema.</li><li>Create your organizer account in Supabase Authentication.</li><li>Set the database URL, service key, publishable key, organizer user ID and site URL in the server environment.</li><li>Sign in here, add your invitations, then send each personal link through LINE.</li></ol><p>Instructions are in the project’s README. Never share server keys with guests.</p></details></section>}
    <section className="headcount-grid" aria-label="RSVP totals"><div className="headcount-main"><p>CONFIRMED GUESTS</p><strong>{metric(totals.confirmedPeople)}</strong><span>people attending</span><p className="headcount-note">{setupRequired ? 'Waiting for connection' : `From ${totals.accepted} accepted invitation${totals.accepted === 1 ? '' : 's'}`}</p></div><div className="headcount-secondary"><div><span>Invitations</span><strong>{metric(totals.invitations)}</strong><small>personal links</small></div><div><span>Accepted</span><strong>{metric(totals.accepted)}</strong><small>invitations</small></div><div><span>Still waiting</span><strong>{metric(totals.waiting)}</strong><small>invitations</small></div><div><span>Declined</span><strong>{metric(totals.declined)}</strong><small>invitations</small></div></div></section>
    <div className="admin-progress"><span>{setupRequired ? 'Replies will appear here once connected.' : `${totals.accepted + totals.declined} of ${totals.invitations} invitations have replied`}</span><span>{updated ? `Updated ${updated} · ` : ''}{setupRequired ? '' : 'Refreshes every minute'}</span></div>
    {!setupRequired && <progress aria-label="Invitations replied" max={totals.invitations || 1} value={totals.accepted + totals.declined} />}
    {error && !isDialogOpen && <p role="alert" className="admin-error">{error}</p>}{notice && <p role="status" className="admin-notice">{notice}</p>}
    <section className="guest-list"><div className="guest-list-heading"><h2>Guest list</h2><div><button disabled={setupRequired || busy} onClick={() => { setBusy(true); refresh().then(() => setError('')).catch(e => setError(e.message)).finally(() => setBusy(false)); }}>Refresh</button><button disabled={setupRequired} onClick={() => fileInput.current?.click()}>Import CSV</button>{!setupRequired ? <a href="/api/admin/guests?format=csv">Export CSV ↓</a> : <button disabled>Export CSV ↓</button>}</div></div><input type="file" ref={fileInput} accept=".csv,text/csv" className="sr-only" tabIndex={-1} onChange={e => readFile(e.target.files?.[0])} aria-label="Import guest CSV" />
      <div className="guest-filters"><label><span className="sr-only">Search guests</span><input type="search" placeholder="Search by name or table…" value={query} onChange={e => setQuery(e.target.value)} /></label><label><span className="sr-only">RSVP status</span><select value={filter} onChange={e => setFilter(e.target.value)}><option value="all">All replies</option><option value="accepted">Accepted</option><option value="waiting">Waiting</option><option value="declined">Declined</option></select></label></div>
      <div className="guest-table-wrap"><table><thead><tr><th>Guest / party</th><th>RSVP</th><th>Attending</th><th>Dietary needs</th><th>Table</th><th>Invitation</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{visible.map(guest => <tr key={guest.id}><td><strong>{guest.display_name}</strong>{guest.plus_one_name && <small>With {guest.plus_one_name}</small>}<small>{guest.preferred_language === 'th' ? 'Thai' : 'English'}</small></td><td><span className={`rsvp-badge ${guest.rsvp_status}`}>{guest.rsvp_status}</span></td><td className="attendee-cell">{guest.rsvp_status === 'accepted' ? guest.seats_confirmed : '—'}</td><td className="dietary-cell">{guest.dietary_requirement || '—'}</td><td>{guest.table_number || '—'}</td><td><button onClick={() => copyInvitation(guest)}>Copy link ↗</button></td><td className="row-actions"><button aria-label={`Edit ${guest.display_name}`} onClick={() => edit(guest)}>Edit</button><button aria-label={`Delete ${guest.display_name}`} onClick={() => { setError(''); setDeleting(guest); }}>Delete</button></td></tr>)}</tbody></table></div>
      {!visible.length && <div className="admin-empty"><span aria-hidden="true">♡</span><h3>{setupRequired ? 'A place for every reply.' : guests.length ? 'No matching invitations.' : 'Start with your guest list.'}</h3><p>{setupRequired ? 'Connect the database to see confirmed guests here.' : guests.length ? 'Try another name or RSVP filter.' : 'Add one invitation per person or family. Each party can confirm its own headcount.'}</p>{!setupRequired && !guests.length && <button className="admin-primary" onClick={() => edit()}>Add your first invitation</button>}</div>}
      {!setupRequired && <div className="guest-list-footer"><span>{visible.length} of {guests.length} invitations shown</span><span>Headcount always includes the full guest list.</span></div>}
    </section><p className="admin-explainer">One invitation can include several people. The confirmed headcount adds their attendee numbers. Edited RSVPs replace the previous reply.</p>
    <dialog ref={dialog} className="admin-dialog" aria-labelledby="admin-dialog-title" onCancel={e => { if (busy) e.preventDefault(); else closeDialog(); }} onClick={e => { if (e.target === dialog.current) closeDialog(); }}><div><button className="admin-close" aria-label="Close" disabled={busy} onClick={closeDialog}>×</button>
      {editor && <form onSubmit={e => { e.preventDefault(); change(editor === 'new' ? 'POST' : 'PATCH', { ...draft, ...(editor === 'new' ? {} : { id: editor.id }) }, editor === 'new' ? 'Invitation created. Copy its link to send through LINE.' : 'Invitation updated.'); }}><h2 id="admin-dialog-title">{editor === 'new' ? 'Add an invitation' : 'Edit invitation'}</h2><p>One person or family, one personal link.</p><label>Guest or family name<input required maxLength={150} value={draft.display_name} onChange={e => setDraft({ ...draft, display_name: e.target.value })} /></label><label>Language<select value={draft.preferred_language} onChange={e => setDraft({ ...draft, preferred_language: e.target.value as 'en' | 'th' })}><option value="en">English</option><option value="th">Thai</option></select></label>{error && <p role="alert" className="admin-error">{error}</p>}<button className="admin-primary" disabled={busy}>{busy ? 'Saving…' : editor === 'new' ? 'Create invitation' : 'Save changes'}</button></form>}
      {deleting && <div><h2 id="admin-dialog-title">Delete this invitation?</h2><p>{deleting.display_name}’s link will stop working and their reply will be removed from the headcount.</p>{error && <p role="alert" className="admin-error">{error}</p>}<div className="admin-dialog-actions"><button onClick={closeDialog} disabled={busy}>Keep invitation</button><button className="admin-danger" disabled={busy} onClick={() => change('DELETE', { id: deleting.id }, 'Invitation deleted.')}>{busy ? 'Deleting…' : 'Delete invitation'}</button></div></div>}
      {importOpen && <div><h2 id="admin-dialog-title">Review your import</h2><p>{importRows.length} new invitations</p><div className="import-preview">{importRows.slice(0, 8).map((g, i) => <p key={i}><span>{g.display_name}</span><span>{g.preferred_language.toUpperCase()}</span></p>)}{importRows.length > 8 && <p>…and {importRows.length - 8} more</p>}</div><p>Each row creates a new personal link. Import a file only once; existing names are not merged. Optional column: plus_one_allowed (true/false).</p>{error && <p role="alert" className="admin-error">{error}</p>}<button className="admin-primary" disabled={busy} onClick={() => change('POST', { csv }, `${importRows.length} invitations imported.`)}>{busy ? 'Importing…' : `Import ${importRows.length} invitations`}</button></div>}
    </div></dialog>
  </main>;
}
