'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { wedding, weddingDate, type Language } from '@/lib/wedding';
import { copy } from '@/lib/copy';
import { weddingDay, validateRsvp, type Guest, type Rsvp } from '@/lib/guest';

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d={diagonal ? 'M6 18 18 6M6 6h12v12' : 'M4 12h15m-5-5 5 5-5 5'} /></svg>;
}
function Flower() {
  return <svg className="flower" viewBox="0 0 100 120" fill="none" stroke="currentColor" strokeWidth=".7" aria-hidden="true"><path d="M48 116c5-27 9-47 6-72M50 89C29 88 22 75 22 66c18 1 27 11 28 23ZM52 77c16-3 23-15 22-23-15 3-20 13-22 23Z" /><path d="M54 45C28 54 23 32 36 27 22 11 43 2 49 20 50-3 72 5 65 24 83 10 96 29 73 37 96 43 81 61 65 47 65 69 42 64 54 45Z" /><circle cx="58" cy="35" r="7" /></svg>;
}

export function Invitation({ guest: initialGuest, token, demo = false, initialLanguage = 'th' }: { guest: Guest; token?: string; demo?: boolean; initialLanguage?: Language }) {
  const [lang, setLang] = useState<Language>(initialLanguage);
  const [guest, setGuest] = useState(initialGuest);
  const [modal, setModal] = useState<'rsvp' | null>(null);
  const [sent, setSent] = useState(false);
  const [status, setStatus] = useState<'accepted' | 'declined'>(initialGuest.rsvp_status === 'declined' ? 'declined' : 'accepted');
  const [seats, setSeats] = useState(initialGuest.seats_confirmed || 1);
  const [dietary, setDietary] = useState(initialGuest.dietary_requirement);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const [day, setDay] = useState<'today' | 'tomorrow' | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const c = copy[lang];
  const couple = wedding.names.join(' & ');
  const numericDate = wedding.date.split('-').reverse();

  useEffect(() => {
    if (!demo) return;
    try {
      const saved = localStorage.getItem('ap-demo-rsvp-v1');
      if (saved) {
        const rsvp = validateRsvp(JSON.parse(saved), initialGuest);
        // Read browser-only demo storage after hydration to keep server HTML deterministic.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setGuest({ ...initialGuest, ...rsvp });
        setStatus(rsvp.rsvp_status === 'declined' ? 'declined' : 'accepted');
        setSeats(rsvp.seats_confirmed || 1);
        setDietary(rsvp.dietary_requirement);
      }
    } catch { /* Storage can be unavailable in private embedded browsers. */ }
  }, [demo, initialGuest]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    const update = () => setDay(weddingDay(wedding.date));
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (modal) {
      dialog.current?.showModal();
      document.body.style.overflow = 'hidden';
    } else {
      dialog.current?.close();
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [modal]);

  function openRsvp() { setSent(false); setError(false); setModal('rsvp'); }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setError(false);
    try {
      const value: Rsvp = validateRsvp({ rsvp_status: status, seats_confirmed: status === 'declined' ? 0 : seats, plus_one_name: '', dietary_requirement: dietary }, guest);
      if (demo) localStorage.setItem('ap-demo-rsvp-v1', JSON.stringify(value));
      else {
        const result = await fetch(`/api/rsvp/${token}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value) });
        if (!result.ok) throw new Error('save');
      }
      setGuest({ ...guest, ...value }); setSent(true);
    } catch { setError(true); }
    finally { setSaving(false); }
  }

  return <div className={`invitation ${lang === 'th' ? 'thai' : ''}`} lang={lang}>
    <a className="skip-link" href="#details">{c.skip}</a>
    <header className="site-header">
      <a className="monogram" href="#home" aria-label={c.backToTop}>{wedding.monogram}</a>
      <span className="header-note">{c.invitation}</span>
      <nav aria-label={lang === 'en' ? 'Main navigation' : 'เมนูหลัก'}>
        <a className="desktop-link" href="#details">{c.details}</a>
        <a className="desktop-link" href="#moments">{c.moments}</a>
        <div className="language-switch" role="group" aria-label={c.language}><button aria-label={c.switchThai} aria-pressed={lang === 'th'} onClick={() => setLang('th')}>TH</button><span aria-hidden="true">/</span><button aria-label={c.switchEnglish} aria-pressed={lang === 'en'} onClick={() => setLang('en')}>EN</button></div>
        <button className="header-rsvp" onClick={openRsvp}>{c.rsvp}<Arrow /></button>
      </nav>
    </header>

    {demo && <aside className="preview-notice"><span>{c.demo}</span><Link href="/admin">{c.ownerView} ↗</Link></aside>}
    <main>
      {day && guest.rsvp_status === 'accepted' && <section className="day-banner" aria-label={c.dayInfo}>
        <div><p className="eyebrow">{c[day]} ♡</p><p>{c.begins}</p></div>
        {guest.table_number && <div><span className="eyebrow">{c.yourTable}</span><p>{c.table} {guest.table_number}</p></div>}
        <a className="button" href={wedding.mapsUrl} target="_blank" rel="noreferrer">{c.directions}<Arrow diagonal /></a>
      </section>}

      <section id="home" className="hero">
        <div className="hero-copy">
          <div className="personal-note"><p className="eyebrow">{c.dear} {guest.display_name}</p><p>{c.intro}<br />{c.intro2}</p></div>
          <h1><span>{wedding.names[0]}</span><span className="ampersand">&</span><span>{wedding.names[1]}</span></h1>
          <p className="hero-invite">{c.invite}<br />{c.invite2}</p>
          <div className="hero-date"><span>{numericDate[0]}</span><i /><span>{numericDate[1]}</span><i /><span>{numericDate[2]}</span></div>
          <p className="eyebrow hero-city">{wedding.city[lang].toUpperCase()}</p>
          <div className="hero-rsvp"><button className="button" onClick={openRsvp}>{guest.rsvp_status === 'waiting' ? c.rsvp : c.edit}<Arrow /></button><p aria-live="polite">{guest.rsvp_status === 'accepted' ? `✓ ${guest.seats_confirmed} ${c.confirmedGuests}` : guest.rsvp_status === 'declined' ? `✓ ${c.replySaved}` : c.headcountNote}</p><span>{c.replyBy} {wedding.rsvpBy[lang]}</span></div>
          <a className="scroll-cue" href="#details"><span>{c.scroll}</span><span className="scroll-line">↓</span></a>
        </div>
        <div className="hero-photo"><Image src={wedding.hero} alt={lang === 'en' ? 'Cartoon illustration of New and Sai beside a sunlit window' : 'ภาพการ์ตูน New และ Sai ริมหน้าต่าง'} fill sizes="(max-width: 700px) 100vw, 50vw" priority /><div className="photo-overlay"><span>NEW & SAI</span><span>01 / 04</span></div><span className="photo-script">see you there!</span></div>
      </section>

      <div className="date-strip"><span>{weddingDate(lang, { weekday: 'long' }).toUpperCase()}</span><span className="date-strip-main">{numericDate[0]} <em>{weddingDate(lang, { month: 'long' }).toUpperCase()}</em> {weddingDate(lang, { year: 'numeric' })}</span><span>{wedding.venue.toUpperCase()} · {wedding.city[lang].split(",")[0].toUpperCase()}</span></div>

      <section id="details" className="section celebration">
        <div className="section-intro"><p className="eyebrow">{c.celebration}</p><h2>{c.celebrationTitle}<br /><em>{c.celebrationItalic}</em></h2><p className="body-copy">{c.venueCopy}</p><Flower /></div>
        <div className="details-list">
          <div className="detail-row"><span className="detail-number">01</span><div><p className="eyebrow">{c.dateLabel}</p><h3>{weddingDate(lang, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h3><a className="text-link" href="/calendar">{c.calendar}<span aria-hidden="true">＋</span></a></div></div>
          <div className="detail-row"><span className="detail-number">02</span><div><p className="eyebrow">{c.timeLabel}</p><h3>{c.timeFull}</h3><p className="muted">{lang === 'en' ? 'Welcome at 18:00 · Ceremony at 19:00' : 'ต้อนรับแขก 18:00 น. · พิธีการ 19:00 น.'}</p></div></div>
          <div className="detail-row"><span className="detail-number">03</span><div><p className="eyebrow">{c.placeLabel}</p><h3>{wedding.venue}</h3><p className="muted address">{wedding.address[lang]}</p><a className="text-link" href={wedding.mapsUrl} target="_blank" rel="noreferrer">{c.directions}<Arrow diagonal /></a></div></div>
        </div>
      </section>

      <section className="schedule-section section">
        <div><p className="eyebrow">{c.schedule}</p><h2>{c.scheduleTitle}</h2><p className="schedule-note">{lang === 'en' ? 'Dinner and time to catch up.' : 'กินข้าวและพูดคุยกัน'}</p></div>
        <ol className="timeline">{wedding.schedule.map((item, i) => <li key={item.time}><span className="timeline-time">{item.time}</span><span className="timeline-dot" /><div><h3>{item[lang]}</h3><p>{item.detail[lang]}</p></div><span className="timeline-index">0{i + 1}</span></li>)}</ol>
      </section>

      <section className="dress-section section" id="dress-code"><h2>{c.dress}</h2><p className="body-copy">{c.dressCopy}</p><div className="swatches">{wedding.colors.map(color => <div key={color.hex}><span className="swatch" style={{ background: color.hex }} /><span>{color[lang]}</span></div>)}</div></section>

      <section id="moments" className="section gallery-section"><div className="gallery-layout">{wedding.gallery.map((photo, i) => <figure key={photo.src} className={`gallery-photo gallery-photo-${i + 1}`}><div><Image src={photo.src} alt={photo.alt[lang]} fill sizes="(max-width: 700px) 80vw, 40vw" /></div><figcaption><span>0{i + 2}</span><span>{i === 1 ? c.photoLabel : couple.toUpperCase() + ' · ' + numericDate[2]}</span></figcaption></figure>)}</div></section>

      <section className="reply-section" id="reply"><p className="eyebrow">{c.dear} {guest.display_name}</p><h2>{guest.rsvp_status === 'waiting' ? c.replyTitle : guest.rsvp_status === 'accepted' ? c.success : c.declineTitle}</h2><p>{guest.rsvp_status === 'waiting' ? c.replyCopy : guest.rsvp_status === 'accepted' ? c.successCopy : c.declineCopy}</p><button className="button" onClick={openRsvp}>{guest.rsvp_status === 'waiting' ? c.rsvp : c.edit}<Arrow /></button><p className="reply-deadline">{c.replyBy} {wedding.rsvpBy[lang]}</p><span className="reserved"><span aria-hidden="true">♡</span> {c.headcountNote}</span></section>
    </main>

    <footer><div className="footer-top"><span className="eyebrow">{c.withLove}</span><span className="footer-names">{wedding.names[0]} <em>&</em> {wedding.names[1]}</span><span className="footer-date">{numericDate.join(".")}</span></div></footer>

    {!modal && <div className="mobile-rsvp-bar"><span>{guest.rsvp_status === 'waiting' ? c.headcountNote : c.replySaved}</span><button className="button" onClick={openRsvp}>{guest.rsvp_status === 'waiting' ? c.rsvp : c.edit}<Arrow /></button></div>}
    <dialog ref={dialog} className="invitation-dialog" aria-labelledby="modal-title" onCancel={() => setModal(null)} onClick={e => { if (e.target === dialog.current) setModal(null); }}>
      <div className="dialog-content"><button className="close-button" aria-label={c.close} onClick={() => setModal(null)}>×</button><span className="dialog-monogram">{wedding.monogram}</span>
        {modal === 'rsvp' && (sent ? <div className="success-state"><span className="success-mark">{status === 'accepted' ? '✓' : '♡'}</span><p className="eyebrow" id="modal-title">{status === 'accepted' ? c.success : c.declineTitle}</p><h2>{lang === 'en' ? 'Thanks for replying!' : 'ขอบคุณที่ตอบกลับนะคะ'}</h2><p>{status === 'accepted' ? c.successCopy : c.declineCopy}</p>{status === 'accepted' && <a className="text-link" href="/calendar">{c.calendar} ＋</a>}<button className="button" onClick={() => setModal(null)}>{c.done}<Arrow /></button>{demo && <p className="demo-note">{c.demo}</p>}</div> : <form onSubmit={submit}><p className="eyebrow">{c.dear} {guest.display_name}</p><h2 id="modal-title">{c.replyTitle}</h2><p className="dialog-subtitle">{c.rsvpSubtitle}</p><fieldset className="attendance"><legend className="sr-only">{c.rsvp}</legend><label className={status === 'accepted' ? 'selected' : ''}><input type="radio" name="attendance" value="accepted" checked={status === 'accepted'} onChange={() => setStatus('accepted')} /><span>{c.accept}</span><span aria-hidden="true">♡</span></label><label className={status === 'declined' ? 'selected' : ''}><input type="radio" name="attendance" value="declined" checked={status === 'declined'} onChange={() => setStatus('declined')} /><span>{c.decline}</span><span aria-hidden="true">—</span></label></fieldset>
          {status === 'accepted' && <div className="rsvp-fields"><div className="seat-field"><div><label htmlFor="seats">{c.attending}</label><p>{c.headcountNote}</p></div><input id="seats" type="number" inputMode="numeric" min={1} max={2147483647} required value={seats} onChange={e => setSeats(Number(e.target.value))} /></div><label className="field">{c.dietary} <span>({c.optional})</span><textarea value={dietary} onChange={e => setDietary(e.target.value)} maxLength={500} placeholder={c.dietaryPlaceholder} rows={3} /></label></div>}
          {error && <p className="form-error" role="alert">{c.error}</p>}<button type="submit" className="button submit-button" disabled={saving}>{saving ? c.saving : c.submit}<Arrow /></button>{demo && <p className="demo-note">{c.demo}</p>}</form>)}
      </div>
    </dialog>
  </div>;
}
