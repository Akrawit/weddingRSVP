'use client';

import { useEffect, useRef, useState } from 'react';
import type { Language } from '@/lib/wedding';

type Stage = 'sealed' | 'opening' | 'leaving' | 'done';

export function EnvelopeIntro({ name, language }: { name: string; language: Language }) {
  const [stage, setStage] = useState<Stage>('sealed');
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      timers.current = [setTimeout(() => setStage('done'), 0)];
      return () => timers.current.forEach(clearTimeout);
    }
    timers.current = [
      setTimeout(() => setStage('opening'), 450),
      setTimeout(() => setStage('leaving'), 1800),
      setTimeout(() => setStage('done'), 2250)
    ];
    return () => timers.current.forEach(clearTimeout);
  }, []);

  if (stage === 'done') return null;

  const addressee = language === 'th' ? `เรียน ${name}` : `To ${name}`;
  return <button
    type="button"
    className={`envelope-intro envelope-intro-${stage}`}
    onClick={() => { timers.current.forEach(clearTimeout); setStage('done'); }}
    aria-label={language === 'th' ? `เปิดคำเชิญสำหรับ ${name}` : `Open invitation for ${name}`}
  >
    <span className="envelope-intro-kicker">NEW & SAI · 21.11.2026</span>
    <span className="envelope-art" aria-hidden="true">
      <span className="envelope-back" />
      <span className="envelope-card"><span>NEW <i>&</i> SAI</span><small>21 NOVEMBER 2026</small></span>
      <span className="envelope-flap" />
      <span className="envelope-front" />
      <span className="envelope-address">{addressee}</span>
    </span>
    <span className="envelope-intro-hint">{language === 'th' ? 'แตะเพื่อเปิดคำเชิญ' : 'Tap to open invitation'}</span>
  </button>;
}
